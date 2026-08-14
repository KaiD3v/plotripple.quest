import type { ReactNode } from "react";
import { localizedPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { SectionHeading } from "@/components/ui/section-heading";

export function Faq({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const privacyHref = localizedPath(locale, "/privacy");

  return (
    <section className="mt-14" aria-labelledby="faq-heading">
      <SectionHeading id="faq-heading" className="sm:text-3xl">
        {dictionary.faq.title}
      </SectionHeading>
      <div className="faq-list mt-6">
        {dictionary.faq.items.map((item) => (
          <details key={item.id} className="faq-item">
            <summary className="faq-summary">
              <span className="faq-marker" aria-hidden="true">
                <FaqChevron />
              </span>
              <span className="faq-question">{item.question}</span>
            </summary>
            <p className="faq-answer">
              {linkPrivacy(item.answer, privacyHref, dictionary.nav.privacy)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function linkPrivacy(text: string, href: string, label: string): ReactNode {
  const [before, ...rest] = text.split("{privacy}");
  if (rest.length === 0) {
    return text;
  }

  return (
    <>
      {before}
      <a href={href} className="faq-privacy-link">
        {label}
      </a>
      {rest.join("")}
    </>
  );
}

function FaqChevron() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d="M2.4 4.2 6 7.8 9.6 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
