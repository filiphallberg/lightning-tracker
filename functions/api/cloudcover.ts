/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../lib/env.ts";
import type {
  CloudBucket,
  CloudCoverResponse,
  StationInfo,
} from "../../shared/types.ts";
import { cachedJson, errorResponse, jsonResponse, responseCacheKey, responseCacheTtl, roundCoord } from "../lib/cache.ts";
import { parseLocation, parseRange } from "../lib/params.ts";
import {
  fetchCloudLatest,
  fetchCloudSeries,
  fetchCloudStations,
} from "../lib/smhi.ts";
import { haversineKm } from "../lib/geo.ts";
import { buildBuckets, bucketIndex } from "../lib/aggregate.ts";

const MAX_STATION_CANDIDATES = 4;
/** corrected-archive omits the most recent months; merge latest-months too. */
const RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 120;

/** Cloudflare Pages handler: returns cloud-cover observations for a location/range. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const { lat, lon } = parseLocation(url);
    const { granularity, from, to } = parseRange(url);

    const cacheKey = responseCacheKey("cloudcover", {
      lat: roundCoord(lat),
      lon: roundCoord(lon),
      granularity,
      from,
      to,
    });

    const response = await cachedJson(
      env,
      cacheKey,
      responseCacheTtl(from, to),
      async () => {
        const buckets = buildBuckets(granularity, from, to);
        const rangeStart = buckets[0]?.start ?? Date.parse(from + "T00:00:00Z");
        const rangeEnd = buckets[buckets.length - 1]?.end ?? rangeStart;
        const n = buckets.length;

        const needsRecent = rangeEnd > Date.now() - RECENT_WINDOW_MS;
        const stations = await fetchCloudStations(env);
        const ranked = stations
          .map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
          .sort((a, b) => a.distanceKm - b.distanceKm);

        const overlapping = ranked.filter(
          (s) => s.from <= rangeEnd && (s.to === 0 || s.to >= rangeStart),
        );
        const candidates = (overlapping.length > 0 ? overlapping : ranked).slice(
          0,
          MAX_STATION_CANDIDATES,
        );

        let chosen: StationInfo | null = null;
        let samplesInRange: { t: number; oktas: number }[] = [];

        for (const cand of candidates) {
          const series = await fetchCloudSeries(env, cand.id);
          const recent = needsRecent ? await fetchCloudLatest(env, cand.id) : [];
          const within = [...series, ...recent].filter(
            (p) => p.t >= rangeStart && p.t < rangeEnd,
          );
          if (within.length > 0) {
            chosen = {
              id: cand.id,
              name: cand.name,
              lat: cand.lat,
              lon: cand.lon,
              distanceKm: cand.distanceKm,
            };
            samplesInRange = within;
            break;
          }
        }

        const sum = new Array<number>(n).fill(0);
        const cnt = new Array<number>(n).fill(0);
        let totalSum = 0;
        let totalCnt = 0;

        for (const p of samplesInRange) {
          const idx = bucketIndex(granularity, rangeStart, p.t, n);
          if (idx < 0) continue;
          sum[idx] += p.oktas;
          cnt[idx] += 1;
          totalSum += p.oktas;
          totalCnt += 1;
        }

        const outBuckets: CloudBucket[] = buckets.map((b, i) => {
          const mean = cnt[i] > 0 ? sum[i] / cnt[i] : null;
          return {
            ...b,
            meanOktas: mean,
            coverage: mean === null ? null : mean / 8,
            samples: cnt[i],
          };
        });

        return {
          location: { lat, lon },
          station: chosen,
          granularity,
          from,
          to,
          buckets: outBuckets,
          meanOktas: totalCnt > 0 ? totalSum / totalCnt : null,
        } satisfies CloudCoverResponse;
      },
    );

    return jsonResponse(response, { sMaxAge: 86_400 });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      400,
    );
  }
};
