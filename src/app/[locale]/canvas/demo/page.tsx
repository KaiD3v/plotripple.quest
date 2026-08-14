import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NarrativeCanvasDemo } from "@/components/canvas/narrative-canvas-demo";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { resolveFixture } from "@/lib/canvas/resolve-fixture";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/canvas/demo">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dictionary = getDictionary(locale);
  return {
    ...buildPageMetadata({
      locale,
      path: "/canvas/demo",
      title: dictionary.canvas.metaTitle,
      description: dictionary.canvas.metaDescription,
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CanvasDemoPage({
  params,
  searchParams,
}: PageProps<"/[locale]/canvas/demo">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const query = await searchParams;
  const dictionary = getDictionary(locale);
  const fixture = resolveFixture(locale, query.fixture);

  return (
    <NarrativeCanvasDemo
      graph={fixture.graph}
      locale={locale}
      dictionary={dictionary}
      fixtureId={fixture.id}
      unknownFixture={fixture.unknown}
    />
  );
}
