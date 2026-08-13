import type { ReactNode } from "react";

export function SectionHeading({
  id,
  children,
  index,
  stepLabel,
  tone = "workshop",
  className = "",
}: {
  id?: string;
  children: ReactNode;
  index?: string;
  stepLabel?: string;
  tone?: "workshop" | "folio";
  className?: string;
}) {
  const color = tone === "folio" ? "text-parchment-ink" : "text-bone";
  const indexColor = tone === "folio" ? "text-bronze" : "text-sage";

  return (
    <div>
      {index ? (
        <span
          className={`mb-2 block font-sans text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${indexColor}`}
          aria-hidden="true"
        >
          {index}
        </span>
      ) : null}
      <h2
        id={id}
        className={`font-display text-2xl leading-tight ${color} ${className}`.trim()}
      >
        {stepLabel ? <span className="sr-only">{stepLabel}. </span> : null}
        {children}
      </h2>
    </div>
  );
}
