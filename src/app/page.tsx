import Link from "next/link";
import { Footer, Nav } from "@/components/chrome";
import { HeroMap } from "@/components/HeroMap";
import { Reveal } from "@/components/motion";
import { Teams, Problems, KeyFigures, Metrics, Method, SectionHead, Spread, SurveyInput } from "@/components/sections";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:pt-36">
          <Reveal>
            <p className="label mb-8 flex items-center gap-3 text-muted">
              <span className="h-px w-10 bg-ink" />Product intelligence from real user feedback
            </p>
            <h1 className="font-display text-[56px] font-medium leading-[0.95] tracking-[-0.01em] sm:text-7xl lg:text-[96px]">
              Find your way to <em className="font-normal text-rust">what users want.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {brand.name} reads what people say about any product on Reddit, the App Store and Hacker News, groups it into themes
              and ranks them by how much they hurt. Each theme is a peak on the map: the higher it is, the sooner you should fix it.
            </p>
            <div className="mt-10">
              <SurveyInput id="survey-hero" />
              <Link href="/experience?sample=1" className="mt-5 inline-block font-display text-lg italic text-muted underline decoration-rule underline-offset-4 transition hover:text-ink">
                or view a sample report →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <HeroMap />
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
          <KeyFigures />
        </section>

        <section id="problem" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
          <SectionHead n="I." kicker="The problem">
            Feedback is everywhere. <em className="text-rust">Priorities aren&apos;t.</em>
          </SectionHead>
          <Problems />
        </section>

        <section id="method" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
          <SectionHead n="II." kicker="How it works">
            From raw feedback to <em className="text-rust">ranked priorities.</em>
          </SectionHead>
          <Method />
        </section>

        <section id="metrics" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
          <SectionHead n="III." kicker="The metrics">
            Four metrics behind <em className="text-rust">every ranking.</em>
          </SectionHead>
          <Metrics />
        </section>

        <section id="teams" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
          <SectionHead n="IV." kicker="Who it&apos;s for">
            Built for the people who <em className="text-rust">decide what&apos;s next.</em>
          </SectionHead>
          <Teams />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <SectionHead n="V." kicker="Before and after">
            Stop tagging spreadsheets. <em className="text-rust">Start deciding.</em>
          </SectionHead>
          <Spread />
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-32 pt-16 text-center sm:px-8">
          <Reveal>
            <p className="label mb-6 text-muted">Try it</p>
            <h2 className="font-display text-5xl font-medium leading-[1] sm:text-7xl">
              See what users really think. <em className="text-rust">Analyze any product.</em>
            </h2>
            <div className="mt-12">
              <SurveyInput id="survey-cta" center />
            </div>
          </Reveal>
        </section>

      </main>
      <Footer />
    </>
  );
}
