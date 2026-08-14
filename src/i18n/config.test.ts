import { describe, expect, it } from "vitest";
import {
  htmlLangFromPathname,
  localeBadges,
  localeHtmlLang,
  preservedDemoSearch,
  swapLocaleHref,
  swapLocalePath,
} from "@/i18n/config";

describe("html lang", () => {
  it("maps /en to en and /pt-br to pt-BR", () => {
    expect(localeHtmlLang.en).toBe("en");
    expect(localeHtmlLang["pt-br"]).toBe("pt-BR");
    expect(htmlLangFromPathname("/en")).toBe("en");
    expect(htmlLangFromPathname("/pt-br/about")).toBe("pt-BR");
  });
});

describe("language switching", () => {
  it("swaps the locale segment without losing the rest of the path", () => {
    expect(swapLocalePath("/en/privacy", "pt-br")).toBe("/pt-br/privacy");
    expect(swapLocalePath("/pt-br", "en")).toBe("/en");
  });

  it("preserves only the demo fixture query parameter", () => {
    expect(preservedDemoSearch("fixture=25&utm=1")).toBe("?fixture=25");
    expect(preservedDemoSearch("?fixture=long-pt")).toBe("?fixture=long-pt");
    expect(preservedDemoSearch("evil=<script>")).toBe("");
    expect(
      swapLocaleHref("/en/canvas/demo", "pt-br", "fixture=25"),
    ).toBe("/pt-br/canvas/demo?fixture=25");
    expect(swapLocaleHref("/en/about", "pt-br")).toBe("/pt-br/about");
  });
});

describe("locale badges", () => {
  it("uses compact EN and PT-BR marks for history", () => {
    expect(localeBadges.en).toBe("EN");
    expect(localeBadges["pt-br"]).toBe("PT-BR");
  });
});
