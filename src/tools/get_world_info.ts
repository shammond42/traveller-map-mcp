import { z } from 'zod';
import { apiGetJson } from '../api/client.js';
import { parseUWP } from '../parsers/uwp.js';

export const name = 'get_world_info';

export const description =
  'Retrieves detailed information about a specific world, with the UWP (Universal World Profile) ' +
  'fully decoded into human-readable fields: starport quality, world size, atmosphere type, ' +
  'hydrographics percentage, population estimate, government type, law level, and tech level era. ' +
  'Also returns trade codes, bases, travel zone, allegiance, and stellar data.';

export const inputSchema = z.object({
  sector: z.string().describe('Sector name or T5SS abbreviation (e.g. "Spinward Marches" or "spin")'),
  hex: z.string().describe('Hex location in XXYY format (e.g. "1910" for Regina in Spinward Marches)'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

interface CreditsResponse {
  Name?: string;
  Hex?: string;
  Sector?: string;
  Subsector?: string;
  UWP?: string;
  Bases?: string;
  Remarks?: string;
  Zone?: string;
  PBG?: string;
  Allegiance?: string;
  Stars?: string;
  Ix?: string;
  Ex?: string;
  Cx?: string;
  Nobility?: string;
  W?: number;
  RU?: number;
  [key: string]: unknown;
}

const ZONE_LABELS: Record<string, string> = { R: 'Red', A: 'Amber', G: 'Green', '': 'Green' };

const BASE_LABELS: Record<string, string> = {
  N: 'Naval Base',
  S: 'Scout Base',
  W: 'Scout Waystation',
  D: 'Naval Depot',
  K: 'Naval Base (Sword Worlds)',
  M: 'Military Base',
  C: 'Corsair Base',
  T: 'TAS Hostel',
  R: 'Aslan Clan Base',
  F: 'Aslan Tlaukhu Base',
  A: 'Naval Base + Scout Base',
  B: 'Naval Base + Scout Waystation',
  G: 'Scout Base (Vargr)',
  H: 'Naval Base + Scout Base (Vargr)',
  X: 'Zhodani Relay Station',
  Z: 'Zhodani Naval + Scout Base',
};

function decodeBases(bases: string): string[] {
  if (!bases || bases.trim() === '' || bases.trim() === '-') return [];
  return bases
    .trim()
    .split('')
    .filter((c) => c !== ' ' && c !== '-')
    .map((c) => BASE_LABELS[c] ?? `Base (${c})`);
}

function decodeTradeCodes(remarks: string): Array<{ code: string; meaning: string }> {
  const TRADE_CODES: Record<string, string> = {
    Ag: 'Agricultural',
    As: 'Asteroid',
    Ba: 'Barren',
    De: 'Desert',
    Fl: 'Fluid Oceans (non-water)',
    Ga: 'Garden World',
    Hi: 'High Population',
    Ht: 'High Technology',
    Ic: 'Ice-Capped',
    In: 'Industrial',
    Lo: 'Low Population',
    Lt: 'Low Technology',
    Na: 'Non-Agricultural',
    Ni: 'Non-Industrial',
    Po: 'Poor',
    Ri: 'Rich',
    Tr: 'Temperate',
    Tu: 'Tundra',
    Tz: 'Tidally Locked',
    Wa: 'Water World',
    Va: 'Vacuum',
    Ph: 'Pre-High Population',
    Pi: 'Pre-Industrial',
    Pa: 'Pre-Agricultural',
    Mr: 'Reserve',
    Fr: 'Frozen',
    Ho: 'Hot',
    Co: 'Cold',
    Lk: 'Locked',
    Tr2: 'Tropic',
    Sa: 'Satellite',
    Fa: 'Farming',
    Mi: 'Mining',
    Pz: 'Puzzle',
    Cy: 'Cyclopean',
    Di: 'Dieback',
    Px: 'Prison/Exile Camp',
    An: 'Ancient Site',
    Rs: 'Research Station',
    Cp: 'Subsector Capital',
    Cs: 'Sector Capital',
    Cx: 'Capital',
    Fo: 'Forbidden',
    Pn: 'Prison',
    Re: 'Reserve',
  };

  if (!remarks) return [];
  return remarks
    .trim()
    .split(/\s+/)
    .filter((r) => r && r !== '-')
    .map((code) => ({ code, meaning: TRADE_CODES[code] ?? code }));
}

export async function handler(args: Input) {
  const { sector, hex, milieu } = args;

  const data = await apiGetJson<CreditsResponse>('/api/credits', { sector, hex, milieu });

  const uwpRaw = data.UWP ?? '?000000-0';
  const decoded = parseUWP(uwpRaw);

  const zoneCode = (data.Zone ?? '').trim();
  const zone = (ZONE_LABELS[zoneCode] ?? zoneCode) || 'Green';

  const result = {
    name: data.Name ?? 'Unknown',
    hex: data.Hex ?? hex,
    sector: data.Sector ?? sector,
    subsector: data.Subsector,
    uwp: uwpRaw,
    decoded_uwp: decoded,
    trade_codes: decodeTradeCodes(data.Remarks ?? ''),
    bases: decodeBases(data.Bases ?? ''),
    zone,
    pbg: data.PBG,
    allegiance: data.Allegiance,
    stellar: data.Stars,
    importance: data.Ix,
    economic_extension: data.Ex,
    cultural_extension: data.Cx,
    nobility: data.Nobility,
    worlds_in_system: data.W,
    resource_units: data.RU,
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
