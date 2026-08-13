import type { Dictionary } from "@/i18n/get-dictionary";

export function EmptyResult({
  dictionary,
  pending,
}: {
  dictionary: Dictionary;
  pending: boolean;
}) {
  return (
    <div className="folio-placeholder">
      {pending ? <RippleLoader /> : <EmptyRippleMark />}
      <p className="max-w-md font-reading text-[1.02rem] leading-relaxed text-parchment-ink">
        {pending ? dictionary.generator.generating : dictionary.result.empty}
      </p>
    </div>
  );
}

function EmptyRippleMark() {
  return (
    <svg
      className="empty-folio-mark"
      viewBox="0 0 64 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="18" cy="20" r="2.2" fill="currentColor" opacity="0.85" />
      <circle
        cx="18"
        cy="20"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.7"
      />
      <path
        d="M26 20c10-7 20-8 34-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M26 20c11 3 22 8 34 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function RippleLoader() {
  return (
    <svg
      className="ripple-loader"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="ripple-loader-ring" cx="32" cy="32" r="8" />
      <circle className="ripple-loader-ring ripple-loader-ring-mid" cx="32" cy="32" r="16" />
      <circle className="ripple-loader-ring ripple-loader-ring-outer" cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}
