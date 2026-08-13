import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localizedPath, type Locale } from "@/i18n/config";

export function Footer({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <footer className="mt-auto border-t border-moss/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-gold">{dictionary.brand.name}</p>
          <p className="mt-1 max-w-md text-sm text-mist-dim">
            {dictionary.footer.rights} {dictionary.footer.independent}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <Link
            href={localizedPath(locale, "/about")}
            className="inline-flex min-h-11 items-center text-mist-dim hover:text-mist"
          >
            {dictionary.nav.about}
          </Link>
          <Link
            href={localizedPath(locale, "/privacy")}
            className="inline-flex min-h-11 items-center text-mist-dim hover:text-mist"
          >
            {dictionary.nav.privacy}
          </Link>
          <Link
            href={localizedPath(locale, "/terms")}
            className="inline-flex min-h-11 items-center text-mist-dim hover:text-mist"
          >
            {dictionary.nav.terms}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
