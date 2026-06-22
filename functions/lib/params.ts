import type { Granularity } from "../../shared/types.ts";

const MIN_ISO = "2012-01-01";

/** Return today's date as an ISO string (YYYY-MM-DD) in UTC. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Clamp an ISO date to the valid SMHI data window (2012-01-01 through today). */
function clampIso(iso: string): string {
  const max = todayIso();
  if (iso < MIN_ISO) return MIN_ISO;
  if (iso > max) return max;
  return iso;
}

/** Parse and validate `lat`/`lon` query parameters from a request URL. */
export function parseLocation(url: URL): { lat: number; lon: number } {
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Missing or invalid lat/lon");
  }
  return { lat, lon };
}

/** Parse the search-radius query param, clamped to 5–300 km with a default fallback. */
export function parseRadius(url: URL, fallback = 50): number {
  const r = Number(url.searchParams.get("radius"));
  if (!Number.isFinite(r)) return fallback;
  return Math.min(300, Math.max(5, r));
}

export interface RangeParams {
  granularity: Granularity;
  from: string;
  to: string;
}

/** Parse granularity and inclusive date range (`from`/`to`) from query parameters. */
export function parseRange(url: URL): RangeParams {
  const g = url.searchParams.get("granularity") ?? "month";
  const granularity: Granularity =
    g === "day" ? "day" : g === "year" ? "year" : "month";

  let from = url.searchParams.get("from") ?? "";
  let to = url.searchParams.get("to") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error("Missing or invalid from/to (expected YYYY-MM-DD)");
  }

  from = clampIso(from);
  to = clampIso(to);
  if (from > to) [from, to] = [to, from];
  return { granularity, from, to };
}
