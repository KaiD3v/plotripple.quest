import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import { AnalyticsLoader } from "@/components/ads/analytics-loader";
import { localeHtmlLang } from "@/i18n/config";
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
      <body className="flex min-h-full flex-col bg-void text-mist">
        {children}
        {measurementId ? (
          <AnalyticsLoader measurementId={measurementId} />
        ) : null}
      </body>
    </html>
  );
}
