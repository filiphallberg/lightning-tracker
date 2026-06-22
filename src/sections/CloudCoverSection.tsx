import { useCloudCover } from "../hooks/useWeather.ts";
import { useAppState } from "../state/AppState.tsx";
import { Section } from "../components/ui/Section.tsx";
import { AsyncBoundary } from "../components/ui/States.tsx";
import { CloudCoverChart } from "../components/charts/CloudCoverChart.tsx";
import { formatSelection, bucketUnit } from "../lib/dates.ts";

/** Section displaying cloud-cover chart and nearest SMHI station metadata. */
export function CloudCoverSection() {
  const { granularity, anchor } = useAppState();
  const { data, isLoading, isError, error } = useCloudCover();

  const station = data?.station;
  const isEmpty = !station || data?.buckets.every((b) => b.meanOktas === null);

  const unit = bucketUnit(granularity);
  const loadingHint =
    granularity === "year" && isLoading
      ? "Loading a full year of sky data — hang tight."
      : undefined;

  return (
    <Section
      id="clouds"
      eyebrow="Cloud cover"
      title="Every cloud has a data point"
      description={`Total cloud amount in oktas (0 = clear, 8 = overcast), averaged per ${unit} for ${formatSelection(granularity, anchor)}. A clearer read on what the sky was really doing.`}
    >
      <div className="glass rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-muted">
            {station ? (
              <>
                Nearest station:{" "}
                <span className="text-ink">{station.name}</span>{" "}
                <span className="text-ink-faint">
                  ({station.distanceKm.toFixed(0)} km away)
                </span>
              </>
            ) : (
              <span className="text-ink-faint">No nearby station data</span>
            )}
          </p>
        </div>
        <AsyncBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={isEmpty}
          emptyLabel="No cloud observations here"
          emptyHint="Try a larger city or an earlier date — some stations only cover certain years."
          loadingHint={loadingHint}
          height={260}
        >
          {data ? <CloudCoverChart buckets={data.buckets} /> : null}
        </AsyncBoundary>
      </div>
    </Section>
  );
}
