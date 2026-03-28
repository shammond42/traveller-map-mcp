import { z } from 'zod';
import { apiGetJson } from '../api/client.js';
import { parseUWP } from '../parsers/uwp.js';

export const name = 'find_route';

export const description =
  'Finds a jump route between two worlds and returns the sequence of intermediate worlds. ' +
  'Locations are specified as "Sector XXYY" (e.g. "Spinward Marches 1910"). ' +
  'Returns 404/no-route if no path exists within the jump rating. ' +
  'Options: avoid Red zones, require Imperial membership, require wilderness refueling stops.';

export const inputSchema = z.object({
  start: z
    .string()
    .describe('Starting world as "Sector XXYY" (e.g. "Spinward Marches 1910") or T5SS abbreviation format'),
  end: z
    .string()
    .describe('Destination world in the same format (e.g. "Core 2118" for Capital)'),
  jump: z
    .number()
    .min(1)
    .max(12)
    .optional()
    .default(2)
    .describe('Maximum jump distance per leg (1-12, default 2)'),
  avoid_red_zones: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, the route will not pass through TAS Red Zone worlds'),
  imperial_only: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, only stop at Third Imperium member worlds'),
  wilderness_refueling: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, stops must have wilderness refueling available (gas giant or ocean)'),
  milieu: z.string().optional().describe('Campaign era (default: M1105)'),
});

export type Input = z.infer<typeof inputSchema>;

interface RouteWorld {
  Name?: string;
  Hex?: string;
  Sector?: { Name?: string };
  UWP?: string;
  Zone?: string;
  Bases?: string;
  Allegiance?: string;
  [key: string]: unknown;
}

interface RouteResponse {
  Worlds?: RouteWorld[];
  [key: string]: unknown;
}

const ZONE_LABELS: Record<string, string> = { R: 'Red', A: 'Amber', G: 'Green', '': 'Green' };

export async function handler(args: Input) {
  const { start, end, jump, avoid_red_zones, imperial_only, wilderness_refueling, milieu } = args;

  let data: RouteResponse;
  try {
    data = await apiGetJson<RouteResponse>('/api/route', {
      start,
      end,
      jump,
      nored: avoid_red_zones ? 1 : undefined,
      im: imperial_only ? 1 : undefined,
      wild: wilderness_refueling ? 1 : undefined,
      milieu,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('404')) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                found: false,
                start,
                end,
                jump_rating: jump,
                message: `No jump-${jump} route found between "${start}" and "${end}". Try increasing the jump rating or relaxing constraints.`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    throw err;
  }

  const worlds = (data.Worlds ?? []).map((w) => {
    const zoneCode = (w.Zone ?? '').trim();
    const uwpRaw = w.UWP ?? '';
    let starport = '';
    if (uwpRaw && uwpRaw !== '?000000-0') {
      try {
        starport = parseUWP(uwpRaw).starport.code;
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
      zone: (ZONE_LABELS[zoneCode] ?? zoneCode) || 'Green',
      bases: w.Bases,
      allegiance: w.Allegiance,
    };
  });

  const result = {
    found: true,
    start,
    end,
    jump_rating: jump,
    total_jumps: Math.max(0, worlds.length - 1),
    route: worlds,
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
