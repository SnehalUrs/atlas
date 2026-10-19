"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { sourceLabel } from "@/lib/sample";
import { elevationColor, layoutPeaks } from "@/lib/terrain";
import type { Report, SourceName, Theme } from "@/lib/types";
import { CountUp } from "./motion";
import { Terrain } from "./Terrain";

function Figure({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rust/20 py-3">
      <span className="label text-muted">{label}</span>
      <span className="font-display text-3xl font-medium tabular-nums">
        <CountUp value={value} duration={1.2} />
        {suffix && <span className="text-xl text-muted">{suffix}</span>}
      </span>
    </div>
  );
}

function SourceKey({ counts }: { counts: Record<SourceName, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-2.5">
      {(Object.entries(counts) as [SourceName, number][]).map(([s, n], i) => (
        <div key={s} className="grid grid-cols-[96px_1fr_36px] items-center gap-3 text-sm">
          <span>{sourceLabel[s]}</span>
          <span className="h-2 overflow-hidden rounded-full bg-paper-2">
            <motion.span
              className="block h-full rounded-full bg-ink"
              initial={{ width: 0 }}
              animate={{ width: `${(n / total) * 100}%` }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.9 }}
            />
          </span>
          <span className="text-right font-mono text-xs text-muted">{n}</span>
        </div>
      ))}
    </div>
  );
}

function ThemeRow({ theme, grid, rank, open, active, onToggle, onHover }: {
  theme: Theme;
  grid: string;
  rank: number;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  onHover: (h: boolean) => void;
}) {
  const color = elevationColor(theme.emotionalIntensity);
  return (
    <li onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} className={`transition-colors ${active || open ? "bg-card/70" : ""}`}>
      <button onClick={onToggle} className="grid w-full grid-cols-[44px_1fr_auto] items-baseline gap-4 px-4 py-5 text-left md:grid-cols-[44px_1.6fr_1fr_90px_90px_28px]">
        <span className="font-mono text-xs text-muted">{grid}</span>
        <span>
          <span className="font-display text-2xl font-medium">{theme.name}</span>
          {rank === 0 && <span className="label ml-3 text-rust">Fix first</span>}
        </span>
        <span className="hidden italic text-muted md:block">{theme.segment}</span>
        <span className="text-right font-display text-2xl tabular-nums" style={{ color }}>
          {theme.emotionalIntensity}
        </span>
        <span className="hidden text-right font-display text-2xl tabular-nums md:block">{theme.recurrence}%</span>
        <span className={`hidden text-right font-display text-2xl text-muted transition-transform duration-300 md:block ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 px-4 pb-8 md:grid-cols-2 md:pl-[76px]">
              <div>
                <p className="leading-relaxed">{theme.description}</p>
                <p className="label mt-6 text-muted">
                  {theme.signalCount} signals · {theme.segmentImpact} impact on {theme.segment.toLowerCase()}
                </p>
                <div className="mt-6 border-l-2 border-rust pl-4">
                  <p className="label text-rust">Recommendation</p>
                  <p className="mt-1 font-display text-xl leading-snug">{theme.recommendation}</p>
                </div>
              </div>
              <div>
                <p className="label mb-3 text-muted">What users said</p>
                <div className="space-y-4">
                  {theme.quotes.map((q, i) => (
                    <figure key={i}>
                      <blockquote className="font-display text-xl italic leading-snug">“{q.text}”</blockquote>
                      <figcaption className="mt-1 text-sm text-muted">
                        — {sourceLabel[q.source]}
                        {q.url && (
                          <>
                            ,{" "}
                            <a href={q.url} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-2 hover:text-ink">
                              see original
                            </a>
                          </>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function ReportView({ report, isSample }: { report: Report; isSample: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  const [hover, setHover] = useState<number | null>(null);
  const terrainThemes = useMemo(
    () => report.themes.map((t) => ({ name: t.name, intensity: t.emotionalIntensity, count: t.signalCount })),
    [report.themes],
  );
  const grids = useMemo(() => layoutPeaks(terrainThemes).map((p) => p.grid), [terrainThemes]);
  const analyzedOn = new Date(report.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-12">
          {!isSample && <p className="label mb-3 text-muted">Feedback report</p>}
          <h1 className="font-display text-6xl font-medium leading-none sm:text-8xl">{report.product}</h1>
          <p className="mt-4 font-display text-xl italic text-muted">
            Analyzed {analyzedOn} · {report.totalSignals.toLocaleString()} signals · {report.themes.length} themes
            <span className="no-print">
              {" · "}
              <button onClick={() => window.print()} className="italic underline decoration-rule underline-offset-4 transition hover:text-ink">
                save as PDF
              </button>
            </span>
          </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="plate flex items-center p-4 sm:p-6">
          <Terrain themes={terrainThemes} active={hover} onHover={setHover} />
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <p className="label mb-3 text-muted">Summary</p>
            <p className="font-display text-2xl leading-snug">{report.summary}</p>
          </div>
          <div>
            <Figure label="Negative signals" value={report.negativeRate} suffix="%" />
            <Figure label="Top intensity" value={Math.max(0, ...report.themes.map((t) => t.emotionalIntensity))} />
            <Figure label="Signals analyzed" value={report.totalSignals} />
          </div>
          <div>
            <p className="label mb-3 text-muted">Sources</p>
            <SourceKey counts={report.sourceCounts} />
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-2 flex items-baseline justify-between border-b border-rust/30 pb-3">
          <h2 className="font-display text-4xl font-medium">Themes</h2>
          <p className="font-display italic text-muted">Ranked by severity · hover to find each on the map</p>
        </div>
        <div className="label hidden grid-cols-[44px_1.6fr_1fr_90px_90px_28px] gap-4 px-4 py-3 text-muted md:grid">
          <span>Map</span>
          <span>Theme</span>
          <span>User segment</span>
          <span className="text-right">Intensity</span>
          <span className="text-right">Recurrence</span>
          <span />
        </div>
        <ul className="divide-y divide-rust/20 border-y border-rust/20">
          {report.themes.map((t, i) => (
            <ThemeRow
              key={t.name}
              theme={t}
              grid={grids[i] ?? "—"}
              rank={i}
              open={open === i}
              active={hover === i}
              onToggle={() => setOpen(open === i ? null : i)}
              onHover={(h) => setHover(h ? i : null)}
            />
          ))}
        </ul>
      </section>

      {report.competitors.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-baseline justify-between border-b border-rust/30 pb-3">
            <h2 className="font-display text-4xl font-medium">Competitors</h2>
            <p className="font-display italic text-muted">What their users say</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {report.competitors.map((c) => (
              <div key={c.name} className="plate p-6 sm:p-8">
                <div className="mb-5 flex items-baseline justify-between">
                  <h3 className="font-display text-3xl font-medium">{c.name}</h3>
                  <span className="label text-muted">{c.signalCount} signals</span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="label mb-2 text-moss">Users like</p>
                    <ul className="space-y-1.5">
                      {c.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label mb-2 text-rust">Users dislike</p>
                    <ul className="space-y-1.5">
                      {c.weaknesses.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
