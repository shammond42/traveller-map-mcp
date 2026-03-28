export interface DecodedUWPField {
  code: string;
  value: number;
  description: string;
}

export interface DecodedUWP {
  raw: string;
  starport: { code: string; description: string };
  size: DecodedUWPField & { diameter_km: string };
  atmosphere: DecodedUWPField;
  hydrographics: DecodedUWPField & { percent: string };
  population: DecodedUWPField & { estimate: string };
  government: DecodedUWPField;
  law_level: DecodedUWPField;
  tech_level: DecodedUWPField & { era: string };
}

export function eHexValue(char: string): number {
  const c = char.toUpperCase();
  if (c >= '0' && c <= '9') return parseInt(c, 10);
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  return 0;
}

const STARPORT: Record<string, string> = {
  A: 'Excellent — full repair, refined fuel, shipyard capable',
  B: 'Good — full repair, refined fuel available',
  C: 'Routine — some repair, unrefined fuel available',
  D: 'Poor — limited repair, unrefined fuel only',
  E: 'Frontier — no repair, no fuel',
  X: 'None — no starport facilities',
  F: 'Good — spaceport (non-starship capable)',
  G: 'Poor — primitive spaceport',
  H: 'Primitive — minimal facilities',
  Y: 'None',
};

const SIZE_DESC: Record<number, { description: string; diameter_km: string }> = {
  0: { description: 'Asteroid/planetoid belt or very small body', diameter_km: '<800 km' },
  1: { description: 'Small world', diameter_km: '~1,600 km' },
  2: { description: 'Small world', diameter_km: '~3,200 km' },
  3: { description: 'Small world', diameter_km: '~4,800 km' },
  4: { description: 'Small world', diameter_km: '~6,400 km' },
  5: { description: 'Medium world', diameter_km: '~8,000 km' },
  6: { description: 'Medium world (Earth-like)', diameter_km: '~9,600 km' },
  7: { description: 'Medium world', diameter_km: '~11,200 km' },
  8: { description: 'Large world', diameter_km: '~12,800 km' },
  9: { description: 'Large world', diameter_km: '~14,400 km' },
  10: { description: 'Large world', diameter_km: '~16,000 km' },
};

const ATMOSPHERE_DESC: Record<number, string> = {
  0: 'None — vacuum',
  1: 'Trace — very thin, requires vacc suit',
  2: 'Very Thin, Tainted — requires filter mask and compressor',
  3: 'Very Thin — requires compressor',
  4: 'Thin, Tainted — requires filter mask',
  5: 'Thin — breathable with some discomfort',
  6: 'Standard — breathable',
  7: 'Standard, Tainted — requires filter mask',
  8: 'Dense — breathable with no special equipment',
  9: 'Dense, Tainted — requires filter mask',
  10: 'Exotic — requires oxygen supply',
  11: 'Corrosive — requires vacc suit',
  12: 'Insidious — suit penetrating, requires special protection',
  13: 'Dense, High — breathable only at high altitudes',
  14: 'Thin, Low — breathable only in lowlands',
  15: 'Unusual',
};

const HYDROGRAPHICS_DESC: Record<number, { description: string; percent: string }> = {
  0: { description: 'Desert world — no free water', percent: '0%' },
  1: { description: 'Dry world — traces of water', percent: '1–10%' },
  2: { description: 'Dry world', percent: '11–20%' },
  3: { description: 'Dry world', percent: '21–30%' },
  4: { description: 'Wet world', percent: '31–40%' },
  5: { description: 'Wet world', percent: '41–50%' },
  6: { description: 'Wet world', percent: '51–60%' },
  7: { description: 'Wet world — significant oceans', percent: '61–70%' },
  8: { description: 'Water world — large oceans', percent: '71–80%' },
  9: { description: 'Water world — very large oceans', percent: '81–90%' },
  10: { description: 'Water world — global ocean', percent: '91–100%' },
};

const POPULATION_DESC: Record<number, { description: string; estimate: string }> = {
  0: { description: 'Unpopulated or tiny outpost', estimate: 'None or a few individuals' },
  1: { description: 'Tens of inhabitants', estimate: '~10s' },
  2: { description: 'Hundreds of inhabitants', estimate: '~100s' },
  3: { description: 'Thousands of inhabitants', estimate: '~1,000s' },
  4: { description: 'Tens of thousands', estimate: '~10,000s' },
  5: { description: 'Hundreds of thousands', estimate: '~100,000s' },
  6: { description: 'Millions of inhabitants', estimate: '~1,000,000s' },
  7: { description: 'Tens of millions', estimate: '~10,000,000s' },
  8: { description: 'Hundreds of millions', estimate: '~100,000,000s' },
  9: { description: 'Billions of inhabitants', estimate: '~1,000,000,000s' },
  10: { description: 'Tens of billions', estimate: '~10,000,000,000s' },
  11: { description: 'Hundreds of billions', estimate: '~100,000,000,000s' },
  12: { description: 'Trillions of inhabitants', estimate: '~1,000,000,000,000s' },
};

