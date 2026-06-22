/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../lib/env.ts";
import type { GeocodeResponse, GeocodeResult } from "../../shared/types.ts";
import { cachedJson, errorResponse, jsonResponse } from "../lib/cache.ts";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/** Cloudflare Pages handler: geocodes a place name to Swedish coordinates via Nominatim. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return jsonResponse({ results: [] } satisfies GeocodeResponse);
    }

    const key = `geocode:${q.toLowerCase()}`;
    const results = await cachedJson<GeocodeResult[]>(
      env,
      key,
      60 * 60 * 24 * 30,
      async () => {
        const params = new URLSearchParams({
          q,
          format: "jsonv2",
          limit: "5",
          countrycodes: "se",
          "accept-language": "en",
        });
        const res = await fetch(`${NOMINATIM}?${params.toString()}`, {
          headers: {
            "User-Agent": "Skyfall-Weather-Viz/1.0 (SMHI lightning atlas)",
            Accept: "application/json",
          },
          cf: { cacheTtl: 86_400 },
        });
        if (!res.ok) return [];
        const body = (await res.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;
        return body.map((r) => ({
          lat: Number(r.lat),
          lon: Number(r.lon),
          label: r.display_name,
        }));
      },
    );

    return jsonResponse({ results } satisfies GeocodeResponse, {
      sMaxAge: 86_400,
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      400,
    );
  }
};
