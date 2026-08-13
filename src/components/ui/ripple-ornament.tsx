export function RippleOrnament({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ripple-ornament ${className}`.trim()}
      viewBox="0 0 280 72"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="48" cy="36" r="3" fill="currentColor" />
      <circle
        cx="48"
        cy="36"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <circle
        cx="48"
        cy="36"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.45"
      />
      <path
        d="M66 36c28-18 58-22 96-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M66 36c32 4 70 18 118 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M66 36c24 16 54 24 92 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="164" cy="26" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="188" cy="48" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="236" cy="32" r="1.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
