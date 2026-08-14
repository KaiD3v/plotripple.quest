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

import { NarrativeCanvasDemo } from "@/components/canvas/narrative-canvas-demo";
import { getFixture } from "@/lib/canvas/fixtures";
import { relatedPathIds } from "@/lib/canvas/graph-queries";
import { getDictionary } from "@/i18n/get-dictionary";

describe("NarrativeCanvasDemo", () => {
  it("renders localized chrome, viewport, hints, and both surfaces", () => {
    const dictionary = getDictionary("en");
    const graph = getFixture("3", "en");
    const html = renderToStaticMarkup(
      <NarrativeCanvasDemo
        graph={graph}
        locale="en"
        dictionary={dictionary}
        fixtureId="3"
      />,
    );

    expect(html).toContain(dictionary.canvas.title);
    expect(html).toContain(dictionary.canvas.zoomIn);
    expect(html).toContain(dictionary.canvas.zoomOut);
    expect(html).toContain(dictionary.canvas.fitChronicle);
    expect(html).toContain(dictionary.canvas.centerSelected);
    expect(html).toContain(dictionary.canvas.resetZoom);
    expect(html).toContain(dictionary.canvas.hintDesktop);
    expect(html).toContain(dictionary.canvas.hintMobile);
    expect(html).toContain("chronicle-devbar");
    expect(html).toContain('data-canvas-viewport="desktop"');
    expect(html).toContain("chronicle-map");
    expect(html).toContain("chronicle-tree");
    expect(html).toContain("hidden lg:block");
    expect(html).toContain("lg:hidden");
    expect(html).toContain(dictionary.canvas.originHint);
    expect(html).not.toContain("Advertisement");
    expect(html).not.toContain('data-details-panel="desktop"');
    expect(html).not.toContain(dictionary.canvas.exploreRipple);
  });

  it("opens desktop details and a mobile dialog for a selected consequence", () => {
    const dictionary = getDictionary("pt-br");
    const graph = getFixture("3", "pt-br");
    const selected = graph.nodes.find((node) => node.kind === "consequence");
    expect(selected?.kind).toBe("consequence");

    const html = renderToStaticMarkup(
      <NarrativeCanvasDemo
        graph={graph}
        locale="pt-br"
        dictionary={dictionary}
        fixtureId="3"
        initialSelectedId={selected?.id}
      />,
    );

    expect(html).toContain(dictionary.canvas.closeDetails);
    expect(html).toContain(dictionary.canvas.detailsTitle);
    expect(html).toContain(dictionary.canvas.centerOnNode);
    expect(html).toContain(dictionary.canvas.fitChronicle);
    expect(html).toContain(dictionary.canvas.hintDesktop);
    expect(html).toContain(dictionary.canvas.hintMobile);
    expect(html).toContain('data-details-panel="desktop"');
    expect(html).toContain('data-details-panel="mobile"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(dictionary.result.triggerLabel);
    expect(html).toContain(dictionary.result.affectedLabel);
    if (selected?.kind === "consequence") {
      expect(html).toContain(selected.title);
      expect(html).toContain(selected.trigger);
    }
  });

  it("keeps the desktop viewport height controlled for 25 nodes", () => {
    const dictionary = getDictionary("en");
    const graph = getFixture("25", "en");
    const html = renderToStaticMarkup(
      <NarrativeCanvasDemo
        graph={graph}
        locale="en"
        dictionary={dictionary}
        fixtureId="25"
      />,
    );

    expect(graph.nodes).toHaveLength(25);
    expect(html.split('data-chronicle-node="').length - 1).toBe(50);
    expect(html).toContain('data-canvas-viewport="desktop"');
    expect(html).toContain("chronicle-stage");
    expect(html).toContain(dictionary.canvas.outlineSummary);
    expect(html).not.toContain("pagead");
  });

  it("highlights the path to a deep follow-up and can open its details", () => {
    const dictionary = getDictionary("en");
    const graph = getFixture("25", "en");
    const followUp = graph.nodes.find(
      (node) => node.kind === "follow_up" && node.id.endsWith(":f3"),
    );
    expect(followUp).toBeDefined();
    const related = relatedPathIds(graph, followUp!.id);
    expect(related.nodes.has(graph.rootNodeId)).toBe(true);
    expect(related.nodes.size).toBeGreaterThan(3);

    const html = renderToStaticMarkup(
      <NarrativeCanvasDemo
        graph={graph}
        locale="en"
        dictionary={dictionary}
        fixtureId="25"
        initialSelectedId={followUp?.id}
      />,
    );

    expect(html).toContain(dictionary.canvas.followUpLabel);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(dictionary.canvas.centerOnNode);
    expect(html).toContain("is-related");
    expect(html).toContain("is-dimmed");
    expect(html).toContain('aria-pressed="true"');
    if (followUp?.kind === "follow_up") {
      expect(html).toContain(followUp.title);
      expect(html).toContain(followUp.note);
    }
  });

  it("wraps long Portuguese copy instead of clipping it", () => {
    const dictionary = getDictionary("pt-br");
    const graph = getFixture("long-pt", "pt-br");
    const html = renderToStaticMarkup(
      <NarrativeCanvasDemo
        graph={graph}
        locale="pt-br"
        dictionary={dictionary}
        fixtureId="long-pt"
      />,
    );

    expect(html).toContain("break-words");
    expect(html).toContain("overflow-x-hidden");
    expect(html).toContain("Estivadores recusam o desembarque noturno");
    expect(html).toContain(dictionary.canvas.hintMobile);
  });
});
