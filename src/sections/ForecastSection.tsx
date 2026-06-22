import { Sparkles } from "lucide-react";
import { useForecast } from "../hooks/useWeather.ts";
import { Section } from "../components/ui/Section.tsx";
import { AsyncBoundary } from "../components/ui/States.tsx";
import { ForecastChart } from "../components/charts/ForecastChart.tsx";
import { ProbabilityGauge } from "../components/charts/ProbabilityGauge.tsx";
import { AnimatedNumber } from "../components/ui/AnimatedNumber.tsx";

/** Section with seasonal climatology forecast chart and summary gauges. */
export function ForecastSection() {
  const { data, isLoading, isError, error } = useForecast();
  const summary = data?.summary;
  const years = data?.baselineYears;

  return (
    <Section
      id="forecast"
      eyebrow="Climatology"
      title="Seasonal trends, unlocked"
      description={
        years
          ? `Five years of history (${years[0]}–${years[years.length - 1]}) distilled into month-by-month patterns. No black box — just what the data keeps repeating, year after year.`
          : "Five years of history distilled into month-by-month patterns — the long view on what each season tends to deliver."
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <div className="glass flex flex-col items-center justify-center gap-6 rounded-3xl p-6">
          <AsyncBoundary
            isLoading={isLoading}
            isError={isError}
            error={error}
            height={260}
          >
            {summary ? (
              <>
                <ProbabilityGauge
                  value={summary.peakProbability}
                  caption={`storm-day chance in ${summary.peakMonth} — the peak month`}
                />
                <div className="flex items-center gap-2 rounded-full border border-subtle surface-muted px-4 py-2 text-sm text-ink-muted">
                  <Sparkles size={15} className="text-magenta-bolt" />
                  <span>
                    ~
                    <AnimatedNumber
                      value={Math.round(summary.annualExpectedStrikes)}
                      className="font-medium text-ink"
                    />{" "}
                    strikes per year on average
                  </span>
                </div>
              </>
            ) : null}
          </AsyncBoundary>
        </div>

        <div className="glass rounded-3xl p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-violet-bolt" />
              Storm-day probability
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded surface-muted border border-subtle" />
              Cloud cover range (oktas)
            </span>
          </div>
          <AsyncBoundary
            isLoading={isLoading}
            isError={isError}
            error={error}
            height={280}
          >
            {data ? <ForecastChart points={data.points} /> : null}
          </AsyncBoundary>
        </div>
      </div>
    </Section>
  );
}
