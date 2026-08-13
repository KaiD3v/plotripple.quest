import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import { AnalyticsLoader } from "@/components/ads/analytics-loader";
import { localeHtmlLang } from "@/i18n/config";
import { BRAND_ASSETS } from "@/lib/brand";
import { getGaMeasurementId, getSiteUrl } from "@/lib/env";
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

  return (
    <html
      lang={lang}
      className={`${fraunces.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-deep text-bone">
        {children}
        {measurementId ? (
          <AnalyticsLoader measurementId={measurementId} />
        ) : null}
      </body>
    </html>
  );
}
