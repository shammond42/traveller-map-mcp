import { z } from 'zod';
import { apiGetJson } from '../api/client.js';

export const name = 'get_sector_metadata';

export const description =
  'Returns metadata for a sector: subsector names (A-P), allegiance regions, route overlays, and political borders. ' +
  'Use this to discover subsector names before calling get_subsector_map, ' +
  'or to understand the political structure of a sector.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

interface SubsectorMeta {
  Name?: string;
  Index?: string;
  [key: string]: unknown;
}

interface AllegianceMeta {
  Code?: string;
  Name?: string;
  [key: string]: unknown;
}

interface MetadataResponse {
  Names?: Array<{ Text?: string; Lang?: string }>;
  Abbreviation?: string;
  X?: number;
  Y?: number;
  Subsectors?: SubsectorMeta[];
  Allegiances?: AllegianceMeta[];
  [key: string]: unknown;
}

export async function handler(args: Input) {
  const { sector, milieu } = args;

  const data = await apiGetJson<MetadataResponse>('/api/metadata', { sector, milieu });

  const subsectorsByIndex: Record<string, string> = {};
  for (const sub of data.Subsectors ?? []) {
    if (sub.Index && sub.Name) {
      subsectorsByIndex[sub.Index] = sub.Name;
    }
  }

  const subsectors = 'ABCDEFGHIJKLMNOP'.split('').map((letter) => ({
    index: letter,
    name: subsectorsByIndex[letter] ?? `Subsector ${letter}`,
  }));

  const result = {
    names: data.Names?.map((n) => ({ text: n.Text, lang: n.Lang })),
    abbreviation: data.Abbreviation,
    coordinates: { x: data.X, y: data.Y },
    subsectors,
    allegiances: (data.Allegiances ?? []).map((a) => ({
      code: a.Code,
      name: a.Name,
    })),
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
