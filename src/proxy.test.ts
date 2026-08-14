import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isPrivacyPath, needsFullDocumentNavigation } from "@/lib/google-tags-route";
import { proxy } from "@/proxy";

describe("proxy", () => {
  it("sets x-html-lang for English routes", () => {
    const request = new NextRequest("https://plotripple.vercel.app/en");
    const response = proxy(request);
    expect(response.headers.get("x-middleware-request-x-html-lang")).toBe("en");
  });

  it("sets x-html-lang for Portuguese routes", () => {
    const request = new NextRequest("https://plotripple.vercel.app/pt-br");
    const response = proxy(request);
    expect(response.headers.get("x-middleware-request-x-html-lang")).toBe(
      "pt-BR",
    );
  });

  it("disables Google tags only on localized privacy routes", () => {
    const privacyEn = proxy(
      new NextRequest("https://plotripple.vercel.app/en/privacy"),
    );
    const privacyPt = proxy(
      new NextRequest("https://plotripple.vercel.app/pt-br/privacy"),
    );
    const home = proxy(new NextRequest("https://plotripple.vercel.app/en"));
    const about = proxy(
      new NextRequest("https://plotripple.vercel.app/en/about"),
    );

    expect(
      privacyEn.headers.get("x-middleware-request-x-disable-google-tags"),
    ).toBe("1");
    expect(
      privacyPt.headers.get("x-middleware-request-x-disable-google-tags"),
    ).toBe("1");
    expect(
      home.headers.get("x-middleware-request-x-disable-google-tags"),
    ).toBeNull();
    expect(
      about.headers.get("x-middleware-request-x-disable-google-tags"),
    ).toBeNull();
  });
});

describe("isPrivacyPath", () => {
  it("matches only the localized privacy pages", () => {
    expect(isPrivacyPath("/en/privacy")).toBe(true);
    expect(isPrivacyPath("/pt-br/privacy/")).toBe(true);
    expect(isPrivacyPath("/en")).toBe(false);
    expect(isPrivacyPath("/en/about")).toBe(false);
    expect(isPrivacyPath("/en/privacy/extra")).toBe(false);
  });
});

describe("needsFullDocumentNavigation", () => {
  it("forces a full document load when entering or leaving privacy", () => {
    expect(needsFullDocumentNavigation("/en", "/en/privacy")).toBe(true);
    expect(needsFullDocumentNavigation("/en/privacy", "/en")).toBe(true);
    expect(needsFullDocumentNavigation("/en/privacy", "/en/about")).toBe(true);
    expect(
      needsFullDocumentNavigation("/pt-br/privacy", "/pt-br"),
    ).toBe(true);
  });

  it("keeps client navigation inside the same Google-tag zone", () => {
    expect(needsFullDocumentNavigation("/en", "/en/about")).toBe(false);
    expect(needsFullDocumentNavigation("/en", "/pt-br")).toBe(false);
    expect(
      needsFullDocumentNavigation("/en/privacy", "/pt-br/privacy"),
    ).toBe(false);
    expect(
      needsFullDocumentNavigation("/en/privacy/", "/pt-br/privacy?ref=nav"),
    ).toBe(false);
  });
});
