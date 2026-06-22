import { Hero } from "./sections/Hero.tsx";
import { ControlsBar } from "./sections/ControlsBar.tsx";
import { OverviewStats } from "./sections/OverviewStats.tsx";
import { CloudCoverSection } from "./sections/CloudCoverSection.tsx";
import { LightningSection } from "./sections/LightningSection.tsx";
import { ForecastSection } from "./sections/ForecastSection.tsx";
import { ThemeToggle } from "./components/ThemeToggle.tsx";

/** Root layout composing the hero, controls, and all data visualization sections. */
export function App() {
  return (
    <div className="grain min-h-svh">
      <ThemeToggle />
      <Hero />
      <ControlsBar />
      <main>
        <OverviewStats />
        <CloudCoverSection />
        <LightningSection />
        <ForecastSection />
      </main>
    </div>
  );
}
