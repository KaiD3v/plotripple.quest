import Script from "next/script";

export function AnalyticsLoader({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${measurementId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
