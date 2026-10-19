"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

/** Wordmark: a small compass and spaced capitals, like an atlas spine. */
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <svg viewBox="-14 -14 28 28" className="h-7 w-7" aria-hidden>
        <circle r="11" fill="none" stroke="var(--ink)" strokeWidth="1" />
        <g className="origin-center [transform-box:fill-box] rotate-[28deg] transition-transform duration-700 ease-out group-hover:rotate-0">
          <path d="M0 -9 L2.6 0 L-2.6 0 Z" fill="var(--rust)" />
          <path d="M0 9 L2.6 0 L-2.6 0 Z" fill="var(--ink)" />
        </g>
      </svg>
      <span className="font-display text-[22px] font-semibold tracking-[0.32em]">{brand.name.toUpperCase()}</span>
    </Link>
  );
}

const links = [
  { href: "/#problem", n: "I", label: "Problem" },
  { href: "/#method", n: "II", label: "How it works" },
  { href: "/#metrics", n: "III", label: "Metrics" },
  { href: "/#teams", n: "IV", label: "Teams" },
  { href: "/#contact", n: "V", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled ? "bg-paper/80 shadow-[0_8px_30px_-20px_rgba(27,42,65,0.35)] backdrop-blur-md" : ""}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Logo />
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="label text-muted transition hover:text-ink">
              <span className="mr-1.5 font-display text-[13px] normal-case tracking-normal text-rust">{l.n}.</span>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <Link href="/experience?sample=1" className="label hidden text-muted transition hover:text-ink sm:block">
            Sample report
          </Link>
          <Link
            href="/experience"
            onClick={(e) => {
              // Already on /experience (maybe showing a report): reload to a blank form.
              if (window.location.pathname === "/experience") {
                e.preventDefault();
                window.location.assign("/experience");
              }
            }}
            className="label rounded-full bg-ink px-5 py-2.5 text-paper transition hover:bg-rust"
          >
            Run analysis
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-rust/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-8">
        <Logo />
        <p className="label text-muted">
          A project by{" "}
          <a href={brand.contact.linkedin || "/#contact"} target={brand.contact.linkedin ? "_blank" : undefined} rel="noreferrer" className="text-ink underline decoration-rust/40 underline-offset-4 transition hover:text-rust">
            {brand.author}
          </a>
        </p>
        <p className="label text-muted">© {new Date().getFullYear()} {brand.name}</p>
      </div>
    </footer>
  );
}
