import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GeocodeResult, Granularity } from "../../shared/types.ts";

export interface SelectedLocation extends GeocodeResult {}

interface AppState {
  location: SelectedLocation;
  setLocation: (loc: SelectedLocation) => void;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  anchor: string;
  setAnchor: (iso: string) => void;
  radiusKm: number;
  setRadiusKm: (r: number) => void;
}

const DEFAULT_LOCATION: SelectedLocation = {
  lat: 59.3293,
  lon: 18.0686,
  label: "Stockholm, Sweden",
};

const AppStateContext = createContext<AppState | null>(null);

/** Provides global app state: location, time granularity, anchor date, and search radius. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<SelectedLocation>(DEFAULT_LOCATION);
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [anchor, setAnchor] = useState<string>("2024-07-15");
  const [radiusKm, setRadiusKm] = useState<number>(50);

  const value = useMemo<AppState>(
    () => ({
      location,
      setLocation,
      granularity,
      setGranularity,
      anchor,
      setAnchor,
      radiusKm,
      setRadiusKm,
    }),
    [location, granularity, anchor, radiusKm],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

/** Read and update global app state; must be used within `AppStateProvider`. */
export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
