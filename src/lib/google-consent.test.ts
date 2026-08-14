import { describe, expect, it } from "vitest";
import {
  REGULATED_CONSENT_REGIONS,
  UNREGULATED_CONSENT_DEFAULT,
  buildGoogleConsentDefaultScript,
  parseUnregulatedConsentDefault,
} from "@/lib/google-consent";

const signals = [
  "analytics_storage",
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
] as const;

describe("parseUnregulatedConsentDefault", () => {
  it("accepts only granted or denied and falls back to denied", () => {
    expect(parseUnregulatedConsentDefault("granted")).toBe("granted");
    expect(parseUnregulatedConsentDefault("denied")).toBe("denied");
    expect(parseUnregulatedConsentDefault(" granted ")).toBe("granted");
    expect(parseUnregulatedConsentDefault(undefined)).toBe("denied");
    expect(parseUnregulatedConsentDefault("")).toBe("denied");
    expect(parseUnregulatedConsentDefault("allow")).toBe("denied");
  });
});

describe("buildGoogleConsentDefaultScript", () => {
  it("denies the four signals in EEA, UK, and Switzerland with wait_for_update", () => {
    const script = buildGoogleConsentDefaultScript("denied");

    expect(script).toContain("window.dataLayer");
    expect(script).toContain("wait_for_update");
    expect(script).toContain("500");
    expect(REGULATED_CONSENT_REGIONS).toEqual(
      expect.arrayContaining(["AT", "FR", "DE", "GB", "CH", "NO", "IS", "LI"]),
    );
    expect(script).toContain('"region":');
    for (const region of REGULATED_CONSENT_REGIONS) {
      expect(script).toContain(`"${region}"`);
    }
    for (const signal of signals) {
      expect(script).toMatch(new RegExp(`${signal}":"denied"`));
    }
  });

  it("uses denied as the safe unregulated fallback and never auto-grants", () => {
    expect(UNREGULATED_CONSENT_DEFAULT).toBe("denied");
    const script = buildGoogleConsentDefaultScript();
    expect(script).not.toContain("granted");
    expect(script.match(/gtag\('consent','default'/g)).toHaveLength(2);
  });

  it("can grant only the unregulated fallback while regulated regions stay denied", () => {
    const script = buildGoogleConsentDefaultScript("granted");
    const regionalCall = script.slice(
      0,
      script.lastIndexOf("gtag('consent','default'"),
    );
    const fallbackCall = script.slice(
      script.lastIndexOf("gtag('consent','default'"),
    );

    expect(regionalCall).toContain('"region":');
    expect(regionalCall).not.toContain("granted");
    for (const signal of signals) {
      expect(regionalCall).toMatch(new RegExp(`${signal}":"denied"`));
    }
    expect(fallbackCall).not.toContain("region");
    for (const signal of signals) {
      expect(fallbackCall).toMatch(new RegExp(`${signal}":"granted"`));
    }
    expect(script).not.toContain("'update'");
  });
});
