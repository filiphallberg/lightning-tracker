import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import type { CloudBucket } from "../../../shared/types.ts";
import { useElementSize } from "../../hooks/useElementSize.ts";
import { thinLabels } from "../../lib/charts.ts";

const PAD = { top: 16, right: 16, bottom: 26, left: 30 };

/** Area chart of mean cloud cover (oktas) over time with hover crosshair. */
export function CloudCoverChart({
  buckets,
  height = 260,
}: {
  buckets: CloudBucket[];
  height?: number;
}) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const gradId = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const n = buckets.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);

  const x = scaleLinear().domain([0, Math.max(1, n - 1)]).range([PAD.left, PAD.left + innerW]);
  const y = scaleLinear().domain([0, 8]).range([PAD.top + innerH, PAD.top]);

  const defined = (d: CloudBucket) => d.meanOktas !== null;
  const lineGen = line<CloudBucket>()
    .defined(defined)
    .x((_, i) => x(i))
    .y((d) => y(d.meanOktas ?? 0))
    .curve(curveMonotoneX);
  const areaGen = area<CloudBucket>()
    .defined(defined)
    .x((_, i) => x(i))
    .y0(PAD.top + innerH)
    .y1((d) => y(d.meanOktas ?? 0))
    .curve(curveMonotoneX);

  const linePath = width > 0 ? lineGen(buckets) ?? "" : "";
  const areaPath = width > 0 ? areaGen(buckets) ?? "" : "";
  const labelIdx = thinLabels(n, innerW);
  const ticks = [0, 2, 4, 6, 8];

  const hoverBucket = hover !== null ? buckets[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label="Cloud cover over time">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6ee7ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-[#64748b] text-[10px]">
                {t}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gradId})`} opacity={0.9} />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#6ee7ff"
            strokeWidth={2}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {labelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-[#64748b] text-[10px]"
            >
              {buckets[i]?.label}
            </text>
          ))}

          {hoverBucket && hoverBucket.meanOktas !== null ? (
            <g>
              <line
                x1={x(hover!)}
                x2={x(hover!)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="rgba(110,231,255,0.4)"
                strokeWidth={1}
              />
              <circle cx={x(hover!)} cy={y(hoverBucket.meanOktas)} r={4} fill="#6ee7ff" />
            </g>
          ) : null}

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

      {hoverBucket ? (
        <div
          className="glass pointer-events-none absolute top-2 right-2 rounded-lg px-3 py-1.5 text-xs"
          aria-hidden="true"
        >
          <span className="text-ink-faint">{hoverBucket.label}</span>
          <span className="ml-2 font-medium text-cyan-glow">
            {hoverBucket.meanOktas === null
              ? "no data"
              : `${hoverBucket.meanOktas.toFixed(1)}/8 oktas`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
