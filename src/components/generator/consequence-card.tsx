import type { Dictionary } from "@/i18n/get-dictionary";
import type { Consequence } from "@/types/generator";

export function ConsequenceCard({
  consequence,
  dictionary,
}: {
  consequence: Consequence;
  dictionary: Dictionary;
}) {
  return (
    <article className="parchment-card rounded-sm p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dim">
        {dictionary.result.timeframes[consequence.timeframe]} ·{" "}
        {dictionary.result.categories[consequence.category]}
      </p>
      <h3 className="mt-2 font-display text-xl text-parchment-ink">
        {consequence.title}
      </h3>
      <p className="mt-2 break-words text-[0.95rem] leading-relaxed">
        {consequence.description}
      </p>
      <p className="mt-4 text-sm">
        <span className="font-medium">{dictionary.result.triggerLabel}: </span>
        {consequence.trigger}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">{dictionary.result.affectedLabel}: </span>
        {consequence.affectedParties.join(", ")}
      </p>
    </article>
  );
}
