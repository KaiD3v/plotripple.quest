export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`ornament-divider ${className}`.trim()} aria-hidden="true">
      <span className="ornament-divider-mark" />
    </div>
  );
}
