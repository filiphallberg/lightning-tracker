import { useQuery } from "@tanstack/react-query";
import {
  geocode,
  getCloudCover,
  getForecast,
  getLightning,
  type SeriesParams,
} from "../lib/api.ts";
import { rangeFor } from "../lib/dates.ts";
import { useAppState } from "../state/AppState.tsx";

/** TanStack Query hook that geocodes a search string (enabled when query ≥ 2 chars). */
export function useGeocode(query: string) {
  return useQuery({
    queryKey: ["geocode", query],
    queryFn: ({ signal }) => geocode(query, signal),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 60,
  });
}

/** Derive API series parameters from the current app state (location, range, radius). */
function useSeriesParams(): SeriesParams {
  const { location, granularity, anchor, radiusKm } = useAppState();
  const { from, to } = rangeFor(granularity, anchor);
  return {
    lat: location.lat,
    lon: location.lon,
    radiusKm,
    granularity,
    from,
    to,
  };
}

/** TanStack Query hook for lightning strike data matching the current selection. */
export function useLightning() {
  const p = useSeriesParams();
  return useQuery({
    queryKey: ["lightning", p],
    queryFn: ({ signal }) => getLightning(p, signal),
    staleTime: p.granularity === "year" ? 1000 * 60 * 60 * 24 : undefined,
  });
}

/** TanStack Query hook for cloud-cover data matching the current selection. */
export function useCloudCover() {
  const p = useSeriesParams();
  return useQuery({
    queryKey: ["cloudcover", p],
    queryFn: ({ signal }) => getCloudCover(p, signal),
    staleTime: p.granularity === "year" ? 1000 * 60 * 60 * 24 : undefined,
  });
}

/** TanStack Query hook for the seasonal lightning/climatology forecast. */
export function useForecast() {
  const { location, radiusKm } = useAppState();
  return useQuery({
    queryKey: ["forecast", location.lat, location.lon, radiusKm],
    queryFn: ({ signal }) =>
      getForecast(location.lat, location.lon, radiusKm, signal),
    staleTime: 1000 * 60 * 60 * 6,
  });
}
