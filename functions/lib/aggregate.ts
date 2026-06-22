import type { Granularity, SeriesBucket } from "../../shared/types.ts";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Build the time buckets for a given range + granularity:
 *  - day   -> 24 hourly buckets
 *  - month -> one bucket per day
 *  - year  -> one bucket per month
 * All timestamps are UTC to match SMHI source data.
 */
export function buildBuckets(
  granularity: Granularity,
  fromIso: string,
  toIso: string,
): SeriesBucket[] {
  const from = Date.parse(fromIso + "T00:00:00Z");

  if (granularity === "year") {
    const year = Number(fromIso.slice(0, 4));
    return Array.from({ length: 12 }, (_, m) => {
      const start = Date.UTC(year, m, 1);
      return {
        key: `${year}-${String(m + 1).padStart(2, "0")}`,
        label: MONTH_NAMES[m],
        start,
        end: Date.UTC(year, m + 1, 1),
      };
    });
  }

  if (granularity === "day") {
    return Array.from({ length: 24 }, (_, h) => {
      const start = from + h * HOUR_MS;
      return {
        key: `${fromIso}T${String(h).padStart(2, "0")}`,
        label: `${String(h).padStart(2, "0")}:00`,
        start,
        end: start + HOUR_MS,
      };
    });
  }

  // month -> daily buckets
  const to = Date.parse(toIso + "T00:00:00Z");
  const buckets: SeriesBucket[] = [];
  for (let t = from; t <= to; t += DAY_MS) {
    const d = new Date(t);
    buckets.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
      label: String(d.getUTCDate()),
      start: t,
      end: t + DAY_MS,
    });
  }
  return buckets;
}

/** Index of the bucket a timestamp belongs to, or -1 if out of range. */
export function bucketIndex(
  granularity: Granularity,
  rangeStart: number,
  t: number,
  bucketCount: number,
): number {
  let idx: number;
  if (granularity === "day") idx = Math.floor((t - rangeStart) / HOUR_MS);
  else if (granularity === "year") {
    const d = new Date(t);
    const rangeYear = new Date(rangeStart).getUTCFullYear();
    if (d.getUTCFullYear() !== rangeYear) return -1;
    idx = d.getUTCMonth();
  } else idx = Math.floor((t - rangeStart) / DAY_MS);
  return idx >= 0 && idx < bucketCount ? idx : -1;
}

export { MONTH_NAMES };
