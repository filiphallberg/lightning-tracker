import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const CLOUDS = [
  { x: "8%", y: "18%", scale: 0.7, delay: 0 },
  { x: "72%", y: "12%", scale: 0.55, delay: 0.4 },
  { x: "62%", y: "78%", scale: 0.65, delay: 0.8 },
];

const SPARKS = [
  { x: "22%", y: "32%", delay: 0.2 },
  { x: "78%", y: "44%", delay: 0.6 },
  { x: "48%", y: "68%", delay: 1 },
  { x: "14%", y: "72%", delay: 0.9 },
];

/** Decorative cloud SVG used in the hero atmosphere visual. */
function Cloud({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      width="88"
      height="44"
      viewBox="0 0 88 44"
      fill="none"
      aria-hidden="true"
      style={style}
    >
      <ellipse cx="28" cy="28" rx="22" ry="14" fill="currentColor" opacity="0.35" />
      <ellipse cx="48" cy="22" rx="26" ry="16" fill="currentColor" opacity="0.45" />
      <ellipse cx="66" cy="30" rx="18" ry="12" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/**
 * Playful orbit instrument: scroll spin, pointer tilt, drifting clouds & sparks.
 */
export function AtmosphereVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const baseRotate = useTransform(scrollYProgress, [0, 1], [0, 280]);
  const rotate = useSpring(baseRotate, { stiffness: 55, damping: 18 });
  const tiltX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), {
    stiffness: 140,
    damping: 14,
  });
  const tiltY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), {
    stiffness: 140,
    damping: 14,
  });

  const counterRotate = useTransform(rotate, (r) => -r * 0.85);

  /** Map pointer position within the visual to tilt motion values. */
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className="relative mx-auto grid aspect-square w-full max-w-[34rem] place-items-center text-cyan-glow/80"
      style={{ perspective: 1100 }}
    >
      {!reduce
        ? CLOUDS.map((c, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute text-ink-muted"
              style={{ left: c.x, top: c.y, scale: c.scale }}
              animate={{ y: [0, -10, 0], x: [0, i % 2 ? 6 : -6, 0] }}
              transition={{
                duration: 4 + i * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: c.delay,
              }}
            >
              <Cloud style={{ width: 88, height: 44 }} />
            </motion.div>
          ))
        : null}

      {!reduce
        ? SPARKS.map((s, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute size-2 rounded-full bg-magenta-bolt shadow-[0_0_12px_3px] shadow-magenta-bolt/50"
              style={{ left: s.x, top: s.y }}
              animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: s.delay,
              }}
            />
          ))
        : null}

      <motion.div
        className="relative grid size-full place-items-center"
        style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY }}
        whileHover={reduce ? undefined : { scale: 1.03 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div
          className="absolute size-44 rounded-full bg-cyan-glow/25 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute size-28 rounded-full bg-violet-bolt/35 blur-2xl"
          animate={reduce ? undefined : { scale: [1.05, 0.92, 1.05] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        <motion.div
          className="absolute size-full"
          style={reduce ? undefined : { rotate }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-subtle"
              style={{
                transform: `rotate(${i * 45}deg) scale(${1 - i * 0.14})`,
                borderTopColor: "var(--color-cyan-glow)",
                borderRightColor: "var(--color-violet-bolt)",
                opacity: 0.35 + i * 0.12,
              }}
              animate={reduce ? undefined : { opacity: [0.3, 0.7, 0.3] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
          <motion.div
            className="absolute top-1/2 left-0 size-3.5 -translate-y-1/2 rounded-full bg-cyan-glow shadow-[0_0_20px_6px] shadow-cyan-glow/60"
            animate={reduce ? undefined : { scale: [1, 1.35, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-0 right-[18%] size-2 rounded-full bg-magenta-bolt shadow-[0_0_14px_4px] shadow-magenta-bolt/50"
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </motion.div>

        <motion.div
          className="relative grid place-items-center"
          style={reduce ? undefined : { rotate: counterRotate }}
          whileHover={reduce ? undefined : { scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 16 }}
        >
          <motion.svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            aria-hidden="true"
            animate={reduce ? undefined : { filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="bolt-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--color-cyan-glow)" />
                <stop offset="1" stopColor="var(--color-magenta-bolt)" />
              </linearGradient>
            </defs>
            <path
              d="M13 2 4 14h6l-1 8 9-12h-6z"
              fill="url(#bolt-grad)"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="0.4"
            />
          </motion.svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
