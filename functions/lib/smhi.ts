/// <reference types="@cloudflare/workers-types" />
import type { Env } from "./env.ts";
import { cachedJson, mapPool } from "./cache.ts";

const LIGHTNING_BASE =
  "https://opendata-download-lightning.smhi.se/api/version/latest";
const METOBS_BASE =
  "https://opendata-download-metobs.smhi.se/api/version/latest";
/** Total cloud amount (Total molnmängd), hourly, in oktas (0..8). */
const CLOUD_PARAM = 16;
const DAY_MS = 86_400_000;

export interface RawStrike {
  t: number;
  lat: number;
  lon: number;
  peakCurrent: number;
  cloud: boolean;
}

export interface CloudStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  active: boolean;
  /** Operational window (unix ms). */
  from: number;
  to: number;
}

export interface CloudSample {
  t: number;
  oktas: number;
}

export interface DayKey {
  year: number;
  month: number;
  day: number;
  date: number;
}

/** UTC midnight (ms) for a Y/M/D. */
function utcDay(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

/** Inclusive list of UTC days between two ISO date strings (YYYY-MM-DD). */
export function daysBetween(fromIso: string, toIso: string): DayKey[] {
  const from = Date.parse(fromIso + "T00:00:00Z");
  const to = Date.parse(toIso + "T00:00:00Z");
  const days: DayKey[] = [];
  for (let t = from; t <= to; t += DAY_MS) {
    const d = new Date(t);
    days.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      date: t,
    });
  }
  return days;
}

/** Choose KV cache TTL based on how far in the past the data range ends. */
function ttlForDate(dateMs: number): number {
  const ageDays = (Date.now() - dateMs) / DAY_MS;
  if (ageDays > 45) return 60 * 60 * 24 * 180; // 180 days
  return 60 * 60 * 12; // 12 hours
}

/** Cloudflare free tier allows 50 subrequests per invocation — stay under that. */
const SUBREQUEST_BATCH = 45;

export interface LightningDayResult {
  date: number;
  observed: boolean;
  strikes: RawStrike[];
}

/** Fetch many daily lightning files in subrequest-safe batches. */
export async function fetchLightningDays(
  env: Env,
  days: DayKey[],
  concurrency = 8,
): Promise<LightningDayResult[]> {
  const now = Date.now();
  const out: LightningDayResult[] = [];
  for (let i = 0; i < days.length; i += SUBREQUEST_BATCH) {
    const batch = days.slice(i, i + SUBREQUEST_BATCH);
    const batchResults = await mapPool(batch, concurrency, async (day) => ({
      date: day.date,
      observed: day.date <= now,
      strikes: await fetchLightningDay(env, day),
    }));
    out.push(...batchResults);
  }
  return out;
}

/** Fetch and cache raw lightning strikes for a single UTC day from SMHI. */
export async function fetchLightningDay(
  env: Env,
  key: DayKey,
): Promise<RawStrike[]> {
  const cacheKey = `lightning:${key.year}-${key.month}-${key.day}`;
  return cachedJson(env, cacheKey, ttlForDate(key.date), async () => {
    const url = `${LIGHTNING_BASE}/year/${key.year}/month/${key.month}/day/${key.day}/data.json`;
    const res = await fetch(url, { cf: { cacheTtl: 3600 } });
    if (!res.ok) return [];
    const body = (await res.json()) as { values?: RawValue[] };
    const values = body.values ?? [];
    return values.map((v) => ({
      t: Date.UTC(v.year, v.month - 1, v.day, v.hours, v.minutes, v.seconds),
      lat: v.lat,
      lon: v.lon,
      peakCurrent: v.peakCurrent,
      cloud: v.cloudIndicator === 1,
    }));
  });
}

interface RawValue {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  lat: number;
  lon: number;
  peakCurrent: number;
  cloudIndicator: number;
}

/** Fetch and cache the list of SMHI cloud-cover observation stations. */
export async function fetchCloudStations(env: Env): Promise<CloudStation[]> {
  return cachedJson(env, `metobs:stations:${CLOUD_PARAM}`, 60 * 60 * 24 * 7, async () => {
    const url = `${METOBS_BASE}/parameter/${CLOUD_PARAM}.json`;
    const res = await fetch(url, { cf: { cacheTtl: 86_400 } });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      station?: Array<{
        key: string | number;
        name: string;
        latitude: number;
        longitude: number;
        active?: boolean;
        from?: number;
        to?: number;
      }>;
    };
    return (body.station ?? []).map((s) => ({
      id: String(s.key),
      name: s.name,
      lat: s.latitude,
      lon: s.longitude,
      active: Boolean(s.active),
      from: s.from ?? 0,
      to: s.to ?? 0,
    }));
  });
}

/** Parse an SMHI metobs CSV payload into oktas samples. */
function parseCloudCsv(text: string): CloudSample[] {
  const lines = text.split("\n");
  let dataStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("Datum;Tid")) {
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart === -1) return [];

  const out: CloudSample[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const parts = lines[i].split(";");
    if (parts.length < 3) continue;
    const date = parts[0].trim();
    const time = parts[1].trim();
    const pct = Number(parts[2]);
    if (!date || !time || !Number.isFinite(pct)) continue;
    const t = Date.parse(`${date}T${time}Z`);
    if (!Number.isFinite(t)) continue;
    // Source reports oktas as a percentage (0,13,25..100, 113 = obscured).
    out.push({ t, oktas: Math.min(8, Math.round(pct / 12.5)) });
  }
  return out;
}

/**
 * Corrected (quality-controlled) historical archive. Only available as CSV and
 * excludes roughly the last 3 months. Cached aggressively since it is stable.
 */
export async function fetchCloudSeries(
  env: Env,
  stationId: string,
): Promise<CloudSample[]> {
  return cachedJson(
    env,
    `metobs:archive:${CLOUD_PARAM}:${stationId}`,
    60 * 60 * 24 * 7,
    async () => {
      const url = `${METOBS_BASE}/parameter/${CLOUD_PARAM}/station/${stationId}/period/corrected-archive/data.csv`;
      const res = await fetch(url, { cf: { cacheTtl: 86_400 } });
      if (!res.ok) return [];
      return parseCloudCsv(await res.text());
    },
  );
}

/** Most recent ~4 months, filling the gap the corrected archive omits. */
export async function fetchCloudLatest(
  env: Env,
  stationId: string,
): Promise<CloudSample[]> {
  return cachedJson(
    env,
    `metobs:latest:${CLOUD_PARAM}:${stationId}`,
    60 * 60 * 6,
    async () => {
      const url = `${METOBS_BASE}/parameter/${CLOUD_PARAM}/station/${stationId}/period/latest-months/data.csv`;
      const res = await fetch(url, { cf: { cacheTtl: 3600 } });
      if (!res.ok) return [];
      return parseCloudCsv(await res.text());
    },
  );
}

export { utcDay, DAY_MS };
