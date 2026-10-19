import Link from "next/link";
import type { LibraryReport } from "@/lib/types";
import { MiniTerrain } from "./Library";
import { Reveal } from "./motion";
import { SectionHead } from "./sections";

// Well-known names first, so the preview is instantly recognisable.
const FEATURED = ["duolingo", "spotify", "notion", "uber", "instagram", "chatgpt"];

/** A strip of real reports on the landing page, linking into the library. */
export function LibraryPreview({ reports }: { reports: LibraryReport[] }) {
  if (reports.length === 0) return null;
  const featured = [...reports].sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
      <SectionHead n="★" kicker="The library">
        {reports.length} products, <em className="text-rust">already mapped.</em>
      </SectionHead>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((r, i) => (
          <Reveal key={r.slug} delay={i * 0.06}>
            <Link href={`/reports/${r.slug}`} className="plate group block p-5 transition duration-300 hover:-translate-y-1">
              <div className="overflow-hidden rounded-2xl bg-paper/60 p-3">
                <MiniTerrain peaks={r.themes.map((t) => ({ name: t.name, intensity: t.emotionalIntensity, count: t.signalCount }))} />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-3xl font-medium">{r.product}</h3>
                <span className="label text-muted">{r.category}</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                Top issue: <span className="text-ink">{r.themes[0]?.name}</span>
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10 text-center">
        <Link href="/reports" className="label inline-block rounded-full bg-ink px-7 py-4 text-paper transition hover:bg-rust">
          Browse all {reports.length} reports →
        </Link>
      </Reveal>
    </section>
  );
}

function rank(slug: string) {
  const i = FEATURED.indexOf(slug);
  return i === -1 ? FEATURED.length : i;
}
