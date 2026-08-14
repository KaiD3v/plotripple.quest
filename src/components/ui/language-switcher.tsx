"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  localeHreflang,
  localeHtmlLang,
  localeLabels,
  locales,
  swapLocaleHref,
  type Locale,
} from "@/i18n/config";
import { nextFocusIndex } from "@/lib/canvas/viewport";
import { trackEvent } from "@/lib/analytics";
import { PrivacyBoundaryLink } from "@/components/ui/privacy-boundary-link";

function LangSigil() {
  return (
    <svg
      className="lang-switch-sigil"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="6.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
      />
      <path
        d="M8 2.35 9.05 6.95 13.65 8 9.05 9.05 8 13.65 6.95 9.05 2.35 8 6.95 6.95Z"
        fill="currentColor"
      />
      <circle className="lang-switch-sigil-core" cx="8" cy="8" r="1.05" />
    </svg>
  );
}

function LangCheck() {
  return (
    <svg
      className="lang-switch-check"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2.15"
        y="2.15"
        width="7.7"
        height="7.7"
        transform="rotate(45 6 6)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.05"
      />
      <rect
        x="4.2"
        y="4.2"
        width="3.6"
        height="3.6"
        transform="rotate(45 6 6)"
        fill="currentColor"
      />
    </svg>
  );
}

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const selected =
      rootRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"][aria-current="true"]',
      ) ?? rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    selected?.focus();
  }, [open]);

  function menuItems() {
    return Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
  }

  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = menuItems();
    if (items.length === 0) {
      return;
    }
    const currentIndex = Math.max(
      0,
      items.indexOf(document.activeElement as HTMLElement),
    );

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[
        nextFocusIndex(currentIndex, items.length, event.key === "ArrowUp")
      ]?.focus();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="lang-switch">
      <button
        ref={triggerRef}
        type="button"
        className="lang-switch-trigger inline-flex min-h-11 min-w-11 items-center"
        aria-label={`${label}: ${localeLabels[locale]}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        <LangSigil />
        <span className="lang-switch-label" lang={localeHtmlLang[locale]}>
          {localeLabels[locale]}
        </span>
        <ChevronDown className="lang-switch-chevron" aria-hidden="true" />
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!open}
        className="lang-switch-menu"
        onKeyDown={onMenuKeyDown}
      >
        {locales.map((item) => {
          const active = item === locale;
          return (
            <PrivacyBoundaryLink
              key={item}
              href={swapLocaleHref(pathname, item, search)}
              hrefLang={localeHreflang[item]}
              lang={localeHtmlLang[item]}
              role="menuitem"
              tabIndex={-1}
              aria-current={active ? "true" : undefined}
              className={`lang-switch-option inline-flex min-h-11 min-w-11 items-center ${
                active ? "is-active text-gold" : "text-bone"
              }`}
              onClick={() => {
                setOpen(false);
                if (!active) {
                  trackEvent("language_change", { language: item, locale: item });
                  trackEvent("language_changed", { language: item, locale: item });
                }
              }}
            >
              <span>{localeLabels[item]}</span>
              {active ? <LangCheck /> : null}
            </PrivacyBoundaryLink>
          );
        })}
      </div>
    </div>
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
