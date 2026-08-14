import { describe, expect, it } from "vitest";
import { mapGeneratedConsequencesToChronicleGraph } from "@/lib/chronicle/map-generated-consequences";
import type { GenerationResult } from "@/types/generator";

const smallResult: GenerationResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout’s kin begin asking quiet favors.",
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout’s kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      timeframe: "next_session",
      category: "political",
      trigger: "The report reaches the captain.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims start using the party’s name.",
      timeframe: "long_term",
      category: "supernatural",
      trigger: "A chaplain writes the story down.",
      affectedParties: ["border pilgrims"],
    },
  ],
};

const decision =
  "The party spared the captured scout and sent them home with a warning.";

function manyConsequences(count: number): GenerationResult {
  return {
    summary: "A named thief drags twenty-four ripples behind one rumor.",
    consequences: Array.from({ length: count }, (_, index) => ({
      title: `Ripple ${index + 1}`,
      description: `Consequence ${index + 1} stays as plain text, not <b>html</b>.`,
      timeframe:
        index % 3 === 0
          ? ("immediate" as const)
          : index % 3 === 1
            ? ("next_session" as const)
            : ("long_term" as const),
      category: "social" as const,
      trigger: `Trigger ${index + 1}`,
      affectedParties: [`party ${index + 1}`],
    })),
  };
}

describe("mapGeneratedConsequencesToChronicleGraph", () => {
  it("converts a small generation result into a valid chronicle", () => {
    const mapped = mapGeneratedConsequencesToChronicleGraph(smallResult, {
      decision,
      title: "Scout mercy",
    });

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }

    expect(mapped.graph.version).toBe(1);
    expect(mapped.graph.id).toMatch(/^chr-/);
    expect(mapped.graph.title).toBe("Scout mercy");
    expect(mapped.graph.nodes).toHaveLength(4);
    expect(mapped.graph.nodes.some((node) => node.description.includes("<"))).toBe(
      false,
    );

    const origin = mapped.graph.nodes.find((node) => node.type === "origin");
    expect(origin?.parentId).toBeNull();
    expect(origin?.depth).toBe(0);
    expect(origin?.title).toBe(decision);
    expect(origin?.description).toBe(smallResult.summary);

    const consequences = mapped.graph.nodes.filter(
      (node) => node.type === "consequence",
    );
    expect(consequences).toHaveLength(3);
    expect(
      consequences.every(
        (node) => node.parentId === origin?.id && node.depth === 1,
      ),
    ).toBe(true);
    expect(consequences[0]?.title).toBe("A whispered debt");
    expect(consequences[0]?.description).toBe(
      "The scout’s kin begin asking quiet favors.",
    );
  });

  it("keeps ids stable and unique across a 25-node conversion", () => {
    const result = manyConsequences(24);
    const first = mapGeneratedConsequencesToChronicleGraph(result, {
      decision: "The thief is named in open court.",
    });
    const second = mapGeneratedConsequencesToChronicleGraph(result, {
      decision: "The thief is named in open court.",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    expect(first.graph.nodes).toHaveLength(25);
    expect(new Set(first.graph.nodes.map((node) => node.id)).size).toBe(25);
    expect(first.graph.nodes.map((node) => node.id)).toEqual(
      second.graph.nodes.map((node) => node.id),
    );

    const origin = first.graph.nodes.find((node) => node.parentId === null);
    expect(origin?.type).toBe("origin");
    expect(origin?.depth).toBe(0);
    expect(
      first.graph.nodes
        .filter((node) => node.id !== origin?.id)
        .every((node) => node.parentId === origin?.id && node.depth === 1),
    ).toBe(true);
    expect(first.graph.nodes[5]?.description).toContain("not <b>html</b>");
  });

  it("returns a translatable domain error for invalid or empty input", () => {
    const invalid = mapGeneratedConsequencesToChronicleGraph("nope");
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.code).toBe("CHRONICLE_INVALID");
    }

    expect(
      mapGeneratedConsequencesToChronicleGraph({ summary: "Only a summary." }),
    ).toEqual({ ok: false, code: "CHRONICLE_EMPTY" });
    expect(
      mapGeneratedConsequencesToChronicleGraph({
        consequences: [{ title: "   ", description: "" }, null, 12],
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_EMPTY" });
    expect(
      mapGeneratedConsequencesToChronicleGraph({
        consequences: [],
      }),
    ).toEqual({ ok: false, code: "CHRONICLE_EMPTY" });
  });

  it("skips invalid items and still builds a graph from usable consequences", () => {
    const mapped = mapGeneratedConsequencesToChronicleGraph(
      {
        summary: "One usable ripple survives the noise.",
        consequences: [
          { title: "", description: "" },
          {
            title: "A usable debt",
            description: "The kin still ask for favors.",
            timeframe: "immediate",
            category: "social",
            trigger: "The scout talks.",
            affectedParties: ["the kin"],
          },
          "broken",
        ],
      },
      { decision },
    );

    expect(mapped.ok).toBe(true);
    if (!mapped.ok) {
      return;
    }
    expect(mapped.graph.nodes).toHaveLength(2);
    expect(mapped.graph.nodes[1]?.title).toBe("A usable debt");
  });
});
