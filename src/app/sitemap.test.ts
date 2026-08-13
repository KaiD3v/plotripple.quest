import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getSiteUrl } from "@/lib/env";

describe("sitemap", () => {
  it("includes the localized marketing routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    const siteUrl = getSiteUrl();
    expect(urls).toEqual(
      expect.arrayContaining([
        `${siteUrl}/en`,
        `${siteUrl}/en/about`,
        `${siteUrl}/en/privacy`,
        `${siteUrl}/en/terms`,
        `${siteUrl}/pt-br`,
        `${siteUrl}/pt-br/about`,
        `${siteUrl}/pt-br/privacy`,
        `${siteUrl}/pt-br/terms`,
      ]),
    );
  });
});

describe("robots", () => {
  it("blocks /api/", () => {
    const manifest = robots();
    const rules = Array.isArray(manifest.rules) ? manifest.rules[0] : manifest.rules;
    expect(rules?.disallow).toEqual(expect.arrayContaining(["/api/"]));
  });
});
