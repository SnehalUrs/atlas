export type SourceName = "reddit" | "appstore" | "hackernews";

export interface Signal {
  id: number;
  source: SourceName;
  product: string;
  text: string;
  url?: string;
  rating?: number;
}

export interface Quote {
  text: string;
  source: SourceName;
  url?: string;
}

export interface Theme {
  name: string;
  segment: string;
  description: string;
  signalCount: number;
  emotionalIntensity: number;
  recurrence: number;
  segmentImpact: "High" | "Medium" | "Low";
  recommendation: string;
  quotes: Quote[];
}

export interface CompetitorNote {
  name: string;
  signalCount: number;
  strengths: string[];
  weaknesses: string[];
}

export interface Report {
  product: string;
  generatedAt: string;
  totalSignals: number;
  negativeRate: number;
  sourceCounts: Record<SourceName, number>;
  summary: string;
  themes: Theme[];
  competitors: CompetitorNote[];
}

/** One line of the NDJSON stream from /api/analyze. */
export type StreamEvent =
  | { type: "progress"; message: string }
  | { type: "report"; report: Report }
  | { type: "error"; message: string };

/** A pre-generated report saved in src/data/reports. */
export interface LibraryReport extends Report {
  slug: string;
  category: string;
}

export interface LibraryEntry {
  slug: string;
  product: string;
  category: string;
}
