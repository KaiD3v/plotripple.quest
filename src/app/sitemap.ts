import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { languageAlternates } from "@/lib/seo";

const paths = ["", "/about", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: languageAlternates(path),
      },
    })),
  );
}
