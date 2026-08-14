import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localizedPath, type Locale } from "@/i18n/config";

export function ChronicleEmptyState({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <div className="page-gutter mx-auto w-full max-w-3xl py-8 sm:py-10">
      <p className="eyebrow">{dictionary.canvas.emptyEyebrow}</p>
      <div className="chronicle-empty mt-4">
        <EmptyBlotterMark />
        <h1 className="mt-4 font-display text-3xl text-bone sm:text-4xl">
          {dictionary.canvas.emptyTitle}
        </h1>
        <p className="mt-3 max-w-xl font-reading text-[1.05rem] leading-relaxed text-lichen">
          {dictionary.canvas.emptyBody}
        </p>
        <Link
          href={localizedPath(locale)}
          className="chronicle-empty-cta mt-6 inline-flex min-h-11 items-center justify-center px-4 text-sm tracking-wide text-gold"
        >
          {dictionary.canvas.emptyAction}
        </Link>
      </div>
    </div>
  );
}

function EmptyBlotterMark() {
  return (
    <svg
      className="chronicle-empty-seal"
      viewBox="0 0 72 72"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="36"
        cy="36"
        r="6"
        fill="currentColor"
        opacity="0.9"
      />
      <circle
        cx="36"
        cy="36"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.75"
      />
      <circle
        cx="36"
        cy="36"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.4"
        strokeDasharray="3 5"
      />
      <path
        d="M10 54h52"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.35"
      />
      <path
        d="M14 60h44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.22"
      />
    </svg>
  );
}
