import type {
  CloudCoverResponse,
  ForecastResponse,
  GeocodeResponse,
  Granularity,
  LightningResponse,
} from "../../shared/types.ts";

/** Fetch JSON from a URL and throw a readable error when the response is not OK. */
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export interface SeriesParams {
  lat: number;
  lon: number;
  radiusKm: number;
  granularity: Granularity;
  from: string;
  to: string;
}

/** Resolve a place name to coordinates via the geocode API. */
export function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResponse> {
  return getJson(`/api/geocode?q=${encodeURIComponent(query)}`, signal);
}

/** Fetch aggregated lightning strike data for a location, radius, and date range. */
export function getLightning(
  p: SeriesParams,
  signal?: AbortSignal,
): Promise<LightningResponse> {
  const q = new URLSearchParams({
    lat: String(p.lat),
    lon: String(p.lon),
    radius: String(p.radiusKm),
    granularity: p.granularity,
    from: p.from,
    to: p.to,
  });
  return getJson(`/api/lightning?${q.toString()}`, signal);
}

/** Fetch cloud-cover observations from the nearest SMHI station for a date range. */
export function getCloudCover(
  p: SeriesParams,
  signal?: AbortSignal,
): Promise<CloudCoverResponse> {
  const q = new URLSearchParams({
    lat: String(p.lat),
    lon: String(p.lon),
    granularity: p.granularity,
    from: p.from,
    to: p.to,
  });
  return getJson(`/api/cloudcover?${q.toString()}`, signal);
}

/** Fetch month-by-month lightning and cloud climatology for a location and radius. */
export function getForecast(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<ForecastResponse> {
  const q = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radiusKm),
  });
  return getJson(`/api/forecast?${q.toString()}`, signal);
}
