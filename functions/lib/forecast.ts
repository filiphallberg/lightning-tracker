import type { Env } from "./env.ts";
import type { ForecastPoint, ForecastResponse } from "../../shared/types.ts";
import {
  fetchCloudSeries,
  fetchCloudStations,
  fetchLightningDay,
} from "./smhi.ts";
import { boundingBox, haversineKm } from "./geo.ts";
import { mapPool } from "./cache.ts";
import { MONTH_NAMES } from "./aggregate.ts";

/**
 * Representative days sampled per month. Keeping this small bounds the number
 * of SMHI subrequests (years * 12 * SAMPLE_DAYS) so a cold forecast stays well
 * within Workers limits; repeat requests are served from KV.
 */
const SAMPLE_DAYS = [4, 11, 18, 25];
const BASELINE_COUNT = 5;
const MAX_STATION_CANDIDATES = 4;

/** Return the number of days in a given month (leap-year aware). */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Arithmetic mean of a numeric array; returns 0 for empty input. */
function mean(values: number[]): number {
  return values.length
    ? values.reduce((sum, x) => sum + x, 0) / values.length
    : 0;
}

/** Sample standard deviation of a numeric array relative to a known mean. */
function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, x) => sum + (x - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

interface MonthAccumulator {
  perYearProb: Map<number, { obs: number; hits: number }>;
  perYearCount: Map<number, { obs: number; count: number }>;
}

/**
 * Build a 12-month climatology forecast by sampling historical lightning days
 * and cloud-cover data from the nearest SMHI station within a 5-year baseline.
 */
export async function computeForecast(
  env: Env,
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<ForecastResponse> {
  const currentYear = new Date().getUTCFullYear();
  const baselineYears = Array.from(
    { length: BASELINE_COUNT },
    (_, i) => currentYear - BASELINE_COUNT + i,
  );
  const now = Date.now();
  const box = boundingBox(lat, lon, radiusKm);

  const tasks: { year: number; month: number; day: number; date: number }[] =
    [];
  for (const year of baselineYears) {
    for (let month = 1; month <= 12; month++) {
      for (const day of SAMPLE_DAYS) {
        if (day > daysInMonth(year, month)) continue;
        const date = Date.UTC(year, month - 1, day);
        if (date <= now) tasks.push({ year, month, day, date });
      }
    }
  }

  const sampled = await mapPool(tasks, 8, async (t) => {
    const raw = await fetchLightningDay(env, t);
    let count = 0;
    for (const s of raw) {
      if (
        s.lat < box.minLat ||
        s.lat > box.maxLat ||
        s.lon < box.minLon ||
        s.lon > box.maxLon
      ) {
        continue;
      }
      if (haversineKm(lat, lon, s.lat, s.lon) <= radiusKm) count++;
    }
    return { year: t.year, month: t.month, count };
  });

  const months: MonthAccumulator[] = Array.from({ length: 12 }, () => ({
    perYearProb: new Map(),
    perYearCount: new Map(),
  }));

  for (const s of sampled) {
    const acc = months[s.month - 1];
    const prob = acc.perYearProb.get(s.year) ?? { obs: 0, hits: 0 };
    prob.obs += 1;
    if (s.count > 0) prob.hits += 1;
    acc.perYearProb.set(s.year, prob);

    const cnt = acc.perYearCount.get(s.year) ?? { obs: 0, count: 0 };
    cnt.obs += 1;
    cnt.count += s.count;
    acc.perYearCount.set(s.year, cnt);
  }

  // Cloud-cover climatology from the nearest station covering the baseline.
  const baselineStart = Date.UTC(baselineYears[0], 0, 1);
  const baselineEnd = Date.UTC(currentYear, 0, 1);
  const stations = await fetchCloudStations(env);
  const ranked = stations
    .map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((s) => s.from <= baselineEnd && (s.to === 0 || s.to >= baselineStart));

  const cloudByMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (const cand of ranked.slice(0, MAX_STATION_CANDIDATES)) {
    const series = await fetchCloudSeries(env, cand.id);
    const inBaseline = series.filter((p) => {
      const y = new Date(p.t).getUTCFullYear();
      return y >= baselineYears[0] && y <= currentYear - 1;
    });
    if (inBaseline.length > 0) {
      for (const p of inBaseline) {
        cloudByMonth[new Date(p.t).getUTCMonth()].push(p.oktas);
      }
      break;
    }
  }

  const points: ForecastPoint[] = months.map((acc, i) => {
    const month = i + 1;
    const days = daysInMonth(2023, month);

    const probs: number[] = [];
    for (const { obs, hits } of acc.perYearProb.values()) {
      if (obs > 0) probs.push(hits / obs);
    }
    const lightningProbability = mean(probs);

    const expectedPerYear: number[] = [];
    for (const { obs, count } of acc.perYearCount.values()) {
      if (obs > 0) expectedPerYear.push((count / obs) * days);
    }
    const expectedStrikes = mean(expectedPerYear);
    const expSd = stdDev(expectedPerYear, expectedStrikes);

    const cloudSamples = cloudByMonth[i];
    const meanCloud = cloudSamples.length ? mean(cloudSamples) : null;
    const cloudSd =
      meanCloud === null ? 0 : stdDev(cloudSamples, meanCloud);

    return {
      month,
      key: String(month).padStart(2, "0"),
      label: MONTH_NAMES[i],
      lightningProbability,
      expectedStrikes,
      expectedStrikesLow: Math.max(0, expectedStrikes - expSd),
      expectedStrikesHigh: expectedStrikes + expSd,
      meanCloudOktas: meanCloud,
      cloudLow: meanCloud === null ? null : Math.max(0, meanCloud - cloudSd),
      cloudHigh: meanCloud === null ? null : Math.min(8, meanCloud + cloudSd),
    } satisfies ForecastPoint;
  });

  let peakMonth = MONTH_NAMES[0];
  let peakProbability = 0;
  let annualExpectedStrikes = 0;
  for (const p of points) {
    annualExpectedStrikes += p.expectedStrikes;
    if (p.lightningProbability > peakProbability) {
      peakProbability = p.lightningProbability;
      peakMonth = p.label;
    }
  }

  return {
    location: { lat, lon },
    radiusKm,
    generatedAt: Date.now(),
    baselineYears,
    points,
    summary: { peakMonth, peakProbability, annualExpectedStrikes },
  };
}
