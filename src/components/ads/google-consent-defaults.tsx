import Script from "next/script";
import { getUnregulatedConsentDefault } from "@/lib/env";
import { buildGoogleConsentDefaultScript } from "@/lib/google-consent";

export function GoogleConsentDefaults() {
  const script = buildGoogleConsentDefaultScript(getUnregulatedConsentDefault());

  return (
    // Next.js 16 App Router: beforeInteractive belongs in the root layout.
    // This component is only mounted from src/app/layout.tsx. The ESLint
    // rule still allows pages/_document.js or files under app/.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="google-consent-defaults"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
