import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/script", () => ({
  default: function Script({
    id,
    src,
    strategy,
    children,
    crossOrigin,
    dangerouslySetInnerHTML,
  }: {
    id?: string;
    src?: string;
    strategy?: string;
    children?: ReactNode;
    crossOrigin?: "anonymous" | "use-credentials";
    dangerouslySetInnerHTML?: { __html: string };
  }) {
    const props = {
      "data-next-script": "",
      "data-script-id": id,
      "data-src": src,
      "data-strategy": strategy,
      "data-cross-origin": crossOrigin,
    };

    if (dangerouslySetInnerHTML) {
      return <div {...props} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />;
    }

    if (typeof children === "string") {
      return <div {...props} dangerouslySetInnerHTML={{ __html: children }} />;
    }

    return <div {...props}>{children}</div>;
  },
}));

import { AdSenseLoader } from "@/components/ads/adsense-loader";
import { AnalyticsLoader } from "@/components/ads/analytics-loader";
import { GoogleConsentDefaults } from "@/components/ads/google-consent-defaults";
import { GoogleTagLoaders } from "@/components/ads/google-tag-loaders";
import { AdSlot } from "@/components/ads/ad-slot";

const consentSignals = [
  "analytics_storage",
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
] as const;

function sourceFiles(): string[] {
  const root = path.join(process.cwd(), "src");
  return [
    "app/layout.tsx",
    "components/ads/google-consent-defaults.tsx",
    "components/ads/analytics-loader.tsx",
    "components/ads/adsense-loader.tsx",
    "components/ads/google-tag-loaders.tsx",
    "lib/analytics.ts",
    "lib/env.ts",
  ].map((relative) => readFileSync(path.join(root, relative), "utf8"));
}

describe("GoogleConsentDefaults", () => {
  it("sets the four Consent Mode v2 signals to denied before any Google tag", () => {
    const html = renderToStaticMarkup(<GoogleConsentDefaults />);

    expect(html).toContain('data-script-id="google-consent-defaults"');
    expect(html).toContain('data-strategy="beforeInteractive"');
    expect(html).toContain("window.dataLayer");
    expect(html).toContain("wait_for_update");
    expect(html).toContain("500");
    expect(html).toContain('"region":');
    expect(html).toContain('"GB"');
    expect(html).toContain('"CH"');
    expect(html).not.toContain("granted");
    expect(html.match(/gtag\('consent','default'/g)).toHaveLength(2);

    for (const signal of consentSignals) {
      expect(html).toMatch(new RegExp(`${signal}['"]:\\s*['"]denied['"]`));
    }
  });
});

describe("AnalyticsLoader", () => {
  it("loads gtag.js and config without setting consent defaults", () => {
    const html = renderToStaticMarkup(
      <AnalyticsLoader measurementId="G-TESTMEASURE" />,
    );

    expect(html).toContain(
      "https://www.googletagmanager.com/gtag/js?id=G-TESTMEASURE",
    );
    expect(html).toContain("gtag('js',new Date())");
    expect(html).toContain("gtag('config','G-TESTMEASURE'");
    expect(html).not.toContain("consent");
    expect(html).not.toContain("pagead2.googlesyndication.com");
  });
});

describe("AdSenseLoader", () => {
  it("loads the AdSense script once for a valid client ID", () => {
    const html = renderToStaticMarkup(
      <AdSenseLoader clientId="ca-pub-1234567890123456" />,
    );
    const matches = html.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g);

    expect(html).toContain(
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456",
    );
    expect(html).toContain('data-cross-origin="anonymous"');
    expect(html).toContain('data-script-id="adsense-loader"');
    expect(matches).toHaveLength(1);
    expect(html).not.toContain("adsbygoogle.push");
    expect(html).not.toContain("enable_page_level_ads");
  });

  it("renders nothing for an invalid client ID", () => {
    const html = renderToStaticMarkup(
      <AdSenseLoader clientId="not-a-publisher-id" />,
    );

    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle.js");
  });

  it("renders nothing for a Publisher ID that is not exactly 16 digits", () => {
    const html = renderToStaticMarkup(
      <AdSenseLoader clientId="ca-pub-123456789012345" />,
    );

    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle.js");
  });
});

