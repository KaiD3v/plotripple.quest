import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChronicleCanvasPage } from "@/components/canvas/chronicle-canvas-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

type CanvasPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CanvasPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dictionary = getDictionary(locale);
  return {
    ...buildPageMetadata({
      locale,
      path: "/canvas",
      title: dictionary.canvas.productionMetaTitle,
      description: dictionary.canvas.productionMetaDescription,
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CanvasPage({
  params,
}: CanvasPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  return <ChronicleCanvasPage locale={locale} dictionary={dictionary} />;
}
