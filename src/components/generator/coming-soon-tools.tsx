import type { Dictionary } from "@/i18n/get-dictionary";

export function ComingSoonTools({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl text-gold">{dictionary.tools.title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {dictionary.tools.items.map((tool) => (
          <article
            key={tool.id}
            className="rounded-sm border border-moss/40 bg-canopy/40 p-4 text-left"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-gold-dim">
              {dictionary.tools.soon}
            </p>
            <h3 className="mt-2 font-display text-lg text-mist">{tool.name}</h3>
            <p className="mt-2 text-sm text-mist-dim">{tool.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
