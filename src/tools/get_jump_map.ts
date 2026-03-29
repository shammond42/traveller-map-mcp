import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { apiGetDataUri } from '../api/client.js';

export const name = 'get_jump_map';

export const description =
  'Returns a PNG image of the hex map centered on a world, showing all worlds within N jump distance. ' +
  'Great for visualizing routes and nearby systems during a session. ' +
  'Optionally saves the image to a local directory (e.g. an Obsidian vault attachments folder) ' +
  'and returns the saved file path so it can be embedded in notes.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  hex: z.string().describe('Hex location in XXYY format (e.g. "1910" for Regina)'),
  jump: z.number().min(0).max(20).optional().default(2).describe('Jump range in parsecs (0-20, default 2)'),
  scale: z.number().optional().default(64).describe('Pixels per parsec (default 64)'),
  style: z
    .enum(['poster', 'print', 'atlas', 'candy', 'draft', 'fasa', 'terminal', 'mongoose'])
    .optional()
    .default('poster')
    .describe('Visual rendering style. Note: candy style returns JPEG instead of PNG.'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
  save_path: z
    .string()
    .optional()
    .describe('Absolute directory path where the image file should be saved'),
  filename: z
    .string()
    .optional()
    .describe(
      'Custom filename without extension (e.g. "regina-jump2"). ' +
        'Auto-generated as "{sector}-{hex}-jump{jump}" if omitted.',
    ),
});

export type Input = z.infer<typeof inputSchema>;

function extFromMimeType(mimeType: string): string {
  return mimeType === 'image/jpeg' ? 'jpg' : 'png';
}

function buildFilename(sector: string, hex: string, jump: number, customName: string | undefined, ext: string): string {
  let base: string;
  if (customName) {
    base = customName.replace(/\.(png|jpe?g)$/i, '');
  } else {
    base = `${sector}-${hex}-jump${jump}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_]/g, '');
  }
  return `${base}.${ext}`;
}

export async function handler(args: Input) {
  const { sector, hex, jump, scale, style, milieu, save_path, filename } = args;

  const { base64, mimeType } = await apiGetDataUri('/api/jumpmap', {
    sector,
    hex,
    jump,
    scale,
    style,
    milieu,
  });

  const imageBlock = { type: 'image' as const, data: base64, mimeType };

  if (!save_path) {
    return { content: [imageBlock] };
  }

  let dirStat;
  try {
    dirStat = await stat(save_path);
  } catch {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Error: save_path directory does not exist: ${save_path}` }],
    };
  }

  if (!dirStat.isDirectory()) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Error: save_path is not a directory: ${save_path}` }],
    };
  }

  const ext = extFromMimeType(mimeType);
  const resolvedFilename = buildFilename(sector, hex, jump, filename, ext);
  const fullPath = join(save_path, resolvedFilename);

  try {
    await writeFile(fullPath, Buffer.from(base64, 'base64'));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Error: Failed to write file: ${message}` }],
    };
  }

  return {
    content: [
      imageBlock,
      { type: 'text' as const, text: `Image saved to: ${fullPath}` },
    ],
  };
}
