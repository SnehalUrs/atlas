"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sampleReport, sampleSignals, sourceLabel } from "@/lib/sample";
import { Terrain } from "./Terrain";

const themes = sampleReport.themes.map((t) => ({ name: t.name, intensity: t.emotionalIntensity, count: t.signalCount }));

interface Ping {
  id: number;
  theme: number;
  dx: number;
  dy: number;
}

/** The hero plate: a survey in progress, with new signals landing on the terrain. */
export function HeroMap() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [pings, setPings] = useState<Ping[]>([]);
  const counter = useRef(0);
  const total = useMemo(() => sampleReport.totalSignals + tick, [tick]);
  const latest = sampleSignals[tick % sampleSignals.length];

  useEffect(() => {
    if (reduce) return;
    let id: ReturnType<typeof setInterval> | undefined;
    // Wait for the map to finish drawing before signals start landing.
    const start = setTimeout(() => {
      id = setInterval(() => {
        counter.current += 1;
        const next = counter.current;
        const s = sampleSignals[next % sampleSignals.length];
        const a = Math.random() * Math.PI * 2;
        const d = 8 + Math.random() * 26;
        setTick(next);
        setPings((p) => [...p.slice(-5), { id: next, theme: s.theme, dx: Math.cos(a) * d * 1.2, dy: Math.sin(a) * d * 0.8 }]);
      }, 1600);
    }, 2600);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [reduce]);

  return (
    <div className="plate p-5 sm:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-semibold leading-tight">{sampleReport.product}</p>
        </div>
        <div className="text-right">
          <p className="label flex items-center justify-end gap-2 text-rust">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rust opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rust" />
            </span>
            Analyzing
          </p>
          <p className="font-display text-lg tabular-nums">{total.toLocaleString()} signals</p>
        </div>
      </div>

      <Terrain
        themes={themes}
        overlay={(peaks) =>
          pings.map((p) => {
            const peak = peaks[p.theme];
            if (!peak) return null;
            const x = peak.x + p.dx;
            const y = peak.y + p.dy;
            return (
              <g key={p.id}>
                <motion.circle
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke="var(--rust)"
                  strokeWidth={1}
                  initial={{ r: 2, opacity: 0.9 }}
                  animate={{ r: 16, opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                />
                <motion.path
                  d={`M${x - 3},${y - 3} L${x + 3},${y + 3} M${x + 3},${y - 3} L${x - 3},${y + 3}`}
                  stroke="var(--ink)"
                  strokeWidth={1.1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.75 }}
                />
              </g>
            );
          })
        }
      />

      <div className="mt-3 flex h-11 items-center gap-3 pt-3">
        <span className="label shrink-0 text-muted">New signal</span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={tick}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="truncate text-sm"
            >
              <span className="italic">“{latest.text}”</span>
              <span className="text-muted">
                {" "}— {sourceLabel[latest.source]} →{" "}
                <span className="text-rust">{sampleReport.themes[latest.theme].name}</span>
              </span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
