import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localizedPath, type Locale } from "@/i18n/config";
import { fixtureIds, type FixtureId } from "@/lib/canvas/fixtures";

export function FixtureSwitcher({
  locale,
  dictionary,
  current,
}: {
  locale: Locale;
  dictionary: Dictionary;
  current: FixtureId;
}) {
  return (
    <div className="chronicle-devbar px-3 py-2">
      <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sage">
        {dictionary.canvas.fixtureLabel}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {fixtureIds.map((id) => {
          const active = id === current;
          return (
            <Link
              key={id}
              href={`${localizedPath(locale, "/canvas/demo")}?fixture=${id}`}
              className="inline-flex min-h-11 items-center px-2.5 font-sans text-[0.72rem] uppercase tracking-[0.12em] text-lichen hover:text-bone"
              aria-current={active ? "page" : undefined}
            >
              {dictionary.canvas.fixtures[id]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
