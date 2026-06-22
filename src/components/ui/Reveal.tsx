import type { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeUp } from "../../lib/motion.ts";

/** Fades + lifts its children into view the first time they are scrolled to. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
