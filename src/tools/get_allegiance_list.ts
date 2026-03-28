import { z } from 'zod';
import { apiGetJson } from '../api/client.js';

export const name = 'get_allegiance_list';

export const description =
  'Returns all known allegiance codes and their full names. ' +
  'Use this to find the right code before searching with "alleg:" in search_worlds. ' +
  'Examples: "ImDd" = "Third Imperium, Domain of Deneb", "Zh" = "Zhodani Consulate".';

export const inputSchema = z.object({});

export type Input = z.infer<typeof inputSchema>;

interface AllegianceEntry {
  Code?: string;
  Name?: string;
  [key: string]: unknown;
}

export async function handler(_args: Input) {
  const data = await apiGetJson<AllegianceEntry[]>('/t5ss/allegiances', {});

  const allegiances = (Array.isArray(data) ? data : []).map((a) => ({
    code: a.Code,
    name: a.Name,
  }));

  const result = {
    count: allegiances.length,
    allegiances,
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