describe("GoogleTagLoaders", () => {
  it("places consent defaults before Analytics and AdSense tags", () => {
    const html = renderToStaticMarkup(
      <GoogleTagLoaders
        measurementId="G-TESTMEASURE"
        adsenseClientId="ca-pub-1234567890123456"
      />,
    );

    const consentIndex = html.indexOf('data-script-id="google-consent-defaults"');
    const analyticsIndex = html.indexOf("googletagmanager.com/gtag/js");
    const adsenseIndex = html.indexOf("pagead2.googlesyndication.com");

    expect(consentIndex).toBeGreaterThanOrEqual(0);
    expect(consentIndex).toBeLessThan(analyticsIndex);
    expect(analyticsIndex).toBeLessThan(adsenseIndex);
    expect(html).toContain('data-strategy="beforeInteractive"');
    expect(html).not.toContain("granted");
  });

  it("loads Analytics without AdSense while keeping consent defaults", () => {
    const html = renderToStaticMarkup(
      <GoogleTagLoaders measurementId="G-TESTMEASURE" />,
    );

    expect(html).toContain("google-consent-defaults");
    expect(html).toContain("googletagmanager.com/gtag/js?id=G-TESTMEASURE");
    expect(html).not.toContain("adsbygoogle.js");
  });

  it("loads AdSense without Analytics while keeping consent defaults", () => {
    const html = renderToStaticMarkup(
      <GoogleTagLoaders adsenseClientId="ca-pub-1234567890123456" />,
    );

    expect(html).toContain("google-consent-defaults");
    expect(html).toContain("adsbygoogle.js?client=ca-pub-1234567890123456");
    expect(html).not.toContain("googletagmanager.com/gtag/js");
  });

  it("loads no Google scripts when both IDs are absent", () => {
    const html = renderToStaticMarkup(<GoogleTagLoaders />);

    expect(html).toBe("");
    expect(html).not.toContain("googletagmanager.com");
    expect(html).not.toContain("googlesyndication.com");
    expect(html).not.toContain("google-consent-defaults");
  });

  it("renders nothing on privacy routes even when Google IDs are present", () => {
    const html = renderToStaticMarkup(
      <GoogleTagLoaders
        disabled
        measurementId="G-TESTMEASURE"
        adsenseClientId="ca-pub-1234567890123456"
      />,
    );

    expect(html).toBe("");
    expect(html).not.toContain("googletagmanager.com");
    expect(html).not.toContain("googlesyndication.com");
    expect(html).not.toContain("google-consent-defaults");
    expect(html).not.toContain("fundingchoices");
  });

  it("does not render a first-party cookie banner", () => {
    const html = renderToStaticMarkup(
      <GoogleTagLoaders
        measurementId="G-TESTMEASURE"
        adsenseClientId="ca-pub-1234567890123456"
      />,
    );
    const placeholder = renderToStaticMarkup(
      <AdSlot label="Advertisement" variant="leaderboard" />,
    );

    expect(html.toLowerCase()).not.toMatch(/accept cookies|cookie banner|cookieyes|onetrust/);
    expect(placeholder).not.toContain("adsbygoogle");
    expect(placeholder).toContain("Advertisement");
  });
});

describe("consent authority", () => {
  it("does not persist a first-party consent cookie or grant consent in source", () => {
    const files = sourceFiles();
    const joined = files.join("\n");

    expect(joined).not.toContain("plotripple_consent");
    expect(joined).not.toContain("grantAnalyticsConsent");
    expect(joined).not.toContain("localStorage");
    expect(joined).not.toMatch(/consent['"]\s*,\s*['"]update['"][\s\S]*granted/);
  });

  it("loads Google tags from the root layout with independent IDs", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );

    expect(layout).toContain("getGaMeasurementId");
    expect(layout).toContain("getAdSenseClientId");
    expect(layout).toContain("GoogleTagLoaders");
    expect(layout).toContain("DISABLE_GOOGLE_TAGS_HEADER");
    expect(layout).not.toContain("cloudflare");
  });
});
