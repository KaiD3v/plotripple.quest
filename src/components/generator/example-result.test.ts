import { describe, expect, it } from "vitest";
import { getExampleResult } from "@/components/generator/example-result";

describe("getExampleResult", () => {
  it("returns typed Portuguese sample copy without generation fields", () => {
    const example = getExampleResult("pt-br");

    expect(example.decision).toBe(
      "O grupo libertou uma criatura antiga presa sob o templo para impedir que a cidade fosse destruída.",
    );
    expect(example.summary).toBe(
      "A cidade sobreviveu, mas agora precisa conviver com a entidade que tornou sua salvação possível.",
    );
    expect(example.consequences).toEqual([
      { timeframe: "immediate", title: "O templo perde sua autoridade" },
      { timeframe: "next_session", title: "A criatura exige o primeiro pagamento" },
      { timeframe: "long_term", title: "A cidade passa a cultuar sua salvadora proibida" },
    ]);
    expect(example).not.toHaveProperty("category");
    expect(JSON.stringify(example)).not.toContain("trigger");
    expect(JSON.stringify(example)).not.toContain("affectedParties");
  });

  it("returns a natural English equivalent of the same story", () => {
    const example = getExampleResult("en");

    expect(example.decision).toBe(
      "The party freed an ancient creature trapped beneath the temple to keep the city from being destroyed.",
    );
    expect(example.summary).toBe(
      "The city survived, but now it has to live with the entity that made its salvation possible.",
    );
    expect(example.consequences.map((item) => item.timeframe)).toEqual([
      "immediate",
      "next_session",
      "long_term",
    ]);
    expect(example.consequences[0]?.title).toBe("The temple loses its authority");
    expect(example.consequences[1]?.title).toBe(
      "The creature demands the first payment",
    );
    expect(example.consequences[2]?.title).toBe(
      "The city begins to worship its forbidden savior",
    );
  });
});
