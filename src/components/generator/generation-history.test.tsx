import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GenerationHistory } from "@/components/generator/generation-history";
import { getDictionary } from "@/i18n/get-dictionary";
import type { RecentDeviceItem } from "@/lib/chronicle/recent-device";
import type { HistoryEntryParsed } from "@/schemas/generator";

const chronicleItem: Extract<RecentDeviceItem, { kind: "chronicle" }> = {
  kind: "chronicle",
  id: "chr-mercy",
  title: "The party spared the captured scout and sent them back.",
  locale: "en",
  nodeCount: 6,
  updatedAt: "2026-08-13T12:00:00.000Z",
  persisted: true,
};

const legacyEntry = {
  v: 1,
  id: "entry-1",
  createdAt: "2026-08-10T12:00:00.000Z",
  input: {
    eventDescription: "An old result without enough graph data.",
    tone: "mysterious",
    intensity: "moderate",
    setting: "fantasy",
    timeframe: "mixed",
    count: 3,
    locale: "en",
  },
  result: {
    summary: "",
    consequences: [],
  },
} satisfies HistoryEntryParsed;

const legacyItem: Extract<RecentDeviceItem, { kind: "legacy" }> = {
  kind: "legacy",
  id: legacyEntry.id,
  title: legacyEntry.input.eventDescription,
  locale: "en",
  updatedAt: legacyEntry.createdAt,
  entry: legacyEntry,
};

describe("GenerationHistory", () => {
  it("renders chronicle metadata and open map without offering a map for legacy items", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GenerationHistory
        items={[chronicleItem, legacyItem]}
        locale="en"
        dictionary={dictionary}
        onOpenMap={() => undefined}
        onReviewLegacy={() => undefined}
        onDelete={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain("EN");
    expect(html).toContain('dateTime="2026-08-13T12:00:00.000Z"');
    expect(html).toContain("Aug 13, 2026");
    expect(html).toContain(dictionary.history.openMap);
    expect(html).toContain("6 nodes");
    expect(html).toContain(chronicleItem.title);
    expect(html).toContain(dictionary.history.open);
    expect(html).toContain(legacyItem.title);
    expect(html).toContain(dictionary.history.clear);
    expect(html).toContain("Clear local chronicles");
    expect(html).toContain(
      dictionary.history.deleteNamed.replace("{title}", chronicleItem.title),
    );
  });

  it("formats dates for the UI locale while keeping the chronicle language badge", () => {
    const dictionary = getDictionary("pt-br");
    const englishChronicle = {
      ...chronicleItem,
      id: "chr-en",
      locale: "en" as const,
    };
    const html = renderToStaticMarkup(
      <GenerationHistory
        items={[englishChronicle]}
        locale="pt-br"
        dictionary={dictionary}
        onOpenMap={() => undefined}
        onReviewLegacy={() => undefined}
        onDelete={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain("EN");
    expect(html).toContain("13 de ago. de 2026");
    expect(html).toContain(dictionary.history.clear);
    expect(html).toContain("Limpar crônicas locais");
  });

  it("shows a localized fallback for invalid timestamps", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GenerationHistory
        items={[{ ...chronicleItem, updatedAt: "not-a-date" }]}
        locale="en"
        dictionary={dictionary}
        onOpenMap={() => undefined}
        onReviewLegacy={() => undefined}
        onDelete={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain(dictionary.history.invalidDate);
  });

  it("marks the selected record and localizes the Portuguese badge", () => {
    const dictionary = getDictionary("pt-br");
    const portugueseItem = {
      ...chronicleItem,
      id: "chr-pt",
      locale: "pt-br" as const,
    };
    const html = renderToStaticMarkup(
      <GenerationHistory
        items={[portugueseItem]}
        locale="pt-br"
        dictionary={dictionary}
        activeId="chr-pt"
        onOpenMap={() => undefined}
        onReviewLegacy={() => undefined}
        onDelete={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain("PT-BR");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain("is-active");
    expect(html).toContain(dictionary.history.openMap);
  });

  it("keeps clear, open map, and delete as real actions", () => {
    const onOpenMap = vi.fn();
    const onClear = vi.fn();
    const html = renderToStaticMarkup(
      <GenerationHistory
        items={[chronicleItem]}
        locale="en"
        dictionary={getDictionary("en")}
        onOpenMap={onOpenMap}
        onReviewLegacy={vi.fn()}
        onDelete={vi.fn()}
        onClear={onClear}
      />,
    );

    expect(html).toContain("<button");
    expect(html).toContain(getDictionary("en").history.clear);
    expect(html).toContain(getDictionary("en").history.openMap);
  });
});
