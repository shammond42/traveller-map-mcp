import { z } from 'zod';
import { apiGetText } from '../api/client.js';
import { parseSecTabDelimited } from '../parsers/sec.js';

export const name = 'get_sector_data';

export const description =
  'Returns all worlds in a sector (or single subsector) as structured data with decoded UWPs. ' +
  'Useful for bulk analysis, e.g. "which worlds in Spinward Marches have Tech Level 15?" ' +
  'or "list all Naval Bases in the Regina subsector". ' +
  'Returns full world records including trade codes, bases, allegiance, and decoded UWP fields.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  subsector: z
    .string()
    .optional()
    .describe('Limit to a single subsector by letter (A-P) or name'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

export async function handler(args: Input) {
  const { sector, subsector, milieu } = args;

  const text = await apiGetText('/api/sec', {
    sector,
    subsector,
    type: 'TabDelimited',
    milieu,
  });

  const worlds = parseSecTabDelimited(text);

  const result = {
    sector,
    subsector: subsector ?? 'all',
    count: worlds.length,
    worlds,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
