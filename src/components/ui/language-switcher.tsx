"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { localeLabels, locales, swapLocaleHref, type Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics";

export function LanguageSwitcher({
  locale,
  label,
  search = "",
}: {
  locale: Locale;
  label: string;
  search?: string;
}) {
  const pathname = usePathname() || `/${locale}`;

  return (
    <nav aria-label={label} className="lang-switch">
      {locales.map((item) => {
        const active = item === locale;
        return (
          <Link
            key={item}
            href={swapLocaleHref(pathname, item, search)}
            hrefLang={item === "pt-br" ? "pt-BR" : "en"}
            lang={item === "pt-br" ? "pt-BR" : "en"}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm tracking-wide ${
              active ? "text-bone" : "text-lichen hover:text-bone"
            }`}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (!active) {
                trackEvent("language_change", { language: item, locale: item });
                trackEvent("language_changed", { language: item, locale: item });
              }
            }}
          >
            {localeLabels[item]}
          </Link>
        );
      })}
    </nav>
  );
}

function LanguageSwitcherWithSearch({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const searchParams = useSearchParams();
  return (
    <LanguageSwitcher
      locale={locale}
      label={label}
      search={searchParams.toString()}
    />
  );
}

export function LanguageSwitcherNav({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  return (
    <Suspense fallback={<LanguageSwitcher locale={locale} label={label} />}>
      <LanguageSwitcherWithSearch locale={locale} label={label} />
    </Suspense>
  );
}
