import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NarrativeStatusControl } from "@/components/canvas/narrative-status-control";
import { getDictionary } from "@/i18n/get-dictionary";
import type { NodeStatusUi } from "@/lib/chronicle/use-node-status";
import type { NarrativeNode } from "@/types/narrative-graph";

const node: Extract<NarrativeNode, { kind: "consequence" }> = {
  id: "chr-mercy:c:0",
  kind: "consequence",
  title: "A whispered debt",
  description: "Kin ask quiet favors.",
  timeframe: "immediate",
  category: "social",
  trigger: "The scout talks.",
  affectedParties: ["the kin"],
  status: "pending",
};

function statusUi(current: NodeStatusUi["currentStatus"]): NodeStatusUi {
  return {
    pending: false,
    error: undefined,
    announcement: "",
    clearAnnouncement: vi.fn(),
    currentStatus: current,
    setStatus: vi.fn(),
  };
}

describe("NarrativeStatusControl", () => {
  it("exposes unique radio ids, names, values, and a single checked option", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <NarrativeStatusControl
        node={node}
        dictionary={dictionary}
        statusUi={statusUi(() => "active")}
        surface="desktop"
      />,
    );

    expect(html).toContain('name="chr-mercy-c-0-narrative-status-desktop"');
    expect(html).toContain('id="chr-mercy-c-0-status-pending-desktop"');
    expect(html).toContain('id="chr-mercy-c-0-status-active-desktop"');
    expect(html).toContain('id="chr-mercy-c-0-status-resolved-desktop"');
    expect(html).toContain('id="chr-mercy-c-0-status-dismissed-desktop"');
    expect(html).toContain('value="pending"');
    expect(html).toContain('value="active"');
    expect(html).toContain('value="resolved"');
    expect(html).toContain('value="dismissed"');
    expect(html).toContain('for="chr-mercy-c-0-status-active-desktop"');
    expect(html.match(/checked(?:="")?/g)?.length ?? 0).toBe(1);
    expect(html).toMatch(
      /id="chr-mercy-c-0-status-active-desktop"[^>]*checked|checked[^>]*id="chr-mercy-c-0-status-active-desktop"/,
    );
    expect(html).not.toContain("Active Active");
  });

  it("keeps desktop and mobile radio names isolated for the same node", () => {
    const dictionary = getDictionary("en");
    const ui = statusUi(() => "pending");
    const desktop = renderToStaticMarkup(
      <NarrativeStatusControl
        node={node}
        dictionary={dictionary}
        statusUi={ui}
        surface="desktop"
      />,
    );
    const mobile = renderToStaticMarkup(
      <NarrativeStatusControl
        node={node}
        dictionary={dictionary}
        statusUi={ui}
        surface="mobile"
      />,
    );

    expect(desktop).toContain('name="chr-mercy-c-0-narrative-status-desktop"');
    expect(mobile).toContain('name="chr-mercy-c-0-narrative-status-mobile"');
    expect(desktop).toContain('id="chr-mercy-c-0-status-active-desktop"');
    expect(mobile).toContain('id="chr-mercy-c-0-status-active-mobile"');
  });
});
