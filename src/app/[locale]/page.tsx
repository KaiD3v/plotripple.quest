import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/ad-slot";
import { ComingSoonTools } from "@/components/generator/coming-soon-tools";
import { Editorial } from "@/components/generator/editorial";
import { GeneratorWorkshop } from "@/components/generator/generator-workshop";
import { JsonLd } from "@/components/seo/json-ld";
import { OrnamentDivider } from "@/components/ui/ornament-divider";
import { RippleOrnament } from "@/components/ui/ripple-ornament";
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
    <div className="page-gutter mx-auto w-full max-w-7xl overflow-x-hidden py-6 sm:py-8">
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />

      <section className="hero-workshop grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
        <div className="max-w-3xl">
          <p className="eyebrow">{dictionary.hero.eyebrow}</p>
          <h1 className="hero-heading mt-2 break-words font-display text-[1.75rem] leading-tight text-bone sm:text-4xl">
            {dictionary.brand.lead}
          </h1>
          <p className="hero-tagline mt-2 font-display text-lg text-gold sm:text-xl">
            {dictionary.brand.tagline}
          </p>
          <p className="hero-helper mt-3 max-w-2xl break-words text-lichen">
            {dictionary.hero.helper}
          </p>
        </div>
        <RippleOrnament className="hidden lg:block" />
      </section>
      <RippleOrnament className="hero-ornament mt-3 max-h-12 w-full lg:hidden" />

      <div className="mt-7">
        <GeneratorWorkshop
          locale={locale}
          dictionary={dictionary}
          turnstileSiteKey={getPublicTurnstileSiteKey()}
        />
      </div>

      <div className="mt-10">
        <AdSlot label={dictionary.ads.label} variant="leaderboard" />
      </div>

      <OrnamentDivider className="mt-12" />
      <Editorial dictionary={dictionary} />

      <div className="mt-10">
        <AdSlot label={dictionary.ads.label} variant="inline" />
      </div>

      <ComingSoonTools dictionary={dictionary} />
    </div>
  );
}
