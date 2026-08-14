import { locales } from "@/i18n/config";

export const DISABLE_GOOGLE_TAGS_HEADER = "x-disable-google-tags";

const privacyPathPattern = new RegExp(
  `^/(${locales.join("|")})/privacy/?$`,
  "i",
);

export function isPrivacyPath(pathname: string): boolean {
  return privacyPathPattern.test(pathname);
}

export function hrefPathname(href: string): string {
  const withoutHash = href.split("#")[0] ?? href;
  return withoutHash.split("?")[0] ?? withoutHash;
}

export function needsFullDocumentNavigation(
  currentPathname: string,
  href: string,
): boolean {
  return isPrivacyPath(currentPathname) !== isPrivacyPath(hrefPathname(href));
}
