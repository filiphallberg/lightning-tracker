import { motion, useReducedMotion } from "motion/react";
import type { GeoPoint, StrikePoint } from "../../../shared/types.ts";
import { useElementSize } from "../../hooks/useElementSize.ts";

/**
 * Plots individual strikes around the chosen location on a radial "radar".
 * Distance from centre is true (km), so the spatial spread is meaningful.
 */
export function StrikeScatter({
  strikes,
  location,
  radiusKm,
  height = 320,
}: {
  strikes: StrikePoint[];
  location: GeoPoint;
  radiusKm: number;
  height?: number;
}) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const reduce = useReducedMotion();

  const size = Math.min(width || height, height);
  const cx = (width || size) / 2;
  const cy = height / 2;
  const plotR = size / 2 - 16;
  const kmToPx = plotR / radiusKm;
  const cosLat = Math.cos((location.lat * Math.PI) / 180);

  const points = strikes
    .map((s) => {
      const dxKm = (s.lon - location.lon) * 111.32 * cosLat;
      const dyKm = (s.lat - location.lat) * 111.32;
      return {
        x: cx + dxKm * kmToPx,
        y: cy - dyKm * kmToPx,
        cloud: s.cloud,
        mag: Math.min(1, Math.abs(s.peakCurrent) / 60),
      };
    })
    .filter((p) => (p.x - cx) ** 2 + (p.y - cy) ** 2 <= plotR ** 2);

  const rings = [radiusKm, radiusKm * 0.66, radiusKm * 0.33];

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label="Map of lightning strikes around the location">
          {rings.map((km) => (
            <circle
              key={km}
              cx={cx}
              cy={cy}
              r={km * kmToPx}
              fill="none"
              stroke="rgba(148,163,184,0.14)"
              strokeWidth={1}
            />
          ))}
          <line x1={cx - plotR} x2={cx + plotR} y1={cy} y2={cy} stroke="rgba(148,163,184,0.08)" />
          <line x1={cx} x2={cx} y1={cy - plotR} y2={cy + plotR} stroke="rgba(148,163,184,0.08)" />

          <text x={cx + radiusKm * kmToPx - 4} y={cy - 6} textAnchor="end" className="fill-[#64748b] text-[10px]">
            {radiusKm} km
          </text>

          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2 + p.mag * 4}
              fill={p.cloud ? "#6ee7ff" : "#f0abfc"}
              opacity={0.85}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              whileInView={reduce ? undefined : { scale: 1, opacity: 0.85 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(0.8, i * 0.004) }}
            />
          ))}

          <circle cx={cx} cy={cy} r={4} fill="#fff" />
          <circle cx={cx} cy={cy} r={9} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1} />
        </svg>
      ) : null}

      <div className="absolute bottom-2 left-3 flex gap-4 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-cyan-glow" /> Cloud
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-magenta-bolt" /> Ground
        </span>
      </div>
    </div>
  );
}
