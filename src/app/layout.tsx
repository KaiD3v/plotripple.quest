import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import { GoogleTagLoaders } from "@/components/ads/google-tag-loaders";
import { localeHtmlLang } from "@/i18n/config";
import { BRAND_ASSETS } from "@/lib/brand";
import { getAdSenseClientId, getGaMeasurementId, getSiteUrl } from "@/lib/env";
import { Analytics } from "@vercel/analytics/next"
import { DISABLE_GOOGLE_TAGS_HEADER } from "@/lib/google-tags-route";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "PlotRipple",
    template: "%s",
  },
  applicationName: "PlotRipple",
  icons: {
    icon: [
      { url: BRAND_ASSETS.faviconIco, sizes: "any" },
      { url: BRAND_ASSETS.favicon16, sizes: "16x16", type: "image/png" },
      { url: BRAND_ASSETS.favicon32, sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: BRAND_ASSETS.appleTouch, sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerList = await headers();
  const lang = headerList.get("x-html-lang") || localeHtmlLang.en;
  const measurementId = getGaMeasurementId();
  const adsenseClientId = getAdSenseClientId();
  const disableGoogleTags = headerList.get(DISABLE_GOOGLE_TAGS_HEADER) === "1";

  return (
    <html
      lang={lang}
      className={`${fraunces.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-deep text-bone">
        {children}
        <GoogleTagLoaders
          disabled={disableGoogleTags}
          measurementId={measurementId}
          adsenseClientId={adsenseClientId}
        />
        <Analytics />
      </body>
    </html>
  );
}
