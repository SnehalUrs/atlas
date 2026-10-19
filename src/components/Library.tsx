"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { MAP_H, MAP_W, elevationColor, layoutPeaks } from "@/lib/terrain";

export interface LibraryCard {
  slug: string;
  product: string;
  category: string;
  totalSignals: number;
  negativeRate: number;
  topTheme: string;
  topIntensity: number;
  peaks: { name: string; intensity: number; count: number }[];
}

/** Static thumbnail of a report's terrain: same shapes as the full map, no labels or animation. */
export function MiniTerrain({ peaks }: { peaks: LibraryCard["peaks"] }) {
  const laid = useMemo(() => layoutPeaks(peaks), [peaks]);
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-auto w-full" aria-hidden>
      {laid.map((p) =>
        p.rings.map((d, k) => (
          <path
            key={`${p.name}-${k}`}
            d={d}
            fill={k === p.rings.length - 1 ? elevationColor(p.intensity) : "none"}
            fillOpacity={k === p.rings.length - 1 ? 0.2 : 0}
            stroke={elevationColor(p.intensity)}
            strokeOpacity={0.3 + (k / p.rings.length) * 0.6}
            strokeWidth={k % 4 === 0 ? 2.2 : 1.2}
          />
        )),
      )}
    </svg>
  );
}

export function Library({ cards }: { cards: LibraryCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(cards.map((c) => c.category))).sort()], [cards]);
  const shown = cards.filter(
    (c) => (category === "All" || c.category === category) && c.product.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="plate flex w-full max-w-md items-center gap-3 rounded-full! px-6 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent font-display text-xl italic outline-none placeholder:text-faint"
          />
          <span className="label text-muted">{shown.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`label rounded-full px-4 py-2 transition ${category === c ? "bg-ink text-paper" : "text-muted hover:bg-card hover:text-ink"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-center font-display text-2xl italic text-muted">No reports match “{query}” yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c, i) => (
            <motion.div key={c.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
              <Link href={`/reports/${c.slug}`} className="plate group block p-5 transition duration-300 hover:-translate-y-1">
                <div className="overflow-hidden rounded-2xl bg-paper/60 p-3">
                  <MiniTerrain peaks={c.peaks} />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-3xl font-medium">{c.product}</h3>
                  <span className="label text-muted">{c.category}</span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Top issue: <span className="text-ink">{c.topTheme}</span>{" "}
                  <span style={{ color: elevationColor(c.topIntensity) }}>({c.topIntensity})</span>
                </p>
                <p className="label mt-3 text-faint">
                  {c.totalSignals} signals · {c.negativeRate}% negative
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
