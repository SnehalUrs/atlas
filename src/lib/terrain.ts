/*
 * Turns ranked themes into map terrain. Each theme is a peak: more emotional
 * intensity means more contour rings (a taller peak), more signals means a
 * wider base. Shapes are seeded from the theme name so a report always
 * draws the same map.
 */

export const MAP_W = 600;
export const MAP_H = 400;
const COLS = "ABCDEF";

export interface PeakInput {
  name: string;
  intensity: number;
  count: number;
}

export interface Peak extends PeakInput {
  x: number;
  y: number;
  radius: number;
  rings: string[];
  grid: string;
}

// Where peaks settle, most severe first: a loose, natural-looking arrangement.
const SLOTS: [number, number][] = [
  [400, 165],
  [185, 250],
  [470, 315],
  [215, 95],
  [95, 150],
  [320, 330],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

function contours(cx: number, cy: number, radius: number, ringCount: number, seed: number): string[] {
  const rand = rng(seed);
  const phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const amps = [0.09 + rand() * 0.06, 0.05 + rand() * 0.04, 0.03 + rand() * 0.03];
  const drift = rand() * 6.28;
  const rings: string[] = [];
  for (let k = 0; k < ringCount; k++) {
    const scale = 1 - (k / Math.max(1, ringCount - 1)) * 0.86;
    // Inner rings drift slightly off-centre, like a real summit.
    const ox = cx + Math.cos(drift) * radius * 0.06 * k * 0.4;
    const oy = cy + Math.sin(drift) * radius * 0.05 * k * 0.4;
    const pts: [number, number][] = [];
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      const wobble = 1 + amps[0] * Math.sin(3 * t + phases[0]) + amps[1] * Math.sin(5 * t + phases[1] + k * 0.3) + amps[2] * Math.sin(2 * t + phases[2]);
      const r = radius * scale * wobble;
      pts.push([ox + Math.cos(t) * r * 1.15, oy + Math.sin(t) * r * 0.82]);
    }
    rings.push(smoothClosed(pts));
  }
  return rings;
}

export function gridRef(x: number, y: number): string {
  const col = COLS[Math.min(COLS.length - 1, Math.max(0, Math.floor(x / (MAP_W / COLS.length))))];
  const row = Math.min(4, Math.max(1, Math.floor(y / (MAP_H / 4)) + 1));
  return `${col}${row}`;
}

export function layoutPeaks(themes: PeakInput[]): Peak[] {
  const maxCount = Math.max(1, ...themes.map((t) => t.count));
  return themes.slice(0, SLOTS.length).map((t, i) => {
    const [x, y] = SLOTS[i];
    const radius = 34 + 58 * Math.sqrt(t.count / maxCount);
    const ringCount = Math.max(3, Math.round(t.intensity / 11));
    return { ...t, x, y, radius, rings: contours(x, y, radius, ringCount, hash(t.name)), grid: gridRef(x, y) };
  });
}

export const GRID_COLS = COLS.split("");

export function elevationColor(v: number): string {
  if (v >= 70) return "var(--rust)";
  if (v >= 50) return "var(--ochre)";
  return "var(--moss)";
}
