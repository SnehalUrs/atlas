"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import { GRID_COLS, MAP_H, MAP_W, type Peak, type PeakInput, elevationColor, layoutPeaks } from "@/lib/terrain";

const START: [number, number] = [34, 378];

/** Split a long place name into at most two balanced lines. */
function wrapLabel(name: string, max = 20): string[] {
  if (name.length <= max) return [name];
  const words = name.split(" ");
  let best = [name];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      best = [a, b];
      bestDiff = diff;
    }
  }
  return best;
}

function routeTo(p: Peak): string {
  const [sx, sy] = START;
  return `M${sx},${sy} C${sx + 90},${sy - 10} ${p.x - 150},${p.y + 120} ${p.x},${p.y + 4}`;
}

export function Compass({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="var(--ink)" fill="none" strokeWidth={0.8}>
      <circle r={size} strokeOpacity={0.6} />
      <circle r={size * 0.72} strokeOpacity={0.25} />
      <path d={`M0 ${-size * 1.25} L${size * 0.18} 0 L0 ${size * 1.25} L${-size * 0.18} 0 Z`} fill="var(--ink)" fillOpacity={0.12} />
      <path d={`M0 ${-size * 1.25} L${size * 0.18} 0 L${-size * 0.18} 0 Z`} fill="var(--rust)" stroke="none" />
      <path d={`M${-size * 1.25} 0 L0 ${size * 0.14} L${size * 1.25} 0 L0 ${-size * 0.14} Z`} fill="var(--ink)" fillOpacity={0.12} />
      <text y={-size * 1.45} textAnchor="middle" className="fill-ink font-label text-[9px] tracking-[0.2em]" stroke="none">
        N
      </text>
    </g>
  );
}

/**
 * A topographic plate. Peaks are themes; `active` highlights one (hover sync with the gazetteer).
 * `overlay` draws extra layers (e.g. live signal pings) on top, given the laid-out peaks.
 */
