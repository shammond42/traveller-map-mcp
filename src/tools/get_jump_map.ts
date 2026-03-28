import { z } from 'zod';
import { apiGetImage } from '../api/client.js';

export const name = 'get_jump_map';

export const description =
  'Returns a PNG image of the hex map centered on a world, showing all worlds within N jump distance. ' +
  'Great for visualizing routes and nearby systems during a session. ' +
  'Jump range can be 0-20 parsecs (default 2).';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  hex: z.string().describe('Hex location in XXYY format (e.g. "1910" for Regina)'),
  jump: z.number().min(0).max(20).optional().default(2).describe('Jump range in parsecs (0-20, default 2)'),
  scale: z.number().optional().default(64).describe('Pixels per parsec (default 64)'),
  style: z
    .enum(['poster', 'print', 'atlas', 'candy', 'draft', 'fasa', 'terminal', 'mongoose'])
    .optional()
    .default('poster')
    .describe('Visual rendering style'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

export async function handler(args: Input) {
  const { sector, hex, jump, scale, style, milieu } = args;

  const base64 = await apiGetImage('/api/jumpmap', { sector, hex, jump, scale, style, milieu });

  return {
    content: [
      { type: 'image' as const, data: base64, mimeType: 'image/png' },
      {
        type: 'text' as const,
        text: `Jump-${jump} map centered on ${hex} in ${sector}`,
      },
    ],
  };
}
