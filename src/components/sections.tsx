"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/lib/brand";
import { CountUp, Reveal } from "./motion";

export function SectionHead({ n, kicker, children }: { n: string; kicker: string; children: React.ReactNode }) {
  return (
    <Reveal className="mb-16 grid gap-4 border-t border-rust/30 pt-10 md:grid-cols-[120px_1fr]">
      <p className="font-display text-6xl font-medium leading-none text-rust">{n}</p>
      <div>
        <p className="label mb-3 text-muted">{kicker}</p>
        <h2 className="max-w-3xl font-display text-4xl font-medium leading-[1.05] text-balance sm:text-6xl">{children}</h2>
      </div>
    </Reveal>
  );
}

/* ---------- Key figures, set like a map key ---------- */

const figures = [
  { value: 300, suffix: "+", label: "Signals per analysis" },
  { value: 3, suffix: "", label: "Public sources" },
  { value: 4, suffix: "", label: "Measures per theme" },
  { value: 5, suffix: "", label: "Minutes to a full report", prefix: "<" },
];

export function KeyFigures() {
  return (
    <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
      {figures.map((f, i) => (
        <Reveal
          key={f.label}
          delay={i * 0.08}
          className="px-1"
        >
          <p className="font-display text-5xl font-medium leading-none sm:text-6xl">
            {f.prefix}
            <CountUp value={f.value} />
            <span className="text-rust">{f.suffix}</span>
          </p>
          <p className="label mt-3 text-muted">{f.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Problems: why feedback goes unread ---------- */

function Archipelago() {
  const dots = [[14, 30], [30, 18], [46, 34], [62, 14], [74, 40], [24, 46], [56, 50], [86, 24]];
  return (
    <svg viewBox="0 0 100 60" className="h-16 w-28" aria-hidden>
      {dots.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={4 + (i % 3) * 2} ry={3 + (i % 2) * 1.5} fill="none" stroke="var(--ink)" strokeWidth={0.9} />
      ))}
    </svg>
  );
}
function Marsh() {
  return (
    <svg viewBox="0 0 100 60" className="h-16 w-28" stroke="var(--ink)" strokeWidth={0.9} fill="none" aria-hidden>
      {[[15, 20], [45, 16], [75, 22], [28, 40], [60, 42], [88, 44]].map(([x, y], i) => (
        <g key={i}>
          <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
          <line x1={x - 3} y1={y} x2={x - 5} y2={y - 6} />
          <line x1={x} y1={y} x2={x} y2={y - 8} />
          <line x1={x + 3} y1={y} x2={x + 5} y2={y - 6} />
        </g>
      ))}
    </svg>
  );
}
function Fog() {
  return (
    <svg viewBox="0 0 100 60" className="h-16 w-28" stroke="var(--ink)" strokeWidth={0.9} fill="none" aria-hidden>
      <path d="M8 18 C 20 8, 32 28, 46 18 S 72 8, 92 18" />
      <path d="M4 32 C 18 22, 30 42, 46 32 S 74 22, 96 32" strokeDasharray="3 3" />
      <path d="M10 46 C 24 36, 36 56, 52 46 S 78 36, 90 46" />
    </svg>
  );
}

const problems = [
  { symbol: Archipelago, title: "Scattered", body: "Complaints live across subreddits, app reviews and comment threads. Nobody reads them end to end." },
  { symbol: Marsh, title: "Unweighted", body: "A furious churn threat and a mild nitpick land in the same spreadsheet row, with the same weight." },
  { symbol: Fog, title: "Opinion-led", body: "Without a sense of severity, the roadmap drifts toward whoever argues loudest in the meeting." },
];

export function Problems() {
  return (
    <div className="grid gap-12 md:grid-cols-3 md:gap-14">
      {problems.map((h, i) => (
        <Reveal key={h.title} delay={i * 0.1} className="">
          <h.symbol />
          <h3 className="mt-6 font-display text-3xl font-medium">{h.title}</h3>
          <p className="mt-3 leading-relaxed text-muted">{h.body}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Method: three steps joined by a route ---------- */

const steps = [
  { n: "1", title: "Collect", body: "Posts and comments from Reddit, recent App Store reviews and Hacker News threads, for your product and up to three competitors." },
  { n: "2", title: "Group", body: "AI groups every piece of feedback by meaning, not keywords, so “lost my notes offline” and “sync ate my edits” land in the same theme." },
  { n: "3", title: "Score", body: "Each theme is scored by emotional intensity, how often it comes up and which users it affects, then ranked so you know what to fix first." },
];

export function Method() {
  return (
    <div>
      <svg viewBox="0 0 1000 80" className="hidden h-20 w-full md:block" preserveAspectRatio="none" aria-hidden>
        {/* Wipe the dashed route in from the left; pathLength would override the dash pattern. */}
        <clipPath id="method-route">
          <motion.rect
            x={0}
            y={0}
            height={80}
            initial={{ width: 0 }}
            whileInView={{ width: 1000 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </clipPath>
        <path
          d="M60 50 C 220 0, 340 90, 500 40 S 800 0, 940 45"
          fill="none"
          stroke="var(--rust)"
          strokeWidth={1.6}
          strokeDasharray="7 6"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#method-route)"
        />
        {[
          [60, 50],
          [500, 40],
          [940, 45],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={6} fill="var(--card)" stroke="var(--ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="grid gap-10 md:grid-cols-3 md:gap-12">
        {steps.map((w, i) => (
          <Reveal key={w.n} delay={0.3 + i * 0.25}>
            <p className="label text-rust">Step {w.n}</p>
            <h3 className="mt-2 font-display text-4xl font-medium">{w.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{w.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------- Metrics: the four measures as map symbols ---------- */

const metrics = [
  {
    name: "Emotional intensity",
    measure: "Peak height on the map",
    body: "How strongly users feel about it. Anger, churn threats and “unusable” score high; mild suggestions score low.",
    symbol: (
      <svg viewBox="0 0 60 40" className="h-10 w-16" fill="none" stroke="var(--rust)" aria-hidden>
        {[18, 13, 8, 3].map((r, i) => (
          <ellipse key={r} cx="30" cy="20" rx={r * 1.4} ry={r} strokeWidth={i === 0 ? 1.3 : 0.8} strokeOpacity={0.4 + i * 0.2} />
        ))}
      </svg>
    ),
  },
  {
    name: "Negative signal rate",
    measure: "Across all feedback",
    body: "The share of all feedback that is a complaint or an unmet need.",
    symbol: (
      <svg viewBox="0 0 60 40" className="h-10 w-16" aria-hidden>
        <defs>
          <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="8" y="6" width="44" height="28" fill="url(#hatch)" stroke="var(--ink)" strokeWidth="0.8" />
      </svg>
    ),
  },
  {
    name: "Recurrence",
    measure: "Peak width on the map",
    body: "How many separate users mention a theme. One loud post won't move it; a real pattern will.",
    symbol: (
      <svg viewBox="0 0 60 40" className="h-10 w-16" fill="var(--ink)" aria-hidden>
        {[[14, 14], [24, 22], [30, 12], [38, 26], [44, 16], [20, 30], [50, 28]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="4" height="4" />
        ))}
      </svg>
    ),
  },
  {
    name: "Segment impact",
    measure: "Who feels it",
    body: "Which user group is affected, such as new users, power users or mobile, and how much that group matters.",
    symbol: (
      <svg viewBox="0 0 60 40" className="h-10 w-16" fill="none" stroke="var(--ink)" strokeWidth="1.1" aria-hidden>
        <path d="M6 30 C 16 8, 30 34, 40 12 S 54 20, 56 8" strokeDasharray="6 2 1 2" />
      </svg>
    ),
  },
];

export function Metrics() {
  return (
    <div>
      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {metrics.map((l, i) => (
          <Reveal key={l.name} delay={i * 0.08} className="grid grid-cols-[72px_1fr] gap-5">
            <div className="pt-1">{l.symbol}</div>
            <div>
              <p className="font-display text-2xl font-medium">
                {l.name} <span className="italic text-muted">— {l.measure.toLowerCase()}</span>
              </p>
              <p className="mt-2 leading-relaxed text-muted">{l.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------- Teams: who it's for ---------- */

function PeakFlag() {
  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12" fill="none" stroke="var(--rust)" strokeWidth={1.3} aria-hidden>
      <path d="M4 36 L20 14 L28 24 L34 18 L44 36 Z" strokeLinejoin="round" />
      <path d="M20 14 V3 L29 6 L20 9" fill="var(--rust)" fillOpacity={0.15} />
    </svg>
  );
}
function RisingRoute() {
  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12" fill="none" stroke="var(--rust)" strokeWidth={1.3} aria-hidden>
      <path d="M4 34 C 16 32, 22 22, 30 18 S 40 8, 44 6" strokeDasharray="4 3" />
      <path d="M37 5 L44 6 L42 13" />
      <circle cx="4" cy="34" r="2.5" fill="var(--paper)" />
    </svg>
  );
}
function SmallCompass() {
  return (
    <svg viewBox="-24 -20 48 40" className="h-10 w-12" fill="none" stroke="var(--rust)" strokeWidth={1.3} aria-hidden>
      <circle r="15" />
      <path d="M0 -12 L3.5 0 L0 12 L-3.5 0 Z" fill="var(--rust)" fillOpacity={0.15} />
      <path d="M0 -12 L3.5 0 L-3.5 0 Z" fill="var(--rust)" />
    </svg>
  );
}

const teams = [
  {
    icon: PeakFlag,
    who: "Product managers",
    line: "Walk into planning with evidence, not anecdotes.",
    points: ["Ranked themes for the next roadmap review", "Verbatim quotes that make the case for you", "One concrete fix per theme"],
  },
  {
    icon: RisingRoute,
    who: "Growth teams",
    line: "Find the leak before pouring in more traffic.",
    points: ["Where new users stall during onboarding", "Which segments are closest to churning", "How sentiment compares with three rivals"],
  },
  {
    icon: SmallCompass,
    who: "Founders",
    line: "Know what the market says about you, and them.",
    points: ["A read on product pain in minutes", "Competitor strengths and weak spots", "A report you can print and share"],
  },
];

export function Teams() {
  return (
    <div className="grid gap-14 md:grid-cols-3 md:gap-12">
      {teams.map((t, i) => (
        <Reveal key={t.who} delay={i * 0.1}>
          <t.icon />
          <p className="label mt-6 text-rust">{t.who}</p>
          <h3 className="mt-3 font-display text-[32px] font-medium leading-[1.1]">{t.line}</h3>
          <span className="mt-6 block h-px w-12 bg-rust/50" />
          <ul className="mt-6 space-y-3 text-[15px] text-muted">
            {t.points.map((p) => (
              <li key={p} className="flex gap-3 leading-snug">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-rust" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Before and after, row by row ---------- */

const contrasts = [
  { topic: "Coverage", before: "A few dozen tickets someone had time to read", after: "Hundreds of signals across three sources" },
  { topic: "Prioritization", before: "Gut feel and whoever spoke last", after: "Intensity × recurrence × segment impact" },
  { topic: "Speed", before: "Days of tagging in a spreadsheet", after: "A finished report in minutes" },
  { topic: "Evidence", before: "Anecdotes that are easy to dismiss", after: "Ranked themes backed by real quotes" },
];

export function Spread() {
  return (
    <div className="plate px-6 py-4 sm:px-10 sm:py-6">
      <div className="hidden grid-cols-[150px_1fr_48px_1fr] items-end gap-6 border-b border-rust/30 pb-5 pt-4 md:grid">
        <span />
        <p className="font-display text-2xl italic text-muted">Manual review</p>
        <span />
        <p className="font-display text-2xl font-semibold">With {brand.name}</p>
      </div>
      <ul className="divide-y divide-rust/15">
        {contrasts.map((c, i) => (
          <Reveal key={c.topic} delay={i * 0.08}>
            <li className="grid gap-2 py-6 md:grid-cols-[150px_1fr_48px_1fr] md:items-center md:gap-6">
              <span className="label text-muted">{c.topic}</span>
              <span className="text-muted">{c.before}</span>
              <span className="hidden text-center font-display text-2xl text-rust md:block">→</span>
              <span className="font-display text-2xl leading-snug">
                <span className="mr-2 text-rust md:hidden">→</span>
                {c.after}
              </span>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Ledger-style input ---------- */

export function SurveyInput({ id, center = false }: { id: string; center?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(value.trim() ? `/experience?product=${encodeURIComponent(value.trim())}` : "/experience");
      }}
      className={`w-full max-w-lg ${center ? "mx-auto text-left" : ""}`}
    >
      <label className="label mb-3 block pl-6 text-muted" htmlFor={id}>
        Analyze a product
      </label>
      <div className="plate flex items-center gap-3 rounded-full! py-2 pl-6 pr-2 transition focus-within:shadow-[0_0_0_3px_rgba(208,83,47,0.15),0_24px_60px_-30px_rgba(27,42,65,0.28)]">
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Duolingo"
          className="min-w-0 flex-1 bg-transparent font-display text-2xl italic outline-none placeholder:text-faint"
        />
        <button type="submit" className="label shrink-0 rounded-full bg-ink px-5 py-3 text-paper transition hover:bg-rust">
          Run analysis →
        </button>
      </div>
    </form>
  );
}
