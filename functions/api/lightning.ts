/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../lib/env.ts";
import type {
  Granularity,
  LightningBucket,
  LightningResponse,
  StrikePoint,
} from "../../shared/types.ts";
import {
  cachedJson,
  errorResponse,
  jsonResponse,
  responseCacheKey,
  responseCacheTtl,
  roundCoord,
} from "../lib/cache.ts";
import { parseLocation, parseRadius, parseRange } from "../lib/params.ts";
import { daysBetween, fetchLightningDays } from "../lib/smhi.ts";
import { boundingBox, haversineKm } from "../lib/geo.ts";
import { buildBuckets, bucketIndex } from "../lib/aggregate.ts";

const STRIKE_SAMPLE_CAP = 2500;

/**
 * Aggregate, bucket, and sample lightning strikes for a location and date range.
 * Filters by radius, computes per-bucket stats, and caps the strike scatter sample.
 */
async function computeLightning(
  env: Env,
  lat: number,
  lon: number,
  radiusKm: number,
  granularity: Granularity,
  from: string,
  to: string,
): Promise<LightningResponse> {
  const days = daysBetween(from, to);
  const box = boundingBox(lat, lon, radiusKm);

  const perDay = await fetchLightningDays(env, days);
  const filteredDays = perDay.map((day) => {
    const near: StrikePoint[] = [];
    for (const s of day.strikes) {
      if (
        s.lat < box.minLat ||
        s.lat > box.maxLat ||
        s.lon < box.minLon ||
        s.lon > box.maxLon
      ) {
        continue;
      }
      const distanceKm = haversineKm(lat, lon, s.lat, s.lon);
      if (distanceKm <= radiusKm) {
        near.push({
          lat: s.lat,
          lon: s.lon,
          t: s.t,
          peakCurrent: s.peakCurrent,
          cloud: s.cloud,
          distanceKm,
        });
      }
    }
    return { date: day.date, observed: day.observed, strikes: near };
  });

  const buckets = buildBuckets(granularity, from, to);
  const rangeStart = Date.parse(from + "T00:00:00Z");
  const n = buckets.length;
  const count = new Array<number>(n).fill(0);
  const daysObserved = new Array<number>(n).fill(0);
  const daysWithStrikes = new Array<number>(n).fill(0);
  const peakSum = new Array<number>(n).fill(0);
  const peakN = new Array<number>(n).fill(0);

  const allStrikes: StrikePoint[] = [];
  let totalDaysObserved = 0;
  let totalDaysWithStrikes = 0;
  let maxPeak = 0;

  for (const day of filteredDays) {
    if (day.observed) totalDaysObserved++;
    if (day.strikes.length > 0) totalDaysWithStrikes++;
    for (const s of day.strikes) {
      allStrikes.push(s);
      const abs = Math.abs(s.peakCurrent);
      if (abs > maxPeak) maxPeak = abs;
    }

    if (granularity === "day") continue;

    const idx = bucketIndex(granularity, rangeStart, day.date, n);
    if (idx < 0) continue;
    count[idx] += day.strikes.length;
    if (day.observed) daysObserved[idx] += 1;
    if (day.strikes.length > 0) daysWithStrikes[idx] += 1;
    for (const s of day.strikes) {
      peakSum[idx] += Math.abs(s.peakCurrent);
      peakN[idx] += 1;
    }
  }

  if (granularity === "day") {
    for (let i = 0; i < n; i++) daysObserved[i] = 1;
    for (const s of allStrikes) {
      const idx = bucketIndex("day", rangeStart, s.t, n);
      if (idx < 0) continue;
      count[idx] += 1;
      peakSum[idx] += Math.abs(s.peakCurrent);
      peakN[idx] += 1;
    }
    for (let i = 0; i < n; i++) daysWithStrikes[i] = count[i] > 0 ? 1 : 0;
  }

  const outBuckets: LightningBucket[] = buckets.map((b, i) => ({
    ...b,
    count: count[i],
    daysObserved: daysObserved[i],
    daysWithStrikes: daysWithStrikes[i],
    probability: daysObserved[i] > 0 ? daysWithStrikes[i] / daysObserved[i] : 0,
    meanPeakCurrent: peakN[i] > 0 ? peakSum[i] / peakN[i] : null,
  }));

  allStrikes.sort((a, b) => a.t - b.t);
  const sampled =
    allStrikes.length <= STRIKE_SAMPLE_CAP
      ? allStrikes
      : allStrikes.filter(
          (_, i) => i % Math.ceil(allStrikes.length / STRIKE_SAMPLE_CAP) === 0,
        );

  return {
    location: { lat, lon },
    radiusKm,
    granularity,
    from,
    to,
    buckets: outBuckets,
    strikes: sampled,
    totals: {
      count: allStrikes.length,
      daysObserved: totalDaysObserved,
      daysWithStrikes: totalDaysWithStrikes,
      probability:
        totalDaysObserved > 0 ? totalDaysWithStrikes / totalDaysObserved : 0,
      maxPeakCurrent: allStrikes.length > 0 ? maxPeak : null,
    },
  };
}

/** Cloudflare Pages handler: returns aggregated lightning data for a location/range. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const { lat, lon } = parseLocation(url);
    const radiusKm = parseRadius(url);
    const { granularity, from, to } = parseRange(url);

    const cacheKey = responseCacheKey("lightning", {
      lat: roundCoord(lat),
      lon: roundCoord(lon),
      radius: radiusKm,
      granularity,
      from,
      to,
    });

    const response = await cachedJson(
      env,
      cacheKey,
      responseCacheTtl(from, to),
      () => computeLightning(env, lat, lon, radiusKm, granularity, from, to),
    );

    return jsonResponse(response, { sMaxAge: 86_400 });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      400,
    );
  }
};
