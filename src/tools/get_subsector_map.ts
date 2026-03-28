import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { apiGetDataUri } from '../api/client.js';

export const name = 'get_subsector_map';

export const description =
  'Returns a PNG image of a named subsector from the official Traveller Map database. ' +
  'Optionally saves the image to a local directory (e.g. an Obsidian vault attachments folder) ' +
  'and returns the saved file path so it can be embedded in notes.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  subsector: z.string().describe('Subsector letter A-P or subsector name (e.g. "A" or "Regina")'),
  scale: z.number().optional().default(64).describe('Pixels per parsec (default 64). Higher = larger image.'),
  style: z
    .enum(['poster', 'print', 'atlas', 'candy', 'draft', 'fasa', 'terminal', 'mongoose'])
    .optional()
    .default('poster')
    .describe('Visual rendering style. Note: candy style returns JPEG instead of PNG.'),
  milieu: z.string().optional().describe('Campaign era (e.g. "M1105" for default Third Imperium 1105)'),
  save_path: z
    .string()
    .optional()
    .describe('Absolute directory path where the image file should be saved'),
  filename: z
    .string()
    .optional()
    .describe(
      'Custom filename without extension (e.g. "regina-map"). ' +
        'Auto-generated as "{sector}-{subsector}-subsector" if omitted.',
    ),
});

export type Input = z.infer<typeof inputSchema>;

function extFromMimeType(mimeType: string): string {
  return mimeType === 'image/jpeg' ? 'jpg' : 'png';
}

function buildFilename(sector: string, subsector: string, customName: string | undefined, ext: string): string {
  let base: string;
  if (customName) {
    base = customName.replace(/\.(png|jpe?g)$/i, '');
  } else {
    base = `${sector}-${subsector}-subsector`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_]/g, '');
  }
  return `${base}.${ext}`;
}

export async function handler(args: Input) {
  const { sector, subsector, scale, style, milieu, save_path, filename } = args;

  const { base64, mimeType } = await apiGetDataUri('/api/poster', {
    sector,
    subsector,
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
  const resolvedFilename = buildFilename(sector, subsector, filename, ext);
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
