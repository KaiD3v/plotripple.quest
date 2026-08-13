import type { ReactNode } from "react";

export function ResultTimeline({
  children,
  mixed = false,
}: {
  children: ReactNode;
  mixed?: boolean;
}) {
  return (
    <div className={`result-timeline${mixed ? " is-mixed" : ""}`}>{children}</div>
  );
}
