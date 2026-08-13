export function AdSlot({
  label,
  variant,
}: {
  label: string;
  variant: "leaderboard" | "inline";
}) {
  const size = variant === "leaderboard" ? "min-h-[90px]" : "min-h-[120px]";

  return (
    <aside
      aria-label={label}
      className={`ad-frame flex ${size} items-center justify-center px-4 py-3`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-sage">{label}</p>
    </aside>
  );
}
