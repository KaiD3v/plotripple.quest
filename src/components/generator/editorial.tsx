import type { Dictionary } from "@/i18n/get-dictionary";
import { SectionHeading } from "@/components/ui/section-heading";

export function Editorial({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="mt-14">
      <SectionHeading className="sm:text-3xl">{dictionary.editorial.title}</SectionHeading>
      <p className="mt-3 max-w-3xl text-lichen">{dictionary.editorial.intro}</p>
      <ol className="editorial-list mt-7">
        {dictionary.editorial.items.map((item, index) => (
          <li key={item.title} className="editorial-item">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-display text-xl text-bone">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-lichen">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
