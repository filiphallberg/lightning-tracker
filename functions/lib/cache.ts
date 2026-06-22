/// <reference types="@cloudflare/workers-types" />
import type { Env } from "./env.ts";

/**
 * Fetch-through cache backed by Workers KV. Values are stored as JSON. When no
 * KV binding is present (e.g. local dev without `--kv`), it transparently falls
 * back to calling the loader directly.
 */
export async function cachedJson<T>(
  env: Env,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  if (env.CACHE) {
    const hit = await env.CACHE.get(key, "json");
    if (hit !== null && hit !== undefined) return hit as T;
  }
  const value = await loader();
  if (env.CACHE) {
    // KV requires a minimum TTL of 60s.
    await env.CACHE.put(key, JSON.stringify(value), {
      expirationTtl: Math.max(60, ttlSeconds),
    });
  }
  return value;
}

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type",
};

/** Build a JSON HTTP response with cache-control and CORS headers. */
export function jsonResponse(
  data: unknown,
  opts: { sMaxAge?: number; status?: number } = {},
): Response {
  const { sMaxAge = 3600, status = 200 } = opts;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=300, s-maxage=${sMaxAge}`,
      ...CORS_HEADERS,
    },
  });
}

/** Build a JSON error response with a message and HTTP status code. */
export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

/** Round coordinates for stable cache keys (~1 km precision). */
export function roundCoord(n: number): number {
  return Math.round(n * 100) / 100;
}

export function responseCacheKey(
  endpoint: string,
  parts: Record<string, string | number>,
): string {
  const query = Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${endpoint}:resp:${query}`;
}

/** TTL for fully aggregated API responses (past years are immutable). */
export function responseCacheTtl(fromIso: string, toIso: string): number {
  const end = Date.parse(toIso + "T00:00:00Z");
  const ageDays = (Date.now() - end) / 86_400_000;
  if (ageDays > 45) return 60 * 60 * 24 * 180;
  return 60 * 60 * 12;
}

/** Run a small pool of async tasks with bounded concurrency. */
export async function mapPool<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
