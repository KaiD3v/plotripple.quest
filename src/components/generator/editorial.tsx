import type { Dictionary } from "@/i18n/get-dictionary";

export function Editorial({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl text-gold sm:text-3xl">
        {dictionary.editorial.title}
      </h2>
      <p className="mt-3 max-w-3xl text-mist-dim">{dictionary.editorial.intro}</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-2">
        {dictionary.editorial.items.map((item, index) => (
          <li
            key={item.title}
            className="rounded-sm border border-moss/40 bg-canopy/30 p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-gold-dim">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-display text-xl text-mist">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-dim">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
