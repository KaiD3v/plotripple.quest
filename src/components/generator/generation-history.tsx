"use client";

import type { Dictionary } from "@/i18n/get-dictionary";
import type { HistoryEntryParsed } from "@/schemas/generator";

export function GenerationHistory({
  entries,
  dictionary,
  onOpen,
  onClear,
}: {
  entries: HistoryEntryParsed[];
  dictionary: Dictionary;
  onOpen: (entry: HistoryEntryParsed) => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-sm border border-moss/40 bg-canopy/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-gold">
          {dictionary.history.title}
        </h2>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center text-sm text-mist-dim hover:text-mist"
          >
            {dictionary.history.clear}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-mist-dim">{dictionary.history.notice}</p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-mist-dim">{dictionary.history.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="flex min-h-11 w-full items-start justify-between gap-3 rounded-sm border border-moss/30 bg-void/40 px-3 py-2 text-left"
              >
                <span className="line-clamp-2 min-w-0 break-words text-sm text-mist">
                  {entry.input.eventDescription}
                </span>
                <span className="shrink-0 text-xs text-gold">
                  {dictionary.history.open}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
