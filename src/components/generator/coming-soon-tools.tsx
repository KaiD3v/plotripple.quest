import type { Dictionary } from "@/i18n/get-dictionary";
import { SectionHeading } from "@/components/ui/section-heading";

export function ComingSoonTools({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="mt-14">
      <SectionHeading>{dictionary.tools.title}</SectionHeading>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {dictionary.tools.items.map((tool) => (
          <article key={tool.id} className="unwritten-page p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
              {dictionary.tools.soon}
            </p>
            <h3 className="mt-2 font-display text-lg text-lichen">{tool.name}</h3>
            <p className="mt-2 text-sm text-sage">{tool.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
