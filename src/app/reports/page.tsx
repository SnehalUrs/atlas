import { Footer, Nav } from "@/components/chrome";
import { Library, type LibraryCard } from "@/components/Library";
import { brand } from "@/lib/brand";
import { getLibrary } from "@/lib/library";

export const metadata = { title: `Reports — ${brand.name}` };

export default function ReportsPage() {
  const cards: LibraryCard[] = getLibrary().map((r) => ({
    slug: r.slug,
    product: r.product,
    category: r.category,
    totalSignals: r.totalSignals,
    negativeRate: r.negativeRate,
    topTheme: r.themes[0]?.name ?? "—",
    topIntensity: r.themes[0]?.emotionalIntensity ?? 0,
    peaks: r.themes.map((t) => ({ name: t.name, intensity: t.emotionalIntensity, count: t.signalCount })),
  }));

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[80vh] max-w-7xl px-4 pb-24 pt-28 sm:px-8 sm:pt-36">
        <p className="label mb-4 text-muted">Report library</p>
        <h1 className="max-w-3xl font-display text-6xl font-medium leading-[0.95] sm:text-7xl">
          {cards.length} products, <em className="text-rust">mapped from real feedback.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Each report was built from public posts, reviews and comments on Reddit, the App Store and Hacker News, grouped into
          themes and ranked by how much they hurt users.
        </p>
        <div className="mt-14">
          <Library cards={cards} />
        </div>
      </main>
      <Footer />
    </>
  );
}
