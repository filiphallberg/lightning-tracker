import { useLightning } from "../hooks/useWeather.ts";
import { useAppState } from "../state/AppState.tsx";
import { Section } from "../components/ui/Section.tsx";
import { AsyncBoundary } from "../components/ui/States.tsx";
import { LightningChart } from "../components/charts/LightningChart.tsx";
import { StrikeScatter } from "../components/charts/StrikeScatter.tsx";
import { ProbabilityGauge } from "../components/charts/ProbabilityGauge.tsx";
import { formatSelection, bucketUnit } from "../lib/dates.ts";

/** Section with lightning bar chart, strike scatter map, and probability gauge. */
export function LightningSection() {
  const { granularity, anchor, location, radiusKm } = useAppState();
  const { data, isLoading, isError, error } = useLightning();

  const isEmpty = (data?.totals.count ?? 0) === 0;
  const unit = bucketUnit(granularity);
  const loadingHint =
    granularity === "year" && isLoading
      ? "Loading a full year of strike data — first load may take a minute."
      : undefined;

  return (
    <Section
      id="lightning"
      eyebrow="Lightning"
      title="When the sky sparks"
      description={`Strikes within ${radiusKm} km, counted per ${unit} for ${formatSelection(granularity, anchor)}. Watch the patterns emerge — from quiet days to electric peaks.`}
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="glass rounded-3xl p-4 sm:p-6">
          <h3 className="mb-4 text-sm font-medium text-ink-muted">
            Strikes per {unit}
          </h3>
          <AsyncBoundary
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={isEmpty}
            emptyLabel="No strikes recorded"
            emptyHint="Lightning is rare and seasonal — try a summer month or a wider radius."
            loadingHint={loadingHint}
            height={260}
          >
            {data ? <LightningChart buckets={data.buckets} /> : null}
          </AsyncBoundary>
        </div>

        <div className="glass flex flex-col rounded-3xl p-4 sm:p-6">
          <h3 className="mb-4 text-sm font-medium text-ink-muted">
            Spatial spread &amp; probability
          </h3>
          <AsyncBoundary
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={isEmpty}
            emptyLabel="Nothing to map"
            loadingHint={loadingHint}
            height={260}
          >
            {data ? (
              <div className="flex flex-col items-center gap-4">
                <StrikeScatter
                  strikes={data.strikes}
                  location={location}
                  radiusKm={data.radiusKm}
                  height={260}
                />
                <ProbabilityGauge
                  value={data.totals.probability}
                  caption="of days had strikes"
                  size={150}
                />
              </div>
            ) : null}
          </AsyncBoundary>
        </div>
      </div>
    </Section>
  );
}
