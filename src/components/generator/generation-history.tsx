"use client";

import type { Dictionary } from "@/i18n/get-dictionary";
import { localeBadges, type Locale } from "@/i18n/config";
import type { HistoryEntryParsed } from "@/schemas/generator";
import { SectionHeading } from "@/components/ui/section-heading";

export function GenerationHistory({
  entries,
  dictionary,
  activeId,
  onOpen,
  onClear,
}: {
  entries: HistoryEntryParsed[];
  dictionary: Dictionary;
  activeId?: string | null;
  onOpen: (entry: HistoryEntryParsed) => void;
  onClear: () => void;
}) {
  return (
    <section className="history-index p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading>{dictionary.history.title}</SectionHeading>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center text-sm text-lichen hover:text-bone"
          >
            {dictionary.history.clear}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[0.8125rem] text-lichen">{dictionary.history.notice}</p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-lichen">{dictionary.history.empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry) => {
            const locale = (entry.input.locale ?? "en") as Locale;
            const selected = activeId === entry.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  aria-current={selected ? true : undefined}
                  className={`history-entry${selected ? " is-active" : ""}`}
                >
                  <span className="line-clamp-2 min-w-0 break-words text-sm text-bone">
                    {entry.input.eventDescription}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-lichen">
                    <span className="font-semibold tracking-wide text-bone">
                      {localeBadges[locale]}
                    </span>
                    <time dateTime={entry.createdAt}>
                      {formatHistoryDate(entry.createdAt, locale)}
                    </time>
                    <span className="ml-auto text-gold">{dictionary.history.open}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatHistoryDate(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "pt-br" ? "pt-BR" : "en", {
    dateStyle: "medium",
  }).format(date);
}
