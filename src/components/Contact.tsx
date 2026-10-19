import { brand } from "@/lib/brand";

/** Contact details, shown plainly above the footer. */
export function Contact() {
  const { email, linkedin } = brand.contact;
  const linkedinLabel = linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-8">
      <div className="flex flex-col gap-3 border-t border-rust/25 pt-8 text-[15px] sm:flex-row sm:gap-10">
        <p>
          <span className="text-muted">Email: </span>
          <a href={`mailto:${email}`} className="underline decoration-rust/40 underline-offset-4 hover:text-rust">
            {email}
          </a>
        </p>
        {linkedin && (
          <p>
            <span className="text-muted">LinkedIn: </span>
            <a href={linkedin} target="_blank" rel="noreferrer" className="underline decoration-rust/40 underline-offset-4 hover:text-rust">
              {linkedinLabel}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
