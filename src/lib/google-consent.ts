export type ConsentState = "granted" | "denied";

export const UNREGULATED_CONSENT_DEFAULT: ConsentState = "denied";

/**
 * EEA (EU + IS, LI, NO), United Kingdom, and Switzerland.
 * Consent Mode defaults for these regions stay denied until Google's CMP updates them.
 */
export const REGULATED_CONSENT_REGIONS = [
  "AT",
  "BE",
  "BG",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
] as const;

export function parseUnregulatedConsentDefault(
  value: string | undefined,
): ConsentState {
  const trimmed = value?.trim().toLowerCase();
  return trimmed === "granted" || trimmed === "denied" ? trimmed : "denied";
}

function consentStatePayload(state: ConsentState) {
  return {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  };
}

export function buildGoogleConsentDefaultScript(
  unregulatedDefault: ConsentState = UNREGULATED_CONSENT_DEFAULT,
): string {
  const regulated = {
    ...consentStatePayload("denied"),
    wait_for_update: 500,
    region: [...REGULATED_CONSENT_REGIONS],
  };
  const unregulated = consentStatePayload(unregulatedDefault);

  return `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',${JSON.stringify(regulated)});
gtag('consent','default',${JSON.stringify(unregulated)});`;
}
