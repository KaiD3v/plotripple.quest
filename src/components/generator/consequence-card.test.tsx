import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsequenceCard } from "@/components/generator/consequence-card";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Consequence } from "@/types/generator";

const base: Omit<Consequence, "timeframe" | "title"> = {
  description: "The watch changes its orders before dawn.",
  category: "political",
  trigger: "The scout reports to the captain.",
  affectedParties: ["the garrison"],
};

describe("ConsequenceCard", () => {
  it("keeps textual timeframe labels and a non-color mark", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <ConsequenceCard
        consequence={{ ...base, title: "Immediate watch", timeframe: "immediate" }}
        dictionary={dictionary}
      />,
    );

    expect(html).toContain(dictionary.result.timeframes.immediate);
    expect(html).toContain(dictionary.result.categories.political);
    expect(html).toContain(dictionary.result.triggerLabel);
    expect(html).toContain(dictionary.result.affectedLabel);
    expect(html).toContain('data-timeframe="immediate"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("omits optional trigger and affected parties when absent", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <ConsequenceCard
        consequence={{
          title: "Quiet shift",
          description: "The watch changes without naming names.",
          timeframe: "immediate",
          category: "social",
          trigger: "",
          affectedParties: [],
        }}
        dictionary={dictionary}
      />,
    );

    expect(html).toContain("Quiet shift");
    expect(html).not.toContain(dictionary.result.triggerLabel);
    expect(html).not.toContain(dictionary.result.affectedLabel);
  });
});
