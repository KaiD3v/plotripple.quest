import Script from "next/script";
import { parseAdSenseClientId } from "@/lib/env";

export function adsenseScriptSrc(clientId: string): string {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
}

export function AdSenseLoader({ clientId }: { clientId: string }) {
  const validId = parseAdSenseClientId(clientId);
  if (!validId) {
    return null;
  }

  return (
    <Script
      id="adsense-loader"
      src={adsenseScriptSrc(validId)}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
