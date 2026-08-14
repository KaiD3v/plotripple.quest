import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getExampleResult } from "@/components/generator/example-result";
import { GeneratorResult } from "@/components/generator/generator-result";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
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

function renderResult({
  locale = "en",
  ...props
}: Partial<Parameters<typeof GeneratorResult>[0]> & { locale?: Locale } = {}) {
  return renderToStaticMarkup(
    <GeneratorResult
      result={null}
      dictionary={getDictionary(locale)}
      pending={false}
      locale={locale}
      onRegenerate={() => undefined}
      onUseExample={() => undefined}
      {...props}
    />,
  );
}

function statusOf(html: string) {
  return html.match(/id="result-status"[^>]*>(.*?)<\/div>/)?.[1] ?? "";
}

describe("GeneratorResult", () => {
  it("shows a localized example preview when idle without a live announcement", () => {
    const en = renderResult({ locale: "en" });
    const pt = renderResult({ locale: "pt-br", dictionary: getDictionary("pt-br") });
    const exampleEn = getExampleResult("en");
    const examplePt = getExampleResult("pt-br");

    expect(en).toContain(getDictionary("en").example.label);
    expect(en).toContain(exampleEn.decision);
    expect(en).toContain(exampleEn.summary);
    expect(en).toContain(exampleEn.consequences[0]?.title);
    expect(en).toContain("<ul");
    expect(en).not.toContain(getDictionary("en").result.copy);
    expect(en).not.toContain(getDictionary("en").result.exploreMap);
    expect(en).not.toContain(getDictionary("en").result.regenerate);
    expect(en).not.toContain(getDictionary("en").result.empty);
    expect(pt).toContain("Exemplo de resultado");
    expect(pt).toContain(examplePt.decision);
    expect(en).toContain("folio");
    expect(en).toContain("folio-idle");
    expect(en).not.toContain("folio-updating");
    expect(en).not.toMatch(/<section[^>]*aria-live/);
    expect(en).not.toContain("aria-live");
    expect(en).toContain('id="result-status"');
    expect(en).toContain('role="status"');
    expect(statusOf(en)).toBe("");
    expect(statusOf(en)).not.toContain(exampleEn.decision);
    expect(statusOf(en)).not.toContain(getDictionary("en").result.ready);
    expect(statusOf(en)).not.toContain(getDictionary("en").generator.generating);
  });

  it("keeps summary, cards, explore, and regenerate with the revealed manuscript", () => {
    const dictionary = getDictionary("en");
    const html = renderResult({
      result,
      dictionary,
      canvasReady: true,
      onExploreMap: () => undefined,
    });

    expect(html).toContain(dictionary.result.summaryLabel);
    expect(html).toContain("The spared scout carries the party");
    expect(html).toContain(result.consequences[0]?.title);
    expect(html).toContain(result.consequences[1]?.title);
    expect(html).toContain(result.consequences[2]?.title);
    expect(html).toContain("3 consequences");
    expect(html).toContain(dictionary.result.copy);
    expect(html).toContain(dictionary.result.exploreMap);
    expect(html).toContain(dictionary.result.regenerate);
    expect(html).toContain(dictionary.result.ready);
    expect(html).toContain("result-timeline");
    expect(html).not.toMatch(/<section[^>]*aria-live/);
    expect(html).not.toContain("aria-live");
    expect(statusOf(html)).toBe(dictionary.result.ready);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).not.toContain("folio-idle");
    expect(html).not.toContain(dictionary.result.empty);
    expect(html).not.toContain(dictionary.example.label);
    expect(html).not.toContain(getExampleResult("en").decision);
  });

  it("exposes a busy state while generating and hides the example", () => {
    const dictionary = getDictionary("en");
    const html = renderResult({ dictionary, pending: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(dictionary.generator.generating);
    expect(html).toContain("Tracing the ripples of this decision");
    expect(html).toContain("folio-idle");
    expect(html).toContain("ripple-loader");
    expect(html).not.toMatch(/<section[^>]*aria-live/);
    expect(html).not.toContain("aria-live");
    expect(statusOf(html)).toBe(dictionary.generator.generating);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).not.toContain(dictionary.example.label);
    expect(html).not.toContain(dictionary.example.useExample);
    expect(html).not.toContain(getExampleResult("en").decision);
  });

  it("keeps a previous result visible while weaving a new one", () => {
    const dictionary = getDictionary("en");
    const html = renderResult({
      result,
      dictionary,
      pending: true,
      canvasReady: true,
      onExploreMap: () => undefined,
    });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(dictionary.generator.generating);
    expect(html).toContain("folio-updating");
    expect(html).not.toContain("folio-idle");
    expect(html).toContain(result.consequences[0]?.title);
    expect(html).toContain("The spared scout carries the party");
    expect(html).toContain(dictionary.result.copy);
    expect(html).not.toContain(dictionary.example.useExample);
    expect(html).not.toMatch(/<section[^>]*aria-live/);
    expect(html).not.toContain("aria-live");
    expect(statusOf(html)).toBe(dictionary.generator.generating);
    expect(html.match(/role="status"/g)).toHaveLength(1);
  });
});
