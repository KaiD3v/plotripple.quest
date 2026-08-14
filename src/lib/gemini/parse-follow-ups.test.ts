import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { parseFollowUpGenerationResult } from "@/lib/gemini/parse-follow-ups";

const valid = {
  followUps: [
    {
      title: "A quiet ledger opens",
      description: "Kin start recording favors.",
    },
    {
      title: "A rival offers shelter",
      description: "A border house invites the party as witnesses.",
    },
  ],
};

describe("parseFollowUpGenerationResult", () => {
  it("accepts a valid structured payload", () => {
    expect(parseFollowUpGenerationResult(JSON.stringify(valid))).toEqual(valid);
  });

  it("rejects invalid JSON and HTML", () => {
    expect(() => parseFollowUpGenerationResult("not-json")).toThrow(AppError);
    expect(() =>
      parseFollowUpGenerationResult(
        JSON.stringify({
          followUps: [
            valid.followUps[0],
            { title: "Banner", description: "A <script>alert(1)</script> rises." },
          ],
        }),
      ),
    ).toThrow(AppError);
  });
});
