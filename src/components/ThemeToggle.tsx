import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider.tsx";

/** Fixed-position button that toggles between light and dark theme. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.06, rotate: isDark ? 8 : -8 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="glass fixed top-4 right-4 z-50 grid size-11 cursor-pointer place-items-center rounded-full shadow-lg shadow-black/10"
    >
      <motion.span
        key={theme}
        initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="text-cyan-glow"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.span>
    </motion.button>
  );
}
