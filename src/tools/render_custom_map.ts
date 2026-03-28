import { z } from 'zod';
import { apiPostImage } from '../api/client.js';

export const name = 'render_custom_map';

export const description =
  'Renders a map image from custom SEC-format world data that you provide. ' +
  'Useful for homebrew sectors, campaign-specific maps, or previewing modified sector data. ' +
  'The sec_data parameter accepts T5 Second Survey, T5 tab-delimited, or legacy SEC format.';

export const inputSchema = z.object({
  sec_data: z
    .string()
    .describe('World data in T5 Second Survey, T5 tab-delimited, or legacy SEC format'),
  metadata: z
    .string()
    .optional()
    .describe('Optional sector metadata in XML or MSEC format (defines sector name, subsector names, borders, etc.)'),
  scale: z.number().optional().default(64).describe('Pixels per parsec (default 64)'),
  style: z
    .enum(['poster', 'print', 'atlas', 'candy', 'draft', 'fasa', 'terminal', 'mongoose'])
    .optional()
    .default('poster')
    .describe('Visual rendering style'),
  subsector: z
    .string()
    .optional()
    .describe('Render only this subsector (A-P letter) instead of the full sector'),
});

export type Input = z.infer<typeof inputSchema>;

export async function handler(args: Input) {
  const { sec_data, metadata, scale, style, subsector } = args;

  const formBody: Record<string, string> = { data: sec_data };
  if (metadata) formBody['metadata'] = metadata;

  const base64 = await apiPostImage(
    '/api/poster',
    { scale, style, subsector },
    formBody,
  );

  return {
    content: [
      { type: 'image' as const, data: base64, mimeType: 'image/png' },
      {
        type: 'text' as const,
        text: `Custom sector map rendered${subsector ? ` (subsector ${subsector})` : ''}`,
      },
    ],
  };
}
