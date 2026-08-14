import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Faq } from "@/components/generator/faq";
import { getDictionary } from "@/i18n/get-dictionary";

function asHtmlText(value: string) {
  return value.replaceAll("&", "&amp;");
}

describe("Faq", () => {
  it("renders five English questions with native disclosure markup", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <Faq locale="en" dictionary={dictionary} />,
    );

    expect(html).toContain("<h2");
    expect(html).toContain(dictionary.faq.title);
    expect(dictionary.faq.items).toHaveLength(5);
    expect((html.match(/<details/g) ?? []).length).toBe(5);
    expect((html.match(/<summary/g) ?? []).length).toBe(5);
    expect(html).toContain("faq-marker");

    for (const item of dictionary.faq.items) {
      expect(html).toContain(asHtmlText(item.question));
      for (const part of item.answer.split("{privacy}")) {
        if (part) {
          expect(html).toContain(asHtmlText(part));
        }
      }
    }

    expect(html).toContain('href="/en/privacy"');
    expect(html).not.toContain("{privacy}");
    expect(html).not.toContain("FAQPage");
    expect(html).not.toContain("<button");
  });

  it("localizes Portuguese answers and the privacy link", () => {
    const dictionary = getDictionary("pt-br");
    const html = renderToStaticMarkup(
      <Faq locale="pt-br" dictionary={dictionary} />,
    );

    expect(html).toContain(dictionary.faq.title);
    expect(html).toContain('href="/pt-br/privacy"');
    expect(html).toContain(dictionary.nav.privacy);
    expect(html).not.toContain("/en/privacy");
    expect(html).not.toContain("{privacy}");

    for (const item of dictionary.faq.items) {
      expect(html).toContain(asHtmlText(item.question));
    }
  });

  it("stays a server component", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/generator/faq.tsx"),
      "utf8",
    );

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("'use client'");
  });
});
