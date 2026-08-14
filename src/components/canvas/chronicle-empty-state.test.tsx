import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { ChronicleCanvasPage } from "@/components/canvas/chronicle-canvas-page";
import { ChronicleEmptyState } from "@/components/canvas/chronicle-empty-state";
import { NarrativeCanvas } from "@/components/canvas/narrative-canvas";
import { mapGeneratedConsequencesToChronicleGraph } from "@/lib/chronicle/map-generated-consequences";
import { chronicleGraphToNarrativeGraph } from "@/lib/chronicle/narrative-bridge";
import { getDictionary } from "@/i18n/get-dictionary";

const result = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout’s kin begin asking quiet favors.",
      timeframe: "immediate" as const,
      category: "social" as const,
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout’s kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      timeframe: "next_session" as const,
      category: "political" as const,
      trigger: "The report reaches the captain.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims start using the party’s name.",
      timeframe: "long_term" as const,
      category: "supernatural" as const,
      trigger: "A chaplain writes the story down.",
      affectedParties: ["border pilgrims"],
    },
  ],
};

describe("chronicle production route surfaces", () => {
  it("renders a designed empty state with a localized create link", () => {
    const dictionary = getDictionary("pt-br");
    const html = renderToStaticMarkup(
      <ChronicleEmptyState locale="pt-br" dictionary={dictionary} />,
    );

    expect(html).toContain(dictionary.canvas.emptyEyebrow);
    expect(html).toContain(dictionary.canvas.emptyTitle);
    expect(html).toContain(dictionary.canvas.emptyBody);
    expect(html).toContain(dictionary.canvas.emptyAction);
    expect(html).toContain('href="/pt-br"');
    expect(html).toContain("chronicle-empty");
    expect(html).not.toContain("chronicle-devbar");
  });

  it("does not read sessionStorage during SSR", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    expect(html).toContain(dictionary.canvas.loading);
    expect(html).toContain(dictionary.canvas.productionTitle);
    expect(html).not.toContain(dictionary.canvas.emptyTitle);
    expect(html).not.toContain("chronicle-devbar");
  });

  it("renders a generated chronicle on the shared canvas without demo chrome", () => {
    const dictionary = getDictionary("en");
    const mapped = mapGeneratedConsequencesToChronicleGraph(result, {
      decision:
        "The party spared the captured scout and sent them home with a warning.",
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }

    const graph = chronicleGraphToNarrativeGraph(mapped.graph, "en");
    const html = renderToStaticMarkup(
      <NarrativeCanvas
        graph={graph}
        dictionary={dictionary}
        chrome={{
          eyebrow: dictionary.canvas.productionEyebrow,
          title: dictionary.canvas.productionTitle,
          helper: dictionary.canvas.productionHelper,
        }}
      />,
    );

    expect(html).toContain(dictionary.canvas.productionTitle);
    expect(html).toContain(dictionary.canvas.productionHelper);
    expect(html).toContain("A whispered debt");
    expect(html).toContain("chronicle-map");
    expect(html).toContain("chronicle-tree");
    expect(html).not.toContain("chronicle-devbar");
    expect(html).not.toContain(dictionary.canvas.fixtureLabel);
  });
});
