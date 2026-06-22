import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import type { ForecastPoint } from "../../../shared/types.ts";
import { useElementSize } from "../../hooks/useElementSize.ts";

const PAD = { top: 16, right: 16, bottom: 26, left: 30 };

/** Dual-axis line chart of monthly storm-day probability and cloud-cover range. */
export function ForecastChart({
  points,
  height = 280,
}: {
  points: ForecastPoint[];
  height?: number;
}) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const cloudGrad = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const n = points.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const x = scaleLinear().domain([0, Math.max(1, n - 1)]).range([PAD.left, PAD.left + innerW]);
  const yCloud = scaleLinear().domain([0, 8]).range([PAD.top + innerH, PAD.top]);
  const yProb = scaleLinear().domain([0, 1]).range([PAD.top + innerH, PAD.top]);

  const hasCloud = points.some((p) => p.meanCloudOktas !== null);

  const cloudBand = area<ForecastPoint>()
    .defined((d) => d.meanCloudOktas !== null)
    .x((_, i) => x(i))
    .y0((d) => yCloud(d.cloudLow ?? 0))
    .y1((d) => yCloud(d.cloudHigh ?? 0))
    .curve(curveMonotoneX);
  const cloudLine = line<ForecastPoint>()
    .defined((d) => d.meanCloudOktas !== null)
    .x((_, i) => x(i))
    .y((d) => yCloud(d.meanCloudOktas ?? 0))
    .curve(curveMonotoneX);
  const probLine = line<ForecastPoint>()
    .x((_, i) => x(i))
    .y((d) => yProb(d.lightningProbability))
    .curve(curveMonotoneX);

  const ready = width > 0;
  const hoverPoint = hover !== null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {ready ? (
        <svg width={width} height={height} role="img" aria-label="Monthly forecast of lightning probability and cloud cover">
          <defs>
            <linearGradient id={cloudGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {hasCloud ? <path d={cloudBand(points) ?? ""} fill={`url(#${cloudGrad})`} /> : null}
          {hasCloud ? (
            <path d={cloudLine(points) ?? ""} fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth={1.5} strokeDasharray="4 4" />
          ) : null}

          <motion.path
            d={probLine(points) ?? ""}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          />

          {points.map((p, i) => (
            <circle key={p.key} cx={x(i)} cy={yProb(p.lightningProbability)} r={hover === i ? 5 : 3} fill="#a78bfa" />
          ))}

          {points.map((p, i) => (
            <text key={p.key} x={x(i)} y={height - 8} textAnchor="middle" className="fill-[#64748b] text-[10px]">
              {p.label}
            </text>
          ))}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={(e) => {
              const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
              const rel = (e.clientX - rect.left) / Math.max(1, rect.width);
              setHover(Math.round(rel * (n - 1)));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      ) : null}

      {hoverPoint ? (
        <div className="glass pointer-events-none absolute top-2 right-2 rounded-lg px-3 py-2 text-xs">
          <p className="font-medium text-ink">{hoverPoint.label}</p>
          <p className="mt-1 text-violet-bolt">
            {Math.round(hoverPoint.lightningProbability * 100)}% storm-day chance
          </p>
          <p className="text-ink-muted">
            {hoverPoint.meanCloudOktas === null
              ? "cloud: no data"
              : `cloud ${hoverPoint.meanCloudOktas.toFixed(1)}/8`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
