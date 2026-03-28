const BASE_URL = 'https://travellermap.com';
const USER_AGENT = 'traveller-map-mcp/1.0 (github.com/shammond42/traveller-map-mcp)';

export type QueryParams = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, params: QueryParams): URL {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export async function apiGet(path: string, params: QueryParams = {}): Promise<Response> {
  const url = buildUrl(path, params);
  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Traveller Map API error ${response.status} at ${path}: ${body}`);
  }
  return response;
}

export async function apiGetImage(path: string, params: QueryParams = {}): Promise<string> {
  const url = buildUrl(path, params);
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'image/png',
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Traveller Map API error ${response.status} at ${path}: ${body}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function apiGetJson<T>(path: string, params: QueryParams = {}): Promise<T> {
  const response = await apiGet(path, { ...params, accept: 'application/json' });
  return response.json() as Promise<T>;
}

export async function apiGetText(path: string, params: QueryParams = {}): Promise<string> {
  const response = await apiGet(path, params);
  return response.text();
}

export async function apiGetDataUri(
  path: string,
  params: QueryParams = {},
): Promise<{ base64: string; mimeType: string }> {
  const response = await apiGet(path, { ...params, datauri: 1 });
  const text = await response.text();
  for (const mimeType of ['image/png', 'image/jpeg']) {
    const prefix = `data:${mimeType};base64,`;
    if (text.startsWith(prefix)) {
      return { base64: text.slice(prefix.length), mimeType };
    }
  }
  throw new Error(`Unexpected data URI format from ${path}: ${text.slice(0, 50)}`);
}

export async function apiPostImage(
  path: string,
  queryParams: QueryParams,
  formBody: Record<string, string>,
): Promise<string> {
  const url = buildUrl(path, queryParams);
  const body = new URLSearchParams(formBody).toString();
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'Accept': 'image/png',
    },
    body,
  });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Traveller Map API error ${response.status} at POST ${path}: ${responseBody}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}
