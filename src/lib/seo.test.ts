import { describe, expect, it } from "vitest";
import { languageAlternates, absoluteUrl } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";

describe("seo urls", () => {
  it("builds canonical locale paths from the site url", () => {
    expect(absoluteUrl("en")).toBe(`${getSiteUrl()}/en`);
    expect(absoluteUrl("pt-br", "/about")).toBe(`${getSiteUrl()}/pt-br/about`);
  });

  it("includes hreflang en, pt-BR, and x-default to /en", () => {
    const languages = languageAlternates("/privacy");
    expect(languages.en).toBe(`${getSiteUrl()}/en/privacy`);
    expect(languages["pt-BR"]).toBe(`${getSiteUrl()}/pt-br/privacy`);
    expect(languages["x-default"]).toBe(`${getSiteUrl()}/en/privacy`);
  });
});
