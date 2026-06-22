import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useGeocode } from "../hooks/useWeather.ts";
import { useDebounce } from "../hooks/useDebounce.ts";
import { useAppState } from "../state/AppState.tsx";
import type { GeocodeResult } from "../../shared/types.ts";

/** Search input with debounced geocoding dropdown for selecting a Swedish location. */
export function LocationSearch() {
  const { location, setLocation } = useAppState();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useGeocode(debounced);
  const results = data?.results ?? [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  /** Apply a geocode result as the active location and close the dropdown. */
  function choose(r: GeocodeResult) {
    setLocation(r);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-subtle surface-muted px-4 py-3 backdrop-blur transition-colors duration-200 focus-within:border-cyan-glow/50">
        <Search size={18} className="shrink-0 text-ink-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a place in Sweden…"
          aria-label="Search a location"
          className="w-full bg-transparent text-base text-ink placeholder:text-ink-faint focus:outline-none"
        />
        {isFetching ? (
          <LoaderCircle size={18} className="shrink-0 animate-spin text-cyan-glow" />
        ) : null}
      </div>

      <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-ink-faint">
        <MapPin size={12} className="text-cyan-glow" />
        <span className="truncate">{location.label}</span>
      </p>

      <AnimatePresence>
        {open && debounced.trim().length >= 2 && results.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="glass absolute z-30 mt-2 w-full overflow-hidden rounded-2xl p-1 shadow-2xl shadow-black/40"
          >
            {results.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button
                  onClick={() => choose(r)}
                  className="flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition-colors duration-150 hover:surface-muted hover:text-ink"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-cyan-glow" />
                  <span className="line-clamp-2">{r.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
