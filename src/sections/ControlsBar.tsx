import { useAppState } from "../state/AppState.tsx";
import { SegmentedToggle } from "../components/SegmentedToggle.tsx";
import { DateNavigator } from "../components/DateNavigator.tsx";
import { formatSelection } from "../lib/dates.ts";

/** Sticky bar for granularity, date navigation, and search-radius controls. */
export function ControlsBar() {
  const {
    granularity,
    setGranularity,
    anchor,
    setAnchor,
    radiusKm,
    setRadiusKm,
    location,
  } = useAppState();

  return (
    <div className="sticky top-3 z-40 mx-auto w-full max-w-6xl px-3 sm:px-8">
      <div className="glass flex flex-col gap-4 rounded-2xl px-4 py-3 shadow-xl shadow-black/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedToggle value={granularity} onChange={setGranularity} />
          <DateNavigator
            granularity={granularity}
            anchor={anchor}
            onChange={setAnchor}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="whitespace-nowrap">Radius</span>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              aria-label="Search radius in kilometres"
              className="h-1 w-28 cursor-pointer appearance-none rounded-full surface-muted accent-cyan-glow"
            />
            <span className="w-12 font-medium text-ink tabular-nums">{radiusKm} km</span>
          </label>
        </div>
      </div>

      <p className="mt-2 px-2 text-center text-xs text-ink-faint lg:text-right">
        Showing {formatSelection(granularity, anchor)} ·{" "}
        <span className="text-ink-muted">{location.label}</span>
      </p>
    </div>
  );
}