export function Terrain({
  themes,
  active = null,
  onHover,
  showRoute = true,
  overlay,
  compact = false,
}: {
  themes: PeakInput[];
  active?: number | null;
  onHover?: (i: number | null) => void;
  showRoute?: boolean;
  overlay?: (peaks: Peak[]) => React.ReactNode;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const peaks = useMemo(() => layoutPeaks(themes), [themes]);
  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { pathLength: { delay, duration: 1.4, ease: [0.4, 0, 0.2, 1] as const }, opacity: { delay, duration: 0.2 } },
        };

  return (
    <svg viewBox={`-28 -26 ${MAP_W + 56} ${MAP_H + 54}`} className="h-auto w-full" role="img" aria-label="Topographic map of friction themes">
      {/* Grid references around the frame */}
      {GRID_COLS.map((c, i) => (
        <text key={c} x={(i + 0.5) * (MAP_W / 6)} y={-10} textAnchor="middle" className="fill-muted font-label text-[10px] tracking-[0.2em]">
          {c}
        </text>
      ))}
      {[1, 2, 3, 4].map((r) => (
        <text key={r} x={-14} y={(r - 0.5) * (MAP_H / 4) + 3} textAnchor="middle" className="fill-muted font-label text-[10px]">
          {r}
        </text>
      ))}
      <rect x={0} y={0} width={MAP_W} height={MAP_H} rx={10} fill="none" stroke="var(--rule)" strokeWidth={1} />
      <g stroke="var(--rule-soft)" strokeWidth={0.6}>
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={(i * MAP_W) / 6} y1={0} x2={(i * MAP_W) / 6} y2={MAP_H} />
        ))}
        {[1, 2, 3].map((i) => (
          <line key={`h${i}`} x1={0} y1={(i * MAP_H) / 4} x2={MAP_W} y2={(i * MAP_H) / 4} />
        ))}
      </g>

      {/* Contours, widest peaks first so summits sit on top */}
      {peaks
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p.radius - a.p.radius)
        .map(({ p, i }) => {
          const color = elevationColor(p.intensity);
          const dim = active !== null && active !== i;
          return (
            <g
              key={p.name}
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              style={{ opacity: dim ? 0.3 : 1, transition: "opacity 300ms" }}
              className={onHover ? "cursor-pointer" : undefined}
            >
              {p.rings.map((d, k) => (
                <motion.path
                  key={k}
                  d={d}
                  fill={k === p.rings.length - 1 ? color : "none"}
                  fillOpacity={k === p.rings.length - 1 ? 0.18 : 0}
                  stroke={color}
                  strokeOpacity={0.3 + (k / p.rings.length) * 0.6}
                  strokeWidth={k % 4 === 0 ? 1.3 : 0.7}
                  {...draw(0.2 + i * 0.18 + k * 0.06)}
                />
              ))}
            </g>
          );
        })}

      {showRoute && peaks[0] && (
        <g>
          {/* Wipe the dashed route in from the left; pathLength would override the dash pattern. */}
          <clipPath id={`${uid}-route`}>
            <motion.rect
              x={0}
              y={0}
              height={MAP_H}
              initial={{ width: reduce ? MAP_W : 0 }}
              animate={{ width: MAP_W }}
              transition={{ delay: 1.4, duration: 1.6, ease: "easeInOut" }}
            />
          </clipPath>
          <path d={routeTo(peaks[0])} fill="none" stroke="var(--rust)" strokeWidth={1.6} strokeDasharray="5 4" clipPath={`url(#${uid}-route)`} />
          <circle cx={START[0]} cy={START[1]} r={4} fill="var(--card)" stroke="var(--ink)" strokeWidth={1.2} />
          <text x={START[0] + 9} y={START[1] + 4} className="fill-ink font-serif text-[11px] italic">
            Start here
          </text>
        </g>
      )}

      {/* Summits and place names */}
      {peaks.map((p, i) => {
        const color = elevationColor(p.intensity);
        const dim = active !== null && active !== i;
        const lines = wrapLabel(p.name.toUpperCase());
        // Keep the widest line inside the frame (~7.2 units per tracked capital at this size).
        const half = (Math.max(...lines.map((l) => l.length)) * 7.2) / 2 + 6;
        const lx = Math.min(MAP_W - half, Math.max(half, p.x));
        return (
          <motion.g
            key={p.name}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: dim ? 0.35 : 1 }}
            transition={{ delay: reduce ? 0 : 0.8 + i * 0.18, duration: 0.5 }}
            className="pointer-events-none"
          >
            <path d={`M${p.x},${p.y - 6} L${p.x + 5},${p.y + 3} L${p.x - 5},${p.y + 3} Z`} fill="var(--ink)" />
            <text x={lx} y={p.y + 20} textAnchor="middle" className="fill-ink font-label text-[11px] font-semibold tracking-[0.18em]">
              {lines.map((l, k) => (
                <tspan key={k} x={lx} dy={k === 0 ? 0 : 13}>
                  {l}
                </tspan>
              ))}
            </text>
            {!compact && (
              <text x={lx} y={p.y + 33 + (lines.length - 1) * 13} textAnchor="middle" className="font-serif text-[10.5px] italic" style={{ fill: color }}>
                intensity {p.intensity} · {p.count.toLocaleString()} signals
              </text>
            )}
            {i === 0 && showRoute && (
              <text x={p.x} y={p.y - 14} textAnchor="middle" className="font-label text-[10px] font-semibold tracking-[0.2em]" style={{ fill: "var(--rust)" }}>
                FIX FIRST
              </text>
            )}
          </motion.g>
        );
      })}

      {overlay?.(peaks)}

      <Compass x={MAP_W - 34} y={44} />
      {/* Scale bar */}
      <g transform={`translate(${MAP_W - 150} ${MAP_H - 22})`}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 30} y={0} width={30} height={4} fill={i % 2 ? "var(--card)" : "var(--ink)"} stroke="var(--ink)" strokeWidth={0.6} />
        ))}
        <text x={0} y={15} className="fill-muted font-label text-[8.5px] tracking-[0.15em]">
          0
        </text>
        <text x={120} y={15} textAnchor="end" className="fill-muted font-label text-[8.5px] tracking-[0.15em]">
          100 SIGNALS
        </text>
      </g>
    </svg>
  );
}