const GOVERNMENT_DESC: Record<number, string> = {
  0: 'No Government Structure — family/clan/tribal',
  1: 'Company/Corporation — governed by a company',
  2: 'Participating Democracy — rule by citizen vote',
  3: 'Self-Perpetuating Oligarchy — ruling class maintains power',
  4: 'Representative Democracy — elected representatives',
  5: 'Feudal Technocracy — controlled by technology owners',
  6: 'Captive Government — controlled by outside power',
  7: 'Balkanization — no central authority',
  8: 'Civil Service Bureaucracy — rule by competence',
  9: 'Impersonal Bureaucracy — rule by rigid law',
  10: 'Charismatic Dictator — rule by personality',
  11: 'Non-Charismatic Leader — rule by position',
  12: 'Charismatic Oligarchy — rule by a few personalities',
  13: 'Religious Dictatorship — rule by religious doctrine',
  14: 'Religious Autocracy — rule by a religious figure',
  15: 'Totalitarian Oligarchy — oppressive rule by a few',
};

const LAW_LEVEL_DESC: Record<number, string> = {
  0: 'No prohibitions — no restrictions on weapons or behavior',
  1: 'Body pistols, explosives, nuclear weapons prohibited',
  2: 'Portable energy weapons prohibited',
  3: 'Machine guns, automatic weapons prohibited',
  4: 'Light assault weapons prohibited',
  5: 'Personal concealable weapons prohibited',
  6: 'All firearms except shotguns prohibited',
  7: 'Shotguns prohibited',
  8: 'Long blades prohibited in public',
  9: 'All weapons outside home prohibited',
  10: 'Weapon possession prohibited — weapons locked up',
  11: 'Rigid control of civilian movement',
  12: 'Unrestricted invasion of privacy',
  13: 'Paramilitary law enforcement',
  14: 'Full-fledged police state',
  15: 'Daily life rigidly controlled',
};

const TECH_LEVEL_ERA: Record<number, string> = {
  0: 'Stone Age / Pre-Industrial',
  1: 'Bronze Age / Iron Age',
  2: 'Renaissance',
  3: 'Industrial Revolution',
  4: 'Mechanized Age',
  5: 'Broadcast Age',
  6: 'Atomic Age',
  7: 'Space Age',
  8: 'Information Age',
  9: 'Pre-Stellar',
  10: 'Early Stellar',
  11: 'Average Stellar',
  12: 'Average Interstellar',
  13: 'High Interstellar',
  14: 'Average Imperial',
  15: 'High Imperial / Average Interstellar II',
  16: 'Sophont',
  17: 'Advanced',
};

export function parseUWP(uwp: string): DecodedUWP {
  const clean = uwp.trim().replace(/\s+/g, '');

  const starportCode = clean[0] ?? '?';
  const sizeCode = clean[1] ?? '0';
  const atmCode = clean[2] ?? '0';
  const hydroCode = clean[3] ?? '0';
  const popCode = clean[4] ?? '0';
  const govCode = clean[5] ?? '0';
  const lawCode = clean[6] ?? '0';
  const tlCode = clean[8] ?? '0';

  const sizeVal = eHexValue(sizeCode);
  const atmVal = eHexValue(atmCode);
  const hydroVal = eHexValue(hydroCode);
  const popVal = eHexValue(popCode);
  const govVal = eHexValue(govCode);
  const lawVal = eHexValue(lawCode);
  const tlVal = eHexValue(tlCode);

  const sizeInfo = SIZE_DESC[sizeVal] ?? { description: 'Unknown size', diameter_km: 'Unknown' };
  const hydroInfo = HYDROGRAPHICS_DESC[hydroVal] ?? { description: 'Unknown hydrographics', percent: 'Unknown' };
  const popInfo = POPULATION_DESC[popVal] ?? { description: 'Unknown population', estimate: 'Unknown' };

  return {
    raw: uwp,
    starport: {
      code: starportCode,
      description: STARPORT[starportCode.toUpperCase()] ?? `Unknown starport code: ${starportCode}`,
    },
    size: {
      code: sizeCode,
      value: sizeVal,
      description: sizeInfo.description,
      diameter_km: sizeInfo.diameter_km,
    },
    atmosphere: {
      code: atmCode,
      value: atmVal,
      description: ATMOSPHERE_DESC[atmVal] ?? `Unknown atmosphere code: ${atmCode}`,
    },
    hydrographics: {
      code: hydroCode,
      value: hydroVal,
      description: hydroInfo.description,
      percent: hydroInfo.percent,
    },
    population: {
      code: popCode,
      value: popVal,
      description: popInfo.description,
      estimate: popInfo.estimate,
    },
    government: {
      code: govCode,
      value: govVal,
      description: GOVERNMENT_DESC[govVal] ?? `Unknown government code: ${govCode}`,
    },
    law_level: {
      code: lawCode,
      value: lawVal,
      description: LAW_LEVEL_DESC[lawVal] ?? `Unknown law level code: ${lawCode}`,
    },
    tech_level: {
      code: tlCode,
      value: tlVal,
      description: `Tech Level ${tlVal}`,
      era: TECH_LEVEL_ERA[tlVal] ?? 'Advanced/Unknown',
    },
  };
}
