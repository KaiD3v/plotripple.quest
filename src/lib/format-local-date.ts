import type { Locale } from "@/i18n/config";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

export function formatLocalChronicleDate(
  iso: string,
  locale: Locale,
  invalidFallback = "",
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return invalidFallback;
  }

  return new Intl.DateTimeFormat(locale === "pt-br" ? "pt-BR" : "en", DATE_FORMAT).format(
    date,
  );
}
