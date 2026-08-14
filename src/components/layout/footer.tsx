import type { Dictionary } from "@/i18n/get-dictionary";
import { localizedPath, type Locale } from "@/i18n/config";
import { BrandLockup } from "@/components/ui/brand-mark";
import { PrivacyBoundaryLink } from "@/components/ui/privacy-boundary-link";

export function Footer({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <footer className="mt-auto border-t border-forest/60 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="page-gutter mx-auto flex max-w-7xl flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BrandLockup />
          <p className="mt-2 max-w-md text-sm text-lichen">
            {dictionary.footer.rights} {dictionary.footer.independent}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <PrivacyBoundaryLink
            href={localizedPath(locale, "/about")}
            className="inline-flex min-h-11 items-center text-lichen hover:text-bone"
          >
            {dictionary.nav.about}
          </PrivacyBoundaryLink>
          <PrivacyBoundaryLink
            href={localizedPath(locale, "/privacy")}
            className="inline-flex min-h-11 items-center text-lichen hover:text-bone"
          >
            {dictionary.nav.privacy}
          </PrivacyBoundaryLink>
          <PrivacyBoundaryLink
            href={localizedPath(locale, "/terms")}
            className="inline-flex min-h-11 items-center text-lichen hover:text-bone"
          >
            {dictionary.nav.terms}
          </PrivacyBoundaryLink>
        </nav>
      </div>
    </footer>
  );
}
