import type { ConsequenceTimeframe } from "@/types/generator";

export function TimeframeMark({
  timeframe,
}: {
  timeframe: ConsequenceTimeframe;
}) {
  return (
    <svg
      className="timeframe-mark"
      data-timeframe={timeframe}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {timeframe === "immediate" ? (
        <>
          <circle cx="12" cy="12" r="3.1" fill="currentColor" />
          <path
            d="M6.5 12H4M17.5 12H20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {timeframe === "next_session" ? (
        <>
          <circle
            cx="12"
            cy="12"
            r="4.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="12" r="1.55" fill="currentColor" />
        </>
      ) : null}
      {timeframe === "long_term" ? (
        <>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle
            cx="12"
            cy="12"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            opacity="0.55"
          />
        </>
      ) : null}
    </svg>
  );
}
