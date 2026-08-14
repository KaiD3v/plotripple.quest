import { AdSenseLoader } from "@/components/ads/adsense-loader";
import { AnalyticsLoader } from "@/components/ads/analytics-loader";
import { GoogleConsentDefaults } from "@/components/ads/google-consent-defaults";

export function GoogleTagLoaders({
  disabled = false,
  measurementId,
  adsenseClientId,
}: {
  disabled?: boolean;
  measurementId?: string;
  adsenseClientId?: string;
}) {
  if (disabled || (!measurementId && !adsenseClientId)) {
    return null;
  }

  return (
    <>
      <GoogleConsentDefaults />
      {measurementId ? <AnalyticsLoader measurementId={measurementId} /> : null}
      {adsenseClientId ? <AdSenseLoader clientId={adsenseClientId} /> : null}
    </>
  );
}
