import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getExampleResult } from "@/components/generator/example-result";
import { ExampleResultPreview } from "@/components/generator/example-result-preview";
import { getDictionary } from "@/i18n/get-dictionary";

describe("ExampleResultPreview", () => {
  it("renders a compact localized example without real result actions", () => {
    const dictionary = getDictionary("en");
    const example = getExampleResult("en");
    const html = renderToStaticMarkup(
      <ExampleResultPreview
        locale="en"
        dictionary={dictionary}
        onUseExample={() => undefined}
      />,
    );

    expect(html).toContain(dictionary.example.label);
    expect(html).toContain(dictionary.example.decisionLabel);
    expect(html).toContain(dictionary.example.summaryLabel);
    expect(html).toContain(dictionary.example.useExample);
    expect(html).toContain(example.decision);
    expect(html).toContain(example.summary);
    expect(html).toContain(example.consequences[0]?.title);
    expect(html).toContain(example.consequences[1]?.title);
    expect(html).toContain(example.consequences[2]?.title);
    expect(html).toContain(dictionary.result.timeframes.immediate);
    expect(html).toContain(dictionary.result.timeframes.next_session);
    expect(html).toContain(dictionary.result.timeframes.long_term);
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("example-ripple-title");
    expect(html).toContain("example-ripple-timeframe");
    expect(html).not.toContain(" — ");
    expect(html).not.toContain(dictionary.result.copy);
    expect(html).not.toContain(dictionary.result.exploreMap);
    expect(html).not.toContain(dictionary.result.regenerate);
    expect(html).not.toContain(dictionary.result.empty);
    expect(html).not.toContain("consequence-entry");
  });

  it("localizes the preview chrome and sample in Brazilian Portuguese", () => {
    const dictionary = getDictionary("pt-br");
    const example = getExampleResult("pt-br");
    const html = renderToStaticMarkup(
      <ExampleResultPreview
        locale="pt-br"
        dictionary={dictionary}
        onUseExample={() => undefined}
      />,
    );

    expect(html).toContain("Exemplo de resultado");
    expect(html).toContain("Usar este exemplo");
    expect(html).toContain(example.decision);
    expect(html).toContain("O templo perde sua autoridade");
  });
});
