export const locales = ["en", "pt-br"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeHtmlLang: Record<Locale, string> = {
  en: "en",
  "pt-br": "pt-BR",
};

export const localeHreflang: Record<Locale, string> = {
  en: "en",
  "pt-br": "pt-BR",
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-br": "Português",
};

export const localeBadges: Record<Locale, string> = {
  en: "EN",
  "pt-br": "PT-BR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function htmlLangFromPathname(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment)) {
    return localeHtmlLang[segment];
  }
  return localeHtmlLang[defaultLocale];
}

export function localizedPath(locale: Locale, path = ""): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/${locale}${normalized}`;
}

export function swapLocalePath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1] ?? "")) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return localizedPath(nextLocale, pathname);
}
