import { describe, expect, it } from "vitest";
import {
  htmlLangFromPathname,
  localeHtmlLang,
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
});
