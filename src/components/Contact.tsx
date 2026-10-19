import { brand } from "@/lib/brand";

/** Quiet contact strip above the footer. */
export function Contact() {
  const { email, linkedin } = brand.contact;
  const links = [
    { label: "Email", href: `mailto:${email}` },
    ...(linkedin ? [{ label: "LinkedIn", href: linkedin }] : []),
  ];

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-8">
      <div className="flex flex-col gap-4 border-t border-rust/25 pt-8 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="font-display text-xl text-muted">
          Questions or feedback? <span className="text-ink">Say hello.</span>
        </p>
        <div className="flex gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noreferrer" : undefined}
              className="label group text-muted transition-colors hover:text-rust"
            >
              {l.label} <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
