/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../lib/env.ts";
import { errorResponse, jsonResponse } from "../lib/cache.ts";
import { parseLocation, parseRadius } from "../lib/params.ts";
import { computeForecast } from "../lib/forecast.ts";

/** Cloudflare Pages handler: returns the seasonal lightning/climatology forecast. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const { lat, lon } = parseLocation(url);
    const radiusKm = parseRadius(url);
    const forecast = await computeForecast(env, lat, lon, radiusKm);
    return jsonResponse(forecast, { sMaxAge: 86_400 });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      400,
    );
  }
};
