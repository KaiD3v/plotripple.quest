import type { ReactNode } from "react";

export function GeneratorWorkshopLayout({
  form,
  result,
  history,
}: {
  form: ReactNode;
  result: ReactNode;
  history: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="order-1 min-w-0">{form}</div>
      <div className="order-2 min-w-0 lg:row-span-2">{result}</div>
      <div className="order-3 min-w-0">{history}</div>
    </div>
  );
}
