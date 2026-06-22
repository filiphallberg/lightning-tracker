import { CloudSun, Gauge, Zap, Activity } from "lucide-react";
import type { ReactNode } from "react";
import { useCloudCover, useLightning } from "../hooks/useWeather.ts";
import { AnimatedNumber } from "../components/ui/AnimatedNumber.tsx";
import { TiltCard } from "../components/ui/TiltCard.tsx";
import { Reveal } from "../components/ui/Reveal.tsx";

/** Summary stat cards for total strikes, storm-day probability, cloud cover, and peak intensity. */
function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  loading: boolean;
}) {
  return (
    <TiltCard className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </span>
        <span className="text-cyan-glow">{icon}</span>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
        {loading ? <span className="text-ink-faint">—</span> : value}
      </div>
    </TiltCard>
  );
}

/** Grid of headline metrics distilled from the current lightning and cloud-cover queries. */
export function OverviewStats() {
  const lightning = useLightning();
  const cloud = useCloudCover();

  const totals = lightning.data?.totals;
  const meanCloud = cloud.data?.meanOktas ?? null;

  return (
    <section id="overview" className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8">
      <Reveal>
        <p className="mb-4 text-center text-sm font-medium text-ink-muted lg:text-left">
          The story at a glance — key metrics, distilled.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Zap size={18} />}
            label="Total strikes"
            loading={lightning.isLoading}
            value={<AnimatedNumber value={totals?.count ?? 0} />}
          />
          <StatCard
            icon={<Gauge size={18} />}
            label="Storm-day probability"
            loading={lightning.isLoading}
            value={
              <AnimatedNumber
                value={Math.round((totals?.probability ?? 0) * 100)}
                suffix="%"
              />
            }
          />
          <StatCard
            icon={<CloudSun size={18} />}
            label="Mean cloud cover"
            loading={cloud.isLoading}
            value={
              meanCloud === null ? (
                <span className="text-ink-faint">n/a</span>
              ) : (
                <>
                  <AnimatedNumber value={meanCloud} decimals={1} />
                  <span className="text-lg text-ink-muted">/8</span>
                </>
              )
            }
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Peak intensity"
            loading={lightning.isLoading}
            value={
              totals?.maxPeakCurrent == null ? (
                <span className="text-ink-faint">n/a</span>
              ) : (
                <>
                  <AnimatedNumber value={Math.abs(totals.maxPeakCurrent)} />
                  <span className="text-lg text-ink-muted"> kA</span>
                </>
              )
            }
          />
        </div>
      </Reveal>
    </section>
  );
}
