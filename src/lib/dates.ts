import type { Granularity } from "../../shared/types.ts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Zero-pad a number to two digits for ISO date strings. */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Return the last calendar day (1–31) for a given year and month. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export interface AnchorParts {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

/** Split an ISO date string (YYYY-MM-DD) into year, month, and day parts. */
export function parseAnchor(iso: string): AnchorParts {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** Format year/month/day parts into an ISO date string (YYYY-MM-DD). */
export function toIso({ year, month, day }: AnchorParts): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Compute the inclusive [from, to] range for a granularity + anchor date. */
export function rangeFor(
  granularity: Granularity,
  anchorIso: string,
): { from: string; to: string } {
  const { year, month } = parseAnchor(anchorIso);
  if (granularity === "day") {
    return { from: anchorIso, to: anchorIso };
  }
  if (granularity === "year") {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDayOfMonth(year, month))}`,
  };
}

/** Shift the anchor by one unit of the current granularity. */
export function shiftAnchor(
  anchorIso: string,
  granularity: Granularity,
  dir: -1 | 1,
): string {
  const { year, month, day } = parseAnchor(anchorIso);
  if (granularity === "day") {
    const d = new Date(Date.UTC(year, month - 1, day + dir));
    return toIso({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    });
  }
  if (granularity === "year") {
    return toIso({ year: year + dir, month, day: Math.min(day, lastDayOfMonth(year + dir, month)) });
  }
  const d = new Date(Date.UTC(year, month - 1 + dir, 1));
  const ny = d.getUTCFullYear();
  const nm = d.getUTCMonth() + 1;
  return toIso({ year: ny, month: nm, day: Math.min(day, lastDayOfMonth(ny, nm)) });
}

/** Human label for the current selection, e.g. "15 July 2024". */
export function formatSelection(
  granularity: Granularity,
  anchorIso: string,
): string {
  const { year, month, day } = parseAnchor(anchorIso);
  if (granularity === "day") return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  if (granularity === "year") return String(year);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Axis bucket label for charts, e.g. "hour", "day", or "month". */
export function bucketUnit(granularity: Granularity): string {
  if (granularity === "day") return "hour";
  if (granularity === "year") return "month";
  return "day";
}

/** Is the anchor at or after "today" for the given granularity (disable next)? */
export function isAtMax(granularity: Granularity, anchorIso: string): boolean {
  const next = shiftAnchor(anchorIso, granularity, 1);
  const today = new Date().toISOString().slice(0, 10);
  return next > today;
}

export { MONTH_NAMES };
