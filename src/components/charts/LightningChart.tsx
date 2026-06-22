import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { scaleLinear } from "d3-scale";
import type { LightningBucket } from "../../../shared/types.ts";
import { useElementSize } from "../../hooks/useElementSize.ts";
import { intensityColor, thinLabels } from "../../lib/charts.ts";

const PAD = { top: 16, right: 16, bottom: 26, left: 30 };

/** Bar chart of lightning strike counts per time bucket with hover tooltips. */
export function LightningChart({
  buckets,
  height = 260,
}: {
  buckets: LightningBucket[];
  height?: number;
}) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const n = buckets.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const y = scaleLinear().domain([0, maxCount]).range([PAD.top + innerH, PAD.top]);
  const band = innerW / Math.max(1, n);
  const barW = Math.max(2, band * 0.62);

  const labelIdx = thinLabels(n, innerW);
  const baseline = PAD.top + innerH;
  const ticks = scaleLinear()
    .domain([0, maxCount])
    .ticks(Math.min(4, maxCount))
    .filter((t) => Number.isInteger(t));
  const hoverBucket = hover !== null ? buckets[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label="Lightning strikes over time">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="rgba(148,163,184,0.1)"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-[#64748b] text-[10px]">
                {t}
              </text>
            </g>
          ))}

          {buckets.map((b, i) => {
            const h = baseline - y(b.count);
            const cx = PAD.left + i * band + (band - barW) / 2;
            const active = hover === i;
            return (
              <motion.rect
                key={b.key}
                x={cx}
                width={barW}
                rx={Math.min(3, barW / 2)}
                fill={b.count > 0 ? intensityColor(b.count / maxCount) : "rgba(148,163,184,0.12)"}
                opacity={hover === null || active ? 1 : 0.5}
                initial={reduce ? false : { y: baseline, height: 0 }}
                animate={reduce ? { y: y(b.count), height: h } : undefined}
                whileInView={reduce ? undefined : { y: y(b.count), height: h }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: Math.min(0.4, i * 0.01), ease: [0.16, 1, 0.3, 1] }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}

          {labelIdx.map((i) => (
            <text
              key={i}
              x={PAD.left + i * band + band / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-[#64748b] text-[10px]"
            >
              {buckets[i]?.label}
            </text>
          ))}
        </svg>
      ) : null}

      {hoverBucket ? (
        <div className="glass pointer-events-none absolute top-2 right-2 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-ink-faint">{hoverBucket.label}</span>
          <span className="ml-2 font-medium text-violet-bolt">
            {hoverBucket.count} {hoverBucket.count === 1 ? "strike" : "strikes"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
