import { z } from 'zod';
import { apiGetJson } from '../api/client.js';

export const name = 'search_worlds';

export const description =
  'Search for worlds using name patterns, UWP criteria, trade codes, allegiance codes, or travel zones. ' +
  'Supports wildcards (* ? %) and multiple filters. ' +
  'Examples: "Regina", "Reg*", "uwp:A????[89A]-" (high-pop with excellent starport), ' +
  '"remark:Wa" (water worlds), "alleg:Im" (Third Imperium worlds), "zone:R" (Red zones). ' +
  'Add a sector name to the query to scope results (e.g. "Wa Tobia" to find water worlds near Tobia). ' +
  'Multiple terms are ANDed together.';

export const inputSchema = z.object({
  query: z
    .string()
    .describe(
      'Search query. Examples: "Regina", "Reg*", "uwp:A????[89A]-", "remark:Wa", "alleg:Im", "zone:R", "zone:A". ' +
        'Multiple terms are ANDed. Add a sector name to narrow results.',
    ),
  milieu: z.string().optional().describe('Campaign era filter (e.g. "M1105")'),
});

export type Input = z.infer<typeof inputSchema>;

interface SearchResult {
  Results?: {
    Items?: SearchItem[];
  };
  [key: string]: unknown;
}

interface SearchItem {
  World?: WorldResult;
  Sector?: SectorResult;
  Subsector?: SubsectorResult;
  [key: string]: unknown;
}

interface WorldResult {
  Name?: string;
  Hex?: string;
  Sector?: { Name?: string; Abbreviation?: string };
  Subsector?: string;
  UWP?: string;
  Bases?: string;
  Remarks?: string;
  Zone?: string;
  PBG?: string;
  Allegiance?: string;
  [key: string]: unknown;
}

interface SectorResult {
  Name?: string;
  Abbreviation?: string;
  [key: string]: unknown;
}

interface SubsectorResult {
  Name?: string;
  Index?: string;
  [key: string]: unknown;
}

const ZONE_LABELS: Record<string, string> = { R: 'Red', A: 'Amber', G: 'Green', '': 'Green' };

function normalizeZone(zone: string | undefined): string {
  const z = (zone ?? '').trim();
  return (ZONE_LABELS[z] ?? z) || 'Green';
}

function parseTradeCodes(remarks: string | undefined): string[] {
  if (!remarks) return [];
  return remarks
    .trim()
    .split(/\s+/)
    .filter((r) => r && r !== '-');
}

export async function handler(args: Input) {
  const { query, milieu } = args;

  const data = await apiGetJson<SearchResult>('/api/search', { q: query, milieu });

  const items = data?.Results?.Items ?? [];

  const worlds: unknown[] = [];
  const sectors: unknown[] = [];
  const subsectors: unknown[] = [];

  for (const item of items) {
    if (item.World) {
      const w = item.World;
      worlds.push({
        name: w.Name,
        sector: w.Sector?.Name,
        sector_abbreviation: w.Sector?.Abbreviation,
        subsector: w.Subsector,
        hex: w.Hex,
        uwp: w.UWP,
        bases: w.Bases,
        trade_codes: parseTradeCodes(w.Remarks),
        zone: normalizeZone(w.Zone),
        pbg: w.PBG,
        allegiance: w.Allegiance,
      });
    } else if (item.Sector) {
      sectors.push({ name: item.Sector.Name, abbreviation: item.Sector.Abbreviation });
    } else if (item.Subsector) {
      subsectors.push({ name: item.Subsector.Name, index: item.Subsector.Index });
    }
  }

  const result = {
    query,
    total_results: items.length,
    worlds: { count: worlds.length, results: worlds },
    sectors: sectors.length > 0 ? { count: sectors.length, results: sectors } : undefined,
    subsectors: subsectors.length > 0 ? { count: subsectors.length, results: subsectors } : undefined,
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
