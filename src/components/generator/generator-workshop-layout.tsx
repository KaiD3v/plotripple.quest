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
    <div className="workshop-bench grid gap-6 lg:grid-cols-[minmax(0,11fr)_minmax(0,14fr)] lg:items-start lg:gap-8">
      <div className="order-1 min-w-0">{form}</div>
      <div className="order-2 min-w-0 lg:row-span-2">
        <div className="lg:sticky lg:top-4">{result}</div>
      </div>
      <div className="order-3 min-w-0">{history}</div>
    </div>
  );
}
