import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/layout/institutional-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/terms",
    title: dictionary.meta.termsTitle,
    description: dictionary.meta.termsDescription,
  });
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);
  return (
    <InstitutionalPage
      content={dictionary.terms}
      draftNotice={dictionary.terms.draftNotice}
      sections={dictionary.terms.sections}
    />
  );
}
