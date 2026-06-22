import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "../ui/AnimatedNumber.tsx";

/** Circular gauge showing a 0..1 probability. */
export function ProbabilityGauge({
  value,
  caption,
  size = 184,
}: {
  value: number;
  caption: string;
  size?: number;
}) {
  const gradId = useId();
  const reduce = useReducedMotion();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const v = Math.max(0, Math.min(1, value));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${caption}: ${Math.round(v * 100)}%`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7ff" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={reduce ? undefined : { pathLength: v }}
          animate={reduce ? { pathLength: v } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ pathLength: reduce ? v : undefined }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-semibold text-ink">
          <AnimatedNumber value={Math.round(v * 100)} suffix="%" />
        </span>
        <span className="mt-1 max-w-[8rem] text-center text-xs text-ink-muted">
          {caption}
        </span>
      </div>
    </div>
  );
}
