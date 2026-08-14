import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { UseCases } from "@/components/generator/use-cases";
import { getDictionary } from "@/i18n/get-dictionary";

describe("UseCases", () => {
  it("renders four localized campaign use cases with semantic headings", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(<UseCases dictionary={dictionary} />);

    expect(html).toContain("<h2");
    expect(html).toContain(dictionary.useCases.title);
    expect(html).toContain(dictionary.useCases.intro);
    expect((html.match(/<h3/g) ?? []).length).toBe(4);
    expect(dictionary.useCases.items).toHaveLength(4);

    for (const item of dictionary.useCases.items) {
      expect(html).toContain(item.title);
      expect(html).toContain(item.body);
    }

    expect(html).toContain("<ol");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Coming soon");
    expect(html).not.toContain("Rumor Generator");
  });

  it("keeps Portuguese copy and a single workshop anchor CTA", () => {
    const dictionary = getDictionary("pt-br");
    const html = renderToStaticMarkup(<UseCases dictionary={dictionary} />);

    expect(html).toContain(dictionary.useCases.title);
    expect(html).toContain(dictionary.useCases.cta);
    expect(html).toContain('href="#workshop"');
    expect((html.match(/<a /g) ?? []).length).toBe(1);
    expect(html).not.toContain("Em breve");
    expect(html).not.toContain("Gerador de Rumores");
  });

  it("stays a server component", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/generator/use-cases.tsx"),
      "utf8",
    );

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("'use client'");
  });
});
