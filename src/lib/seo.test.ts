import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildPageMetadata,
  languageAlternates,
} from "@/lib/seo";
import { BRAND_ASSETS, BRAND_OPEN_GRAPH } from "@/lib/brand";
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

describe("page metadata brand surface", () => {
  it("points Open Graph and Twitter cards at the brand kit artwork", () => {
    const metadata = buildPageMetadata({
      locale: "en",
      title: "PlotRipple",
      description: "Narrative workshop",
    });

    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(JSON.stringify(metadata.openGraph?.images)).toContain(
      BRAND_OPEN_GRAPH.url,
    );
    expect(JSON.stringify(metadata.openGraph?.images)).toContain("1200");
    expect(JSON.stringify(metadata.openGraph?.images)).toContain("630");
    expect(JSON.stringify(metadata.twitter)).toContain(BRAND_ASSETS.openGraph);
    expect(metadata.icons).toBeUndefined();
  });
});
