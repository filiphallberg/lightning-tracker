import { motion } from "motion/react";
import type { Granularity } from "../../shared/types.ts";

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

/** Pill-style control for switching between day, month, and year granularity. */
export function SegmentedToggle({
  value,
  onChange,
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex rounded-full border border-subtle surface-muted p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            whileHover={{ scale: active ? 1 : 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="relative cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 sm:px-5"
          >
            {active ? (
              <motion.span
                layoutId="segmented-pill"
                className="absolute inset-0 rounded-full brand-gradient opacity-25 ring-1 ring-cyan-glow/50"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            ) : null}
            <span
              className={`relative z-10 ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
