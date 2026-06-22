// Shared DTOs used by both the React app and the Cloudflare Pages Functions.

export type Granularity = "day" | "month" | "year";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeocodeResult extends GeoPoint {
  label: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}

export interface SeriesBucket {
  /** Stable identifier, e.g. "2024-07-15", "2024-07", "2024". */
  key: string;
  /** Human readable label for axes. */
  label: string;
  /** Inclusive start (unix ms). */
  start: number;
  /** Exclusive end (unix ms). */
  end: number;
}

export interface LightningBucket extends SeriesBucket {
  count: number;
  daysObserved: number;
  daysWithStrikes: number;
  /** Fraction of observed days that recorded at least one strike (0..1). */
  probability: number;
  /** Mean absolute peak current in kA, or null when no strikes. */
  meanPeakCurrent: number | null;
}

export interface StrikePoint {
  lat: number;
  lon: number;
  /** Unix ms. */
  t: number;
  /** Signed peak current in kA. */
  peakCurrent: number;
  /** true = cloud-to-cloud, false = cloud-to-ground. */
  cloud: boolean;
  distanceKm: number;
}

export interface LightningResponse {
  location: GeoPoint;
  radiusKm: number;
  granularity: Granularity;
  from: string;
  to: string;
  buckets: LightningBucket[];
  /** Sampled individual strikes, used for the day-view scatter map. */
  strikes: StrikePoint[];
  totals: {
    count: number;
    daysObserved: number;
    daysWithStrikes: number;
    probability: number;
    maxPeakCurrent: number | null;
  };
}

export interface CloudBucket extends SeriesBucket {
  /** Mean total cloud amount in oktas (0..8), or null when no data. */
  meanOktas: number | null;
  /** Normalised coverage (0..1). */
  coverage: number | null;
  samples: number;
}

export interface StationInfo {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

export interface CloudCoverResponse {
  location: GeoPoint;
  station: StationInfo | null;
  granularity: Granularity;
  from: string;
  to: string;
  buckets: CloudBucket[];
  meanOktas: number | null;
}

export interface ForecastPoint {
  /** Month index 1..12. */
  month: number;
  key: string;
  label: string;
  lightningProbability: number;
  expectedStrikes: number;
  expectedStrikesLow: number;
  expectedStrikesHigh: number;
  meanCloudOktas: number | null;
  cloudLow: number | null;
  cloudHigh: number | null;
}

export interface ForecastResponse {
  location: GeoPoint;
  radiusKm: number;
  generatedAt: number;
  baselineYears: number[];
  points: ForecastPoint[];
  summary: {
    peakMonth: string;
    peakProbability: number;
    annualExpectedStrikes: number;
  };
}

export interface ApiError {
  error: string;
}
