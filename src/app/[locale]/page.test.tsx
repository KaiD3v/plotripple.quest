import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/generator/generator-workshop", () => ({
  GeneratorWorkshop: () => <div data-workshop-stub="true" />,
}));

import HomePage from "@/app/[locale]/page";
import { getDictionary } from "@/i18n/get-dictionary";

async function renderHome(locale: "en" | "pt-br") {
  const element = await HomePage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve({}),
  });
  return renderToStaticMarkup(element);
}

describe("HomePage editorial sections", () => {
  it("renders use cases and FAQ below the fold in English", async () => {
    const dictionary = getDictionary("en");
    const html = await renderHome("en");

    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain('id="workshop"');
    expect(html).toContain("workshop-anchor");
    expect(html).toContain(dictionary.useCases.title);
    expect(html).toContain(dictionary.faq.title);
    expect(html).toContain(dictionary.useCases.cta);
    expect(html).toContain('href="#workshop"');
    expect(html).toContain('href="/en/privacy"');
    expect((html.match(/<details/g) ?? []).length).toBe(5);
    expect((html.match(/aria-label="Advertisement"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("Coming soon");
    expect(html).not.toContain("More tools for the table");
    expect(html).not.toContain("Rumor Generator");
    expect(html).not.toContain("FAQPage");
  });

  it("renders the same structure in Brazilian Portuguese", async () => {
    const dictionary = getDictionary("pt-br");
    const html = await renderHome("pt-br");

    expect(html).toContain(dictionary.useCases.title);
    expect(html).toContain(dictionary.faq.title);
    expect(html).toContain('href="/pt-br/privacy"');
    expect(html).toContain('href="#workshop"');
    expect((html.match(/aria-label="Publicidade"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("Em breve");
    expect(html).not.toContain("Mais ferramentas para a mesa");
    expect(html).not.toContain("ComingSoonTools");
  });

  it("does not turn the home page or new sections into Client Components", () => {
    const files = [
      "src/app/[locale]/page.tsx",
      "src/components/generator/use-cases.tsx",
      "src/components/generator/faq.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source, file).not.toContain('"use client"');
      expect(source, file).not.toContain("'use client'");
      expect(source, file).not.toContain("ComingSoonTools");
    }
  });
});
