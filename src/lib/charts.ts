/**
 * Choose which x-axis label indices to render so labels never overlap. Aims for
 * roughly one label per ~52px of horizontal space, always including the last.
 */
export function thinLabels(count: number, innerWidth: number): number[] {
  if (count <= 1) return count === 1 ? [0] : [];
  const maxLabels = Math.max(2, Math.floor(innerWidth / 52));
  const step = Math.ceil(count / maxLabels);
  const idx: number[] = [];
  for (let i = 0; i < count; i += step) idx.push(i);
  if (idx[idx.length - 1] !== count - 1) idx.push(count - 1);
  return idx;
}

/** Map a normalised intensity (0..1) to a cyan -> violet -> magenta ramp. */
export function intensityColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) {
    return mix("#6ee7ff", "#a78bfa", clamped / 0.5);
  }
  return mix("#a78bfa", "#f0abfc", (clamped - 0.5) / 0.5);
}

/** Linearly interpolate between two hex colours at position t (0..1). */
function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Parse a hex colour string into an [r, g, b] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
