import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GenerationHistory } from "@/components/generator/generation-history";
import { getDictionary } from "@/i18n/get-dictionary";
import type { HistoryEntryParsed } from "@/schemas/generator";

const entry = {
  v: 1,
  id: "entry-1",
  createdAt: "2026-08-13T12:00:00.000Z",
  input: {
    eventDescription: "The party spared the captured scout and sent them back.",
    tone: "mysterious",
    intensity: "moderate",
    setting: "fantasy",
    timeframe: "mixed",
    count: 3,
    locale: "en",
  },
  result: {
    summary: "Mercy travels faster than the party.",
    consequences: [
      {
        title: "A rumor takes root",
        description: "Inns repeat a softer warning.",
        timeframe: "immediate",
        category: "social",
        trigger: "Anyone asks why the scout returned.",
        affectedParties: ["the garrison"],
      },
      {
        title: "A debt is named",
        description: "The captain offers a narrow truce.",
        timeframe: "next_session",
        category: "political",
        trigger: "The party nears the forts.",
        affectedParties: ["the captain"],
      },
      {
        title: "Maps are redrawn",
        description: "Merchants take a longer trail.",
        timeframe: "long_term",
        category: "economic",
        trigger: "Caravans hear of the mercy.",
        affectedParties: ["traders"],
      },
    ],
  },
} satisfies HistoryEntryParsed;

describe("GenerationHistory", () => {
  it("renders locale badge, timestamp, and open action", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GenerationHistory
        entries={[entry]}
        dictionary={dictionary}
        onOpen={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain("EN");
    expect(html).toContain("2026-08-13T12:00:00.000Z");
    expect(html).toContain(dictionary.history.open);
    expect(html).toContain(entry.input.eventDescription);
    expect(html).toContain(dictionary.history.clear);
  });

  it("marks the selected record and localizes the Portuguese badge", () => {
    const dictionary = getDictionary("pt-br");
    const portugueseEntry = {
      ...entry,
      id: "entry-pt",
      input: { ...entry.input, locale: "pt-br" as const },
    };
    const html = renderToStaticMarkup(
      <GenerationHistory
        entries={[portugueseEntry]}
        dictionary={dictionary}
        activeId="entry-pt"
        onOpen={() => undefined}
        onClear={() => undefined}
      />,
    );

    expect(html).toContain("PT-BR");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain("is-active");
  });

  it("keeps clear and open as real actions", () => {
    const onOpen = vi.fn();
    const onClear = vi.fn();
    const html = renderToStaticMarkup(
      <GenerationHistory
        entries={[entry]}
        dictionary={getDictionary("en")}
        onOpen={onOpen}
        onClear={onClear}
      />,
    );

    expect(html).toContain("<button");
    expect(html).toContain(getDictionary("en").history.clear);
  });
});
