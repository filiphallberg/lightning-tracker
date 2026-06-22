import { motion } from "motion/react";
import { AtmosphereVisual } from "../components/AtmosphereVisual.tsx";
import { LocationSearch } from "../components/LocationSearch.tsx";
import { fadeUp, staggerChildren } from "../lib/motion.ts";

/** Full-viewport hero with headline, location search, and animated atmosphere visual. */
export function Hero() {
  return (
    <section className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-5 pt-24 pb-16 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUp}
            className="text-balance text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl"
          >
            Weather insights,{" "}
            <span className="bg-gradient-to-r from-cyan-glow via-violet-bolt to-magenta-bolt bg-clip-text text-transparent">
              reimagined
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-lg text-ink-muted"
          >
            Dive into decades of cloud cover and lightning across Sweden. From a
            single day to a full year — uncover the seasonal rhythms hiding in
            plain sight.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <LocationSearch />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 16,
            delay: 0.15,
          }}
        >
          <AtmosphereVisual />
        </motion.div>
      </div>
    </section>
  );
}
