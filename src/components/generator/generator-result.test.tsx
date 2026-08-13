import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GeneratorResult } from "@/components/generator/generator-result";
import { getDictionary } from "@/i18n/get-dictionary";
import type { GenerationResult } from "@/types/generator";

const result: GenerationResult = {
  summary: "The spared scout carries the party's warning into hostile halls.",
  consequences: [
    {
      title: "A rumor takes root",
      description: "By nightfall, taverns repeat a softer version of the warning.",
      timeframe: "immediate",
      category: "social",
      trigger: "Anyone asks why the scout returned alive.",
      affectedParties: ["the garrison", "nearby inns"],
    },
    {
      title: "A debt is named",
      description: "The scout's captain offers a narrow truce if the party stays out of the pass.",
      timeframe: "next_session",
      category: "political",
      trigger: "The party approaches the border forts again.",
      affectedParties: ["the captain", "the party"],
    },
    {
      title: "Maps are redrawn",
      description: "Merchants avoid the old road, opening a longer trail through rival land.",
      timeframe: "long_term",
      category: "economic",
      trigger: "Caravans hear that mercy changed the watch.",
      affectedParties: ["traders", "rival houses"],
    },
  ],
};

describe("GeneratorResult", () => {
  it("renders the blank folio copy in English and Portuguese", () => {
    const en = renderToStaticMarkup(
      <GeneratorResult
        result={null}
        dictionary={getDictionary("en")}
        pending={false}
        onRegenerate={() => undefined}
      />,
    );
    const pt = renderToStaticMarkup(
      <GeneratorResult
        result={null}
        dictionary={getDictionary("pt-br")}
        pending={false}
        onRegenerate={() => undefined}
      />,
    );

    expect(en).toContain(
      "The page is still blank. Record a choice to reveal its ripples.",
    );
    expect(pt).toContain(
      "A página ainda está em branco. Registre uma escolha para revelar suas repercussões.",
    );
    expect(en).toContain('aria-hidden="true"');
    expect(en).toContain("folio");
    expect(en).toContain("folio-idle");
    expect(en).not.toContain("folio-updating");
  });

  it("keeps copy and regenerate actions with the revealed manuscript", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorResult
        result={result}
        dictionary={dictionary}
        pending={false}
        onRegenerate={() => undefined}
      />,
    );

    expect(html).toContain(dictionary.result.summaryLabel);
    expect(html).toContain("The spared scout carries the party");
    expect(html).toContain(result.consequences[0]?.title);
    expect(html).toContain(dictionary.result.copy);
    expect(html).toContain(dictionary.result.regenerate);
    expect(html).toContain("result-timeline");
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("folio-idle");
  });

  it("exposes a busy state while generating", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorResult
        result={null}
        dictionary={dictionary}
        pending
        onRegenerate={() => undefined}
      />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(dictionary.generator.generating);
    expect(html).toContain("folio-idle");
    expect(html).toContain("ripple-loader");
    expect(html).toContain('aria-live="polite"');
  });

  it("keeps a previous result visible while weaving a new one", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorResult
        result={result}
        dictionary={dictionary}
        pending
        onRegenerate={() => undefined}
      />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(dictionary.generator.generating);
    expect(html).toContain("folio-updating");
    expect(html).not.toContain("folio-idle");
    expect(html).toContain(result.consequences[0]?.title);
    expect(html).toContain("The spared scout carries the party");
    expect(html).toContain(dictionary.result.copy);
  });
});
