export function AdSlot({
  label,
  variant,
}: {
  label: string;
  variant: "leaderboard" | "inline";
}) {
  const size =
    variant === "leaderboard" ? "min-h-[90px]" : "min-h-[120px]";

  return (
    <aside
      aria-label={label}
      className={`flex ${size} items-center justify-center border border-dashed border-moss/50 bg-canopy/40 px-4 py-3`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-mist-dim">{label}</p>
    </aside>
  );
}
