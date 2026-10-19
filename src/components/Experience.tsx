"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { sampleReport } from "@/lib/sample";
import type { LibraryEntry, Report, StreamEvent } from "@/lib/types";
import { ReportView } from "./ReportView";

type Phase = "form" | "running" | "done" | "error";

const stages = ["Collecting feedback", "Checking competitors", "Grouping into themes", "Scoring severity"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * `live` is false on the hosted site (no AI available there): the form then looks products up
 * in the pre-generated report library instead of running an analysis.
 */
export function Experience({ live, library }: { live: boolean; library: LibraryEntry[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(params.get("product") ?? "");
  const [competitors, setCompetitors] = useState("");
  const [phase, setPhase] = useState<Phase>(params.get("sample") ? "done" : "form");
  const [report, setReport] = useState<Report | null>(params.get("sample") ? sampleReport : null);
  const [log, setLog] = useState<string[]>([]);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const started = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [logTimes, setLogTimes] = useState<number[]>([]);
  const [notFoundName, setNotFoundName] = useState("");
  const findInLibrary = useCallback((name: string) => library.find((e) => norm(e.product) === norm(name) || e.slug === norm(name)), [library]);
  const matches = product.trim() ? library.filter((e) => norm(e.product).includes(norm(product))).slice(0, 8) : [];
  const exact = findInLibrary(product);


  // Elapsed-time clock while an analysis runs.
  useEffect(() => {
    if (phase !== "running") return;
    const t0 = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const run = useCallback(async (name: string, comps: string) => {
    setPhase("running");
    setLog([]);
    setLogTimes([]);
    setStage(0);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: name, competitors: comps }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let seenMain = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "progress") {
            setLog((l) => [...l, event.message]);
            setLogTimes((t) => [...t, Date.now()]);
            if (event.message.startsWith("Clustering")) setStage(2);
            else if (event.message.startsWith("Collecting")) {
              setStage(seenMain ? 1 : 0);
              seenMain = true;
            }
          } else if (event.type === "report") {
            setStage(4);
            setReport(event.report);
            setPhase("done");
            return;
          } else {
            throw new Error(event.message);
          }
        }
      }
      throw new Error("The analysis ended without a report.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }, []);

  /** Open a saved report if we have one; otherwise analyze live, or explain why we can't. */
  const lookUpOrRun = useCallback(
    (name: string, comps: string) => {
      const hit = findInLibrary(name);
      if (!live) {
        if (hit) router.push(`/reports/${hit.slug}`);
        else {
          setNotFoundName(name);
          setPhase("form");
        }
        return;
      }
      run(name, comps);
    },
    [findInLibrary, live, router, run],
  );

  useEffect(() => {
    if (params.get("sample")) {
      setReport(sampleReport);
      setPhase("done");
    }
  }, [params]);

  // A product name passed from the landing page starts the analysis right away.
  useEffect(() => {
    const p = params.get("product");
    if (p && !started.current && !params.get("sample")) {
      started.current = true;
      lookUpOrRun(p, "");
    }
  }, [params, lookUpOrRun]);


  const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const t0 = logTimes[0] ?? 0;

  return (
    <AnimatePresence mode="wait">
      {phase === "done" && report ? (
        <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ReportView report={report} isSample={!!params.get("sample")} />
        </motion.div>
      ) : phase === "running" ? (
        <motion.div key="running" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-3xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="label mb-3 text-muted">Analysis in progress</p>
              <h1 className="font-display text-6xl font-medium leading-none">{product || params.get("product")}</h1>
            </div>
            <div className="text-right">
              <svg viewBox="-20 -20 40 40" className="ml-auto h-14 w-14" aria-hidden>
                <circle r="17" fill="none" stroke="var(--ink)" strokeWidth="1" />
                <motion.g animate={{ rotate: [0, 40, -25, 15, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                  <path d="M0 -14 L3.5 0 L-3.5 0 Z" fill="var(--rust)" />
                  <path d="M0 14 L3.5 0 L-3.5 0 Z" fill="var(--ink)" />
                </motion.g>
              </svg>
              <p className="mt-2 font-mono text-sm tabular-nums text-muted">{clock(elapsed)}</p>
            </div>
          </div>

          <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
            <ol className="space-y-5">
              {stages.map((s, i) => {
                const state = i < stage ? "done" : i === stage ? "active" : "pending";
                return (
                  <li key={s} className="flex items-baseline gap-4">
                    <span className={`font-display text-2xl ${state === "pending" ? "text-faint" : "text-rust"}`}>{["I", "II", "III", "IV"][i]}.</span>
                    <div>
                      <p className={`font-display text-2xl ${state === "pending" ? "text-faint" : ""} ${state === "done" ? "line-through decoration-rule" : ""}`}>{s}</p>
                      {state === "active" && (
                        <p className="mt-1 text-sm italic text-muted">{i === 2 ? "The longest step. Run locally, this takes a few minutes." : "In progress…"}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div>
              <p className="label mb-4 text-muted">Progress</p>
              <ul className="space-y-2 text-[15px]">
                <AnimatePresence initial={false}>
                  {log.map((l, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[52px_1fr] gap-2">
                      <span className="font-mono text-xs leading-6 text-muted">{clock(Math.max(0, Math.round((logTimes[i] - t0) / 1000)))}</span>
                      <span>{l}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl">
          <p className="label mb-4 text-muted">{live ? "New analysis" : "Report library"}</p>
          <h1 className="font-display text-6xl font-medium leading-[0.95] sm:text-7xl">
            Which product should we <em className="text-rust">{live ? "analyze?" : "look up?"}</em>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            {live
              ? "We'll collect public feedback from Reddit, the App Store and Hacker News, then rank what hurts users most."
              : `Choose from ${library.length} products already analyzed from real Reddit, App Store and Hacker News feedback.`}
          </p>

          {phase === "error" && (
            <div className="mt-8 rounded-2xl bg-card px-6 py-4">
              <p className="label text-rust">The analysis didn&apos;t finish</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          {notFoundName && !live && (
            <div className="mt-8 rounded-2xl bg-card px-6 py-4">
              <p className="label text-rust">Not in the library yet</p>
              <p className="mt-1">
                There&apos;s no report for “{notFoundName}” yet. New products are analyzed with the local version of Atlas; try one of
                the products below.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (product.trim()) lookUpOrRun(product.trim(), competitors);
            }}
            className="mt-12 space-y-10"
          >
            <label className="block">
              <span className="label mb-2 block text-muted">Product</span>
              <input
                value={product}
                onChange={(e) => {
                  setProduct(e.target.value);
                  setNotFoundName("");
                }}
                required
                autoFocus
                placeholder="Duolingo"
                className="ledger-input w-full bg-transparent pb-2 font-display text-4xl italic outline-none placeholder:text-faint"
              />
            </label>

            {(matches.length > 0 || !live) && (
              <div>
                <p className="label mb-3 text-muted">{matches.length > 0 ? "Saved reports" : "Popular reports"}</p>
                <div className="flex flex-wrap gap-2">
                  {(matches.length > 0 ? matches : library.slice(0, 12)).map((e) => (
                    <button
                      key={e.slug}
                      type="button"
                      onClick={() => router.push(`/reports/${e.slug}`)}
                      className="rounded-full bg-card px-4 py-2 font-display text-lg transition hover:bg-ink hover:text-paper"
                    >
                      {e.product}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {live && (
              <label className="block">
                <span className="label mb-2 flex justify-between text-muted">
                  Competitors <span className="normal-case tracking-normal">optional, up to three, comma-separated</span>
                </span>
                <input
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="Babbel, Busuu"
                  className="ledger-input w-full bg-transparent pb-2 font-display text-2xl italic outline-none placeholder:text-faint"
                />
              </label>
            )}
            <div className="flex flex-wrap items-center gap-6">
              <button type="submit" className="label rounded-full bg-ink px-7 py-4 text-paper transition hover:bg-rust">
                {live ? "Run analysis →" : "Open report →"}
              </button>
              {live && exact && (
                <button type="button" onClick={() => router.push(`/reports/${exact.slug}`)} className="font-display text-lg italic text-muted underline decoration-rule underline-offset-4 hover:text-ink">
                  or open the saved {exact.product} report
                </button>
              )}
              <button type="button" onClick={() => router.push("/reports")} className="font-display text-lg italic text-muted underline decoration-rule underline-offset-4 hover:text-ink">
                browse all reports
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
