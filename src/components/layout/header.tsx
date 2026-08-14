"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localizedPath, type Locale } from "@/i18n/config";
import { BrandMark } from "@/components/ui/brand-mark";
import { LanguageSwitcherNav } from "@/components/ui/language-switcher";

export function Header({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const links = [
    { href: localizedPath(locale), label: dictionary.nav.home },
    { href: localizedPath(locale, "/about"), label: dictionary.nav.about },
    { href: localizedPath(locale, "/privacy"), label: dictionary.nav.privacy },
    { href: localizedPath(locale, "/terms"), label: dictionary.nav.terms },
  ];

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="border-b border-forest/60 bg-deep pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="page-gutter mx-auto flex max-w-7xl items-center justify-between gap-4 py-2.5">
        <Link
          href={localizedPath(locale)}
          className="flex min-h-11 min-w-0 items-center gap-2.5 text-gold"
        >
          <BrandMark className="h-8 w-8 shrink-0" size={32} priority />
          <span className="font-display text-lg tracking-wide text-bone">
            {dictionary.brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-lichen hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcherNav locale={locale} label={dictionary.nav.language} />
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-bone lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className="sr-only">
            {open ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="mobile-nav-panel page-gutter space-y-1 border-t border-forest/60 py-3 lg:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-bone"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcherNav locale={locale} label={dictionary.nav.language} />
        </nav>
      ) : null}
    </header>
  );
}
