import { Suspense } from "react";
import { Footer, Nav } from "@/components/chrome";
import { Experience } from "@/components/Experience";
import { brand } from "@/lib/brand";
import { liveAnalysisEnabled } from "@/lib/library";

export const metadata = { title: `Run analysis — ${brand.name}` };

export default function ExperiencePage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-[80vh]">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8 sm:pt-32">
          <Suspense>
            <Experience live={liveAnalysisEnabled()} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
