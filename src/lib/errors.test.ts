import { describe, expect, it } from "vitest";
import { publicErrorBody, toAppError } from "@/lib/errors";

describe("toAppError", () => {
  it("maps provider 404 to AI_UNAVAILABLE instead of INTERNAL_ERROR", () => {
    const error = toAppError(Object.assign(new Error("NOT_FOUND"), { status: 404 }));
    expect(error.code).toBe("AI_UNAVAILABLE");
    expect(error.status).toBe(503);
  });

  it("maps 429 to RATE_LIMITED", () => {
    const error = toAppError(Object.assign(new Error("quota"), { status: 429 }));
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.status).toBe(429);
  });

  it("maps timeouts to AI_UNAVAILABLE with 504", () => {
    const error = toAppError(Object.assign(new Error("aborted"), { name: "AbortError" }));
    expect(error.code).toBe("AI_UNAVAILABLE");
    expect(error.status).toBe(504);
  });

  it("never returns internal details in the public body", () => {
    const error = toAppError(new Error("GEMINI_API_KEY leaked"));
    expect(publicErrorBody(error)).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
  });
});
