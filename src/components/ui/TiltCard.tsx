import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Glass panel that tilts and lifts toward the pointer.
 */
export function TiltCard({
  children,
  className = "",
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 180,
    damping: 16,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 180,
    damping: 16,
  });

  /** Update tilt angles from the pointer position relative to the card. */
  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  /** Return the card to a neutral tilt when the pointer leaves. */
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      whileHover={reduce ? undefined : { scale: 1.02, y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      style={
        reduce
          ? undefined
          : { rotateX, rotateY, transformPerspective: 900 }
      }
      className={`glass rounded-3xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
