import type { Report, SourceName } from "./types";

/** Illustrative report for a fictional notes app, used by the sample view and the landing page. */
export const sampleReport: Report = {
  product: "Sample report",
  generatedAt: "2026-10-18T09:00:00.000Z",
  totalSignals: 1247,
  negativeRate: 67,
  sourceCounts: { reddit: 612, appstore: 418, hackernews: 217 },
  summary:
    "New users stall during setup because the blank workspace offers no guidance, and mobile users lose edits when sync silently fails offline. Power users are frustrated by slowdowns in large databases, while pricing complaints are frequent but low in emotional intensity.",
  themes: [
    {
      name: "Onboarding Friction",
      segment: "New Users",
      description: "First-run experience drops users into an empty workspace with no templates or guidance, and many abandon before creating a second page.",
      signalCount: 347,
      emotionalIntensity: 84,
      recurrence: 28,
      segmentImpact: "High",
      recommendation: "Ship a guided first-run with three role-based starter templates and an empty-state checklist.",
      quotes: [
        { text: "Opened it, stared at a blank page for five minutes, closed it. I have no idea where to even start.", source: "reddit" },
        { text: "Powerful but the learning curve is a cliff. Gave up after day two.", source: "appstore" },
      ],
    },
    {
      name: "Offline Sync Failures",
      segment: "Mobile Users",
      description: "Edits made offline on mobile are overwritten or lost on reconnect, with no conflict warning.",
      signalCount: 262,
      emotionalIntensity: 79,
      recurrence: 21,
      segmentImpact: "High",
      recommendation: "Queue offline edits locally and surface a conflict-resolution prompt on reconnect.",
      quotes: [
        { text: "Wrote meeting notes on the subway, got signal back and they were just gone. Unacceptable for a notes app.", source: "appstore" },
        { text: "Sync conflicts silently pick the server version. Lost an hour of work twice this week.", source: "hackernews" },
      ],
    },
    {
      name: "Database Performance",
      segment: "Power Users",
      description: "Views with thousands of rows take seconds to load and filters lag while typing.",
      signalCount: 189,
      emotionalIntensity: 63,
      recurrence: 15,
      segmentImpact: "Medium",
      recommendation: "Virtualize large table views and debounce filter queries server-side.",
      quotes: [{ text: "Our CRM database has 4k rows and every filter change takes 3-4 seconds. Considering moving off.", source: "reddit" }],
    },
    {
      name: "Pricing Confusion",
      segment: "Small Teams",
      description: "Users are unsure which plan includes guests and version history, and per-seat jumps feel steep.",
      signalCount: 141,
      emotionalIntensity: 41,
      recurrence: 11,
      segmentImpact: "Low",
      recommendation: "Add a plan comparison table on the upgrade screen that calls out guests and history limits.",
      quotes: [{ text: "Took me 20 minutes to figure out if guests count as seats.", source: "reddit" }],
    },
  ],
  competitors: [
    { name: "Competitor A", signalCount: 88, strengths: ["Fast, reliable sync", "Simple onboarding"], weaknesses: ["Limited databases", "No API"] },
    { name: "Competitor B", signalCount: 64, strengths: ["Strong offline mode"], weaknesses: ["Dated UI", "Weak collaboration"] },
  ],
};

export const sampleSignals: { text: string; source: SourceName; theme: number }[] = [
  { text: "Blank page on first launch, no idea where to start", source: "appstore", theme: 0 },
  { text: "Lost my offline edits again after reconnecting", source: "reddit", theme: 1 },
  { text: "4k-row database takes 3s to filter", source: "hackernews", theme: 2 },
  { text: "Which plan includes guests? Pricing page is unclear", source: "reddit", theme: 3 },
  { text: "Gave up during setup, the learning curve is a cliff", source: "appstore", theme: 0 },
  { text: "Sync silently picked the server version, work gone", source: "hackernews", theme: 1 },
  { text: "Templates are buried, onboarding needs a checklist", source: "reddit", theme: 0 },
  { text: "Typing in filters lags on big tables", source: "appstore", theme: 2 },
  { text: "Phone app overwrote my laptop changes", source: "appstore", theme: 1 },
  { text: "Seat pricing jump from 5 to 6 users is steep", source: "reddit", theme: 3 },
];

export const sourceLabel: Record<SourceName, string> = {
  reddit: "Reddit",
  appstore: "App Store",
  hackernews: "Hacker News",
};
