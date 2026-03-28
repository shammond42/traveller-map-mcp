import { z } from 'zod';
import { apiGetJson } from '../api/client.js';

export const name = 'get_sector_list';

export const description =
  'Returns a list of all known sectors in the Traveller universe with their names, ' +
  'T5SS abbreviations, and galactic coordinates. ' +
  'Can be filtered by official status (Official, InReview, Preserve, Apocryphal) and campaign era.';

export const inputSchema = z.object({
  milieu: z.string().optional().describe('Campaign era filter (e.g. "M1105")'),
  tag: z
    .enum(['Official', 'InReview', 'Preserve', 'Apocryphal'])
    .optional()
    .describe('Filter by sector data status'),
});

export type Input = z.infer<typeof inputSchema>;

interface Sector {
  Names?: Array<{ Text?: string }>;
  Abbreviation?: string;
  X?: number;
  Y?: number;
  Tags?: string;
  [key: string]: unknown;
}

interface UniverseResponse {
  Sectors?: Sector[];
  [key: string]: unknown;
}

export async function handler(args: Input) {
  const { milieu, tag } = args;

  const data = await apiGetJson<UniverseResponse>('/api/universe', {
    requireData: 1,
    milieu,
    tag,
  });

  const sectors = (data.Sectors ?? [])
    .map((s) => ({
      name: s.Names?.[0]?.Text ?? 'Unknown',
      abbreviation: s.Abbreviation,
      x: s.X,
      y: s.Y,
      tags: s.Tags,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    count: sectors.length,
    sectors,
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
