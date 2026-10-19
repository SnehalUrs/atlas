import { brand } from "@/lib/brand";
import { Reveal } from "./motion";

const linkedinLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Closing section with the author's contact links. */
export function Contact() {
  const { email, linkedin } = brand.contact;
  const links = [
    { label: "Email", value: email, href: `mailto:${email}` },
    ...(linkedin ? [{ label: "LinkedIn", value: linkedinLabel(linkedin), href: linkedin }] : []),
  ];

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-28 sm:px-8">
      <Reveal className="grid gap-12 border-t border-rust/30 pt-14 md:grid-cols-[1fr_1.1fr] md:items-end">
        <div>
          <p className="label mb-4 text-muted">Get in touch</p>
          <h2 className="font-display text-5xl font-medium leading-[1] sm:text-6xl">
            Built by <em className="text-rust">{brand.author}.</em>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Questions about Atlas, feedback, or something you&apos;d like to build together? I&apos;d love to hear from you.
          </p>
        </div>
        <ul className="divide-y divide-rust/20 border-y border-rust/20">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex items-baseline justify-between gap-6 py-6 transition-colors hover:text-rust"
              >
                <span className="label text-muted transition-colors group-hover:text-rust">{l.label}</span>
                <span className="flex items-baseline gap-3 font-display text-2xl sm:text-3xl">
                  <span className="break-all">{l.value}</span>
                  <span className="text-rust transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
