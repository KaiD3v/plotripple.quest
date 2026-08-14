"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localeBadges, type Locale } from "@/i18n/config";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionHeading } from "@/components/ui/section-heading";
import type { RecentDeviceItem } from "@/lib/chronicle/recent-device";
import { rememberFocusTrigger } from "@/lib/canvas/dialog-focus";
import { formatLocalChronicleDate } from "@/lib/format-local-date";
import type { HistoryEntryParsed } from "@/schemas/generator";

export function GenerationHistory({
  items,
  locale,
  dictionary,
  activeId,
  libraryFull = false,
  onOpenMap,
  onReviewLegacy,
  onDelete,
  onClear,
}: {
  items: RecentDeviceItem[];
  locale: Locale;
  dictionary: Dictionary;
  activeId?: string | null;
  libraryFull?: boolean;
  onOpenMap: (item: Extract<RecentDeviceItem, { kind: "chronicle" }>) => void;
  onReviewLegacy: (entry: HistoryEntryParsed) => void;
  onDelete: (item: RecentDeviceItem) => void;
  onClear: () => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<{
    item: RecentDeviceItem;
    trigger: HTMLElement | null;
  } | null>(null);
  const [pendingClear, setPendingClear] = useState<HTMLElement | null | false>(
    false,
  );

  return (
    <section className="history-index p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading>{dictionary.history.title}</SectionHeading>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={(event) => {
              setPendingClear(rememberFocusTrigger(event.currentTarget));
            }}
            className="inline-flex min-h-11 items-center text-sm text-lichen hover:text-bone"
            aria-label={dictionary.history.clear}
          >
            {dictionary.history.clear}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[0.8125rem] text-lichen">{dictionary.history.notice}</p>
      {libraryFull ? (
        <p className="workshop-alert mt-3 px-3 py-2 text-sm" role="status">
          {dictionary.history.libraryFull}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-lichen">{dictionary.history.empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const selected = activeId === item.id;
            const formattedDate = formatLocalChronicleDate(
              item.updatedAt,
              locale,
              dictionary.history.invalidDate,
            );
            return (
              <li key={`${item.kind}:${item.id}`}>
                <div
                  className={`history-entry${selected ? " is-active" : ""}`}
                  aria-current={selected ? true : undefined}
                >
                  <p className="line-clamp-2 min-w-0 break-words text-sm text-bone">
                    {item.title}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-lichen">
                    <span className="font-semibold tracking-wide text-bone">
                      {localeBadges[item.locale]}
                    </span>
                    {item.kind === "chronicle" ? (
                      <span>
                        {dictionary.history.nodeCount.replace(
                          "{count}",
                          String(item.nodeCount),
                        )}
                      </span>
                    ) : null}
                    <time dateTime={item.updatedAt}>{formattedDate}</time>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.kind === "chronicle" ? (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-gold"
                        onClick={() => onOpenMap(item)}
                      >
                        {dictionary.history.openMap}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-gold"
                        onClick={() => onReviewLegacy(item.entry)}
                      >
                        {dictionary.history.open}
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center border border-bronze/45 px-3 text-sm text-parchment-ink"
                      aria-label={dictionary.history.deleteNamed.replace(
                        "{title}",
                        item.title,
                      )}
                      onClick={(event) => {
                        setPendingDelete({
                          item,
                          trigger: rememberFocusTrigger(event.currentTarget),
                        });
                      }}
                    >
                      {dictionary.history.delete}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title={dictionary.history.deleteConfirmTitle}
          body={dictionary.history.deleteConfirmBody.replace(
            "{title}",
            pendingDelete.item.title,
          )}
          confirmLabel={dictionary.history.deleteConfirm}
          cancelLabel={dictionary.history.deleteCancel}
          trigger={pendingDelete.trigger}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.item);
            setPendingDelete(null);
          }}
        />
      ) : null}

      {pendingClear !== false ? (
        <ConfirmDialog
          title={dictionary.history.clearConfirmTitle}
          body={dictionary.history.clearConfirmBody}
          confirmLabel={dictionary.history.clearConfirm}
          cancelLabel={dictionary.history.clearCancel}
          trigger={pendingClear || null}
          onCancel={() => setPendingClear(false)}
          onConfirm={() => {
            onClear();
            setPendingClear(false);
          }}
        />
      ) : null}
    </section>
  );
}
