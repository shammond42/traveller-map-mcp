import { parseUWP, type DecodedUWP } from './uwp.js';

export interface WorldRecord {
  hex: string;
  name: string;
  uwp: string;
  decoded_uwp: DecodedUWP;
  bases: string;
  remarks: string;
  trade_codes: string[];
  zone: string;
  pbg: string;
  allegiance: string;
  stars: string;
  importance?: string;
  economic?: string;
  cultural?: string;
  nobility?: string;
  worlds?: string;
  resource_units?: string;
}

const ZONE_MAP: Record<string, string> = {
  R: 'Red',
  A: 'Amber',
  '': 'Green',
  '-': 'Green',
  ' ': 'Green',
  G: 'Green',
};

function normalizeZone(zone: string): string {
  return ZONE_MAP[zone?.trim() ?? ''] ?? zone?.trim() ?? 'Green';
}

function parseRemarks(remarks: string): string[] {
  if (!remarks) return [];
  return remarks
    .trim()
    .split(/\s+/)
    .filter((r) => r.length > 0 && r !== '-');
}

export function parseSecTabDelimited(text: string): WorldRecord[] {
  const lines = text.split('\n');
  const worlds: WorldRecord[] = [];

  let headerLine = '';
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.trim() === '') continue;
    if (/^[-\s]+$/.test(line)) continue;
    if (line.toLowerCase().includes('hex') || line.toLowerCase().includes('name')) {
      headerLine = line;
      headerIndex = i;
      break;
    }
  }

  if (!headerLine) {
    return worlds;
  }

  const headers = headerLine.split('\t').map((h) => h.trim().toLowerCase());

  const colIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const hexIdx = colIndex(['hex']);
  const nameIdx = colIndex(['name', 'world name']);
  const uwpIdx = colIndex(['uwp']);
  const basesIdx = colIndex(['bases', 'base']);
  const remarksIdx = colIndex(['remarks', 'trade codes', 'tradecodes']);
  const zoneIdx = colIndex(['zone', 'iz', 'travel zone']);
  const pbgIdx = colIndex(['pbg']);
  const allegIdx = colIndex(['allegiance', 'alleg', 'a']);
  const starsIdx = colIndex(['stars', 'stellar data', 'stellar']);
  const importanceIdx = colIndex(['{ix}', 'ix', 'importance', '{importance}']);
  const economicIdx = colIndex(['(ex)', 'ex', 'economic', '(economic)']);
  const culturalIdx = colIndex(['[cx]', 'cx', 'cultural', '[cultural]']);
  const nobilityIdx = colIndex(['nobility', 'nobil', 'n']);
  const worldsIdx = colIndex(['w', 'worlds']);
  const ruIdx = colIndex(['ru', 'resource units']);

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.trim() === '') continue;
    if (/^[-\s]+$/.test(line)) continue;

    const cols = line.split('\t');
    if (cols.length < 3) continue;

    const get = (idx: number): string => (idx >= 0 ? cols[idx]?.trim() ?? '' : '');

    const uwpRaw = get(uwpIdx);
    let decodedUwp: DecodedUWP;
    try {
      decodedUwp = parseUWP(uwpRaw);
    } catch {
      decodedUwp = parseUWP('?000000-0');
    }

    const remarksRaw = get(remarksIdx);

    worlds.push({
      hex: get(hexIdx),
      name: get(nameIdx),
      uwp: uwpRaw,
      decoded_uwp: decodedUwp,
      bases: get(basesIdx),
      remarks: remarksRaw,
      trade_codes: parseRemarks(remarksRaw),
      zone: normalizeZone(get(zoneIdx)),
      pbg: get(pbgIdx),
      allegiance: get(allegIdx),
      stars: get(starsIdx),
      importance: importanceIdx >= 0 ? get(importanceIdx) : undefined,
      economic: economicIdx >= 0 ? get(economicIdx) : undefined,
      cultural: culturalIdx >= 0 ? get(culturalIdx) : undefined,
      nobility: nobilityIdx >= 0 ? get(nobilityIdx) : undefined,
      worlds: worldsIdx >= 0 ? get(worldsIdx) : undefined,
      resource_units: ruIdx >= 0 ? get(ruIdx) : undefined,
    });
  }

  return worlds;
}
