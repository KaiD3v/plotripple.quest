import type { NarrativeStatus } from "@/types/narrative-graph";

export function StatusMark({ status }: { status: NarrativeStatus }) {
  return (
    <svg
      className="status-mark"
      data-status={status}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {status === "pending" ? (
        <rect
          x="4.2"
          y="4.2"
          width="7.6"
          height="7.6"
          transform="rotate(45 8 8)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      ) : null}
      {status === "active" ? (
        <>
          <rect
            x="4.2"
            y="4.2"
            width="7.6"
            height="7.6"
            transform="rotate(45 8 8)"
            fill="currentColor"
          />
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : null}
      {status === "resolved" ? (
        <path
          d="M3.5 8.2 L6.4 11 L12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {status === "dismissed" ? (
        <>
          <rect
            x="4.2"
            y="4.2"
            width="7.6"
            height="7.6"
            transform="rotate(45 8 8)"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M4 12 L12 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}
