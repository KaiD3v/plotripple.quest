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

const DEMO_QUERY_VALUE = /^[a-z0-9-]{1,40}$/i;

export function preservedDemoSearch(
  search: string | URLSearchParams | null | undefined,
): string {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search
        ? new URLSearchParams(search)
        : null;
  if (!params) {
    return "";
  }

  const fixture = params.get("fixture");
  if (!fixture || !DEMO_QUERY_VALUE.test(fixture)) {
    return "";
  }

  return `?fixture=${encodeURIComponent(fixture)}`;
}

export function swapLocaleHref(
  pathname: string,
  nextLocale: Locale,
  search?: string | URLSearchParams | null,
): string {
  return `${swapLocalePath(pathname, nextLocale)}${preservedDemoSearch(search)}`;
}
