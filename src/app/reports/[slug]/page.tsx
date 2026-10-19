import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Nav } from "@/components/chrome";
import { ReportView } from "@/components/ReportView";
import { brand } from "@/lib/brand";
import { getLibrary, getReport } from "@/lib/library";

export function generateStaticParams() {
  return getLibrary().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const report = getReport((await params).slug);
  return { title: report ? `${report.product} feedback report — ${brand.name}` : brand.name };
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const report = getReport((await params).slug);
  if (!report) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8 sm:pt-32">
        <Link href="/reports" className="label no-print mb-8 inline-block text-muted transition hover:text-ink">
          ← All reports
        </Link>
        <ReportView report={report} isSample={false} />
      </main>
      <Footer />
    </>
  );
}
