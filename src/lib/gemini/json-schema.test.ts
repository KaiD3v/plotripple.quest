import { describe, expect, it } from "vitest";
import { generationJsonSchemaForRequest } from "@/lib/gemini/json-schema";

describe("generationJsonSchemaForRequest", () => {
  it("restricts timeframe enum to long_term when that filter is selected", () => {
    const schema = generationJsonSchemaForRequest(3, "long_term");
    expect(schema.properties.consequences.items.properties.timeframe.enum).toEqual([
      "long_term",
    ]);
    expect(
      schema.properties.consequences.items.properties.timeframe.description,
    ).toContain("long_term");
  });

  it("keeps all periods available for mixed", () => {
    const schema = generationJsonSchemaForRequest(5, "mixed");
    expect(schema.properties.consequences.items.properties.timeframe.enum).toEqual([
      "immediate",
      "next_session",
      "long_term",
    ]);
    expect(
      schema.properties.consequences.items.properties.timeframe.description,
    ).toContain("at least one");
  });
});
