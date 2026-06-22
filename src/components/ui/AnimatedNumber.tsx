import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

/** Counts up to `value` when scrolled into view. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      if (ref.current) {
        ref.current.textContent = value.toFixed(decimals) + suffix;
      }
      return;
    }
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = latest.toFixed(decimals) + suffix;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, suffix, mv, reduce]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
