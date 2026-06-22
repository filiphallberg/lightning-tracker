import type { ReactNode } from "react";
import { CloudOff, TriangleAlert } from "lucide-react";

/** Pulsing placeholder block shown while async content is loading. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl surface-muted ${className}`}
      aria-hidden="true"
    />
  );
}

/** Vertically centred icon + message layout for empty, error, and unavailable states. */
function Centered({
  icon,
  title,
  hint,
  height,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  height: number;
}) {
  return (
    <div
      className="grid place-items-center rounded-2xl border border-subtle surface-muted text-center"
      style={{ minHeight: height }}
    >
      <div className="flex flex-col items-center gap-2 px-6 py-8">
        <span className="text-ink-faint">{icon}</span>
        <p className="font-display text-sm text-ink-muted">{title}</p>
        {hint ? <p className="max-w-xs text-xs text-ink-faint">{hint}</p> : null}
      </div>
    </div>
  );
}

/**
 * Renders loading / error / empty / content states with a stable height so the
 * surrounding layout never jumps as data resolves.
 */
export function AsyncBoundary({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyLabel = "No data for this selection",
  emptyHint,
  loadingHint,
  height,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyLabel?: string;
  emptyHint?: string;
  loadingHint?: string;
  height: number;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div
        className="grid place-items-center rounded-2xl border border-subtle surface-muted"
        style={{ minHeight: height }}
        aria-busy="true"
        aria-label="Loading data"
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8">
          <div className="h-1 w-32 animate-pulse rounded-full surface-muted" />
          {loadingHint ? (
            <p className="max-w-xs text-center text-xs text-ink-faint">{loadingHint}</p>
          ) : null}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <Centered
        height={height}
        icon={<TriangleAlert size={28} strokeWidth={1.5} />}
        title="Couldn't load this data"
        hint={error instanceof Error ? error.message : "Please try again."}
      />
    );
  }
  if (isEmpty) {
    return (
      <Centered
        height={height}
        icon={<CloudOff size={28} strokeWidth={1.5} />}
        title={emptyLabel}
        hint={emptyHint}
      />
    );
  }
  return <>{children}</>;
}

/** Stable placeholder when a view is intentionally unavailable (not loading/error). */
export function UnavailableState({
  icon,
  title,
  hint,
  height,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  height: number;
}) {
  return <Centered icon={icon} title={title} hint={hint} height={height} />;
}
