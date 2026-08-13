import type { Metadata } from "next";
import {
  localeHreflang,
  locales,
  localizedPath,
  type Locale,
} from "@/i18n/config";
import { BRAND_ASSETS, BRAND_OPEN_GRAPH } from "@/lib/brand";
import { getSiteUrl } from "@/lib/env";

export function absoluteUrl(locale: Locale, path = ""): string {
  return `${getSiteUrl()}${localizedPath(locale, path)}`;
}

export function languageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": absoluteUrl("en", path),
  };

  for (const locale of locales) {
    languages[localeHreflang[locale]] = absoluteUrl(locale, path);
  }

  return languages;
}

export function buildPageMetadata(options: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  const path = options.path ?? "";
  const canonical = absoluteUrl(options.locale, path);

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: options.title,
      description: options.description,
      locale: options.locale === "pt-br" ? "pt_BR" : "en_US",
      alternateLocale: options.locale === "pt-br" ? ["en_US"] : ["pt_BR"],
      siteName: "PlotRipple",
      images: [BRAND_OPEN_GRAPH],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [BRAND_ASSETS.openGraph],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PlotRipple",
    url,
    inLanguage: ["en", "pt-BR"],
  };
}

export function webApplicationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PlotRipple Consequence Generator",
    url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
