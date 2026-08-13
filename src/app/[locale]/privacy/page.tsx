import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/layout/institutional-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/privacy",
    title: dictionary.meta.privacyTitle,
    description: dictionary.meta.privacyDescription,
  });
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dictionary = getDictionary(locale);
  return (
    <InstitutionalPage
      content={dictionary.privacy}
      draftNotice={dictionary.privacy.draftNotice}
      sections={dictionary.privacy.sections}
    />
  );
}
