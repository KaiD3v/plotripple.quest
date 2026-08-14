import type { Dictionary } from "@/i18n/get-dictionary";
import { SectionHeading } from "@/components/ui/section-heading";

export const WORKSHOP_ANCHOR_ID = "workshop";

export function UseCases({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="mt-14" aria-labelledby="use-cases-heading">
      <SectionHeading id="use-cases-heading" className="sm:text-3xl">
        {dictionary.useCases.title}
      </SectionHeading>
      <p className="mt-3 max-w-3xl text-lichen">{dictionary.useCases.intro}</p>
      <ol className="editorial-list mt-7">
        {dictionary.useCases.items.map((item, index) => (
          <li key={item.id} className="editorial-item">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-display text-xl text-bone">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-lichen">{item.body}</p>
          </li>
        ))}
      </ol>
      <a
        href={`#${WORKSHOP_ANCHOR_ID}`}
        className="use-cases-cta mt-8 inline-flex min-h-11 items-center justify-center text-sm tracking-wide"
      >
        {dictionary.useCases.cta}
      </a>
    </section>
  );
}
