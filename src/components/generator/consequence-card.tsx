import type { Dictionary } from "@/i18n/get-dictionary";
import type { Consequence } from "@/types/generator";
import { TimeframeMark } from "@/components/generator/timeframe-mark";

export function ConsequenceCard({
  consequence,
  dictionary,
}: {
  consequence: Consequence;
  dictionary: Dictionary;
}) {
  const parties = consequence.affectedParties ?? [];
  const trigger = consequence.trigger?.trim();

  return (
    <article className="consequence-entry">
      <TimeframeMark timeframe={consequence.timeframe} />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bronze">
        {dictionary.result.timeframes[consequence.timeframe]} ·{" "}
        {dictionary.result.categories[consequence.category]}
      </p>
      <h3 className="mt-2 font-display text-xl text-parchment-ink">
        {consequence.title}
      </h3>
      <p className="folio-prose mt-2 break-words font-reading text-[1.02rem] leading-relaxed">
        {consequence.description}
      </p>
      {trigger ? (
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-parchment-ink">
          <span className="font-semibold">{dictionary.result.triggerLabel}: </span>
          {trigger}
        </p>
      ) : null}
      {parties.length > 0 ? (
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-parchment-ink">
          <span className="font-semibold">{dictionary.result.affectedLabel}: </span>
          {parties.join(", ")}
        </p>
      ) : null}
    </article>
  );
}
