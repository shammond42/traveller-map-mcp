import { z } from 'zod';
import { apiGetJson } from '../api/client.js';
import { parseUWP } from '../parsers/uwp.js';

export const name = 'get_worlds_in_jump_range';

export const description =
  'Lists all worlds reachable from a given location within N parsecs. ' +
  'Returns structured data for each world including UWP, trade codes, bases, zone, and allegiance. ' +
  'Useful for planning routes or finding nearby systems to visit.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation'),
  hex: z.string().describe('Hex location in XXYY format'),
  jump: z.number().min(0).max(12).optional().default(2).describe('Jump range in parsecs (0-12, default 2)'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

interface JumpWorld {
  Name?: string;
  Hex?: string;
  Sector?: { Name?: string; Abbreviation?: string };
  UWP?: string;
  Bases?: string;
  Remarks?: string;
  Zone?: string;
  Allegiance?: string;
  Distance?: number;
  [key: string]: unknown;
}

interface JumpWorldsResponse {
  Worlds?: JumpWorld[];
  [key: string]: unknown;
}

const ZONE_LABELS: Record<string, string> = { R: 'Red', A: 'Amber', G: 'Green', '': 'Green' };

function parseTradeCodes(remarks: string | undefined): string[] {
  if (!remarks) return [];
  return remarks
    .trim()
    .split(/\s+/)
    .filter((r) => r && r !== '-');
}

export async function handler(args: Input) {
  const { sector, hex, jump, milieu } = args;

  const data = await apiGetJson<JumpWorldsResponse>('/api/jumpworlds', { sector, hex, jump, milieu });

  const worlds = (data.Worlds ?? []).map((w) => {
    const zoneCode = (w.Zone ?? '').trim();
    const uwpRaw = w.UWP ?? '';
    let starport = '';
    let techLevel = '';
    if (uwpRaw && uwpRaw.length > 1) {
      try {
        const decoded = parseUWP(uwpRaw);
        starport = decoded.starport.code;
        techLevel = decoded.tech_level.code;
      } catch {
        starport = uwpRaw[0] ?? '';
      }
    }
    return {
      name: w.Name,
      sector: w.Sector?.Name,
      hex: w.Hex,
      uwp: uwpRaw,
      starport,
      tech_level: techLevel,
      bases: w.Bases,
      trade_codes: parseTradeCodes(w.Remarks),
      zone: (ZONE_LABELS[zoneCode] ?? zoneCode) || 'Green',
      allegiance: w.Allegiance,
      distance: w.Distance,
    };
  });

  const result = {
    origin: `${hex} in ${sector}`,
    jump_range: jump,
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
