export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="16"
        cy="16"
        r="2.4"
        fill="currentColor"
      />
      <circle
        cx="16"
        cy="16"
        r="6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle
        cx="16"
        cy="16"
        r="10.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.7"
      />
      <path
        d="M27.2 16.4c-.4 5.8-5.4 10.4-11.2 10.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
