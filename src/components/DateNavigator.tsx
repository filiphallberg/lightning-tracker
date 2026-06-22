import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Granularity } from "../../shared/types.ts";
import { formatSelection, isAtMax, shiftAnchor } from "../lib/dates.ts";

/** Step backward/forward through time at the current granularity, with a date picker in day mode. */
export function DateNavigator({
  granularity,
  anchor,
  onChange,
}: {
  granularity: Granularity;
  anchor: string;
  onChange: (iso: string) => void;
}) {
  const atMax = isAtMax(granularity, anchor);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-subtle surface-muted p-1">
      <button
        aria-label="Previous period"
        onClick={() => onChange(shiftAnchor(anchor, granularity, -1))}
        className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors duration-200 hover:surface-muted hover:text-ink"
      >
        <ChevronLeft size={18} />
      </button>

      {granularity === "day" ? (
        <input
          type="date"
          value={anchor}
          max={new Date().toISOString().slice(0, 10)}
          min="2012-01-01"
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="cursor-pointer bg-transparent px-2 text-center text-sm font-medium text-ink focus:outline-none"
        />
      ) : (
        <span className="min-w-28 px-2 text-center text-sm font-medium text-ink">
          {formatSelection(granularity, anchor)}
        </span>
      )}

      <button
        aria-label="Next period"
        disabled={atMax}
        onClick={() => onChange(shiftAnchor(anchor, granularity, 1))}
        className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors duration-200 hover:surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
