import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/ad-slot";
import { ComingSoonTools } from "@/components/generator/coming-soon-tools";
import { Editorial } from "@/components/generator/editorial";
import { GeneratorWorkshop } from "@/components/generator/generator-workshop";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublicTurnstileSiteKey } from "@/lib/env";
import {
  buildPageMetadata,
  webApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dictionary = getDictionary(locale);
  return buildPageMetadata({
    locale,
    title: dictionary.meta.homeTitle,
    description: dictionary.meta.homeDescription,
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />

      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-dim">
          {dictionary.hero.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-mist sm:text-5xl">
          {dictionary.brand.lead}
        </h1>
        <p className="mt-3 font-display text-xl text-gold">
          {dictionary.brand.tagline}
        </p>
        <p className="mt-4 max-w-2xl text-mist-dim">{dictionary.hero.helper}</p>
      </section>

      <div className="mt-8">
        <GeneratorWorkshop
          locale={locale}
          dictionary={dictionary}
          turnstileSiteKey={getPublicTurnstileSiteKey()}
        />
      </div>

      <div className="mt-8">
        <AdSlot label={dictionary.ads.label} variant="leaderboard" />
      </div>

      <Editorial dictionary={dictionary} />

      <div className="mt-8">
        <AdSlot label={dictionary.ads.label} variant="inline" />
      </div>

      <ComingSoonTools dictionary={dictionary} />
    </div>
  );
}
