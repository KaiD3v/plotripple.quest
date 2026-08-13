import { describe, expect, it } from "vitest";
import {
  prefersReducedMotion,
  shouldScrollToResult,
} from "@/lib/scroll-to-result";

describe("shouldScrollToResult", () => {
  it("scrolls only when the result start is outside the viewport", () => {
    expect(shouldScrollToResult({ top: 80, bottom: 400 }, 844)).toBe(false);
    expect(shouldScrollToResult({ top: -40, bottom: 200 }, 844)).toBe(true);
    expect(shouldScrollToResult({ top: 900, bottom: 1200 }, 844)).toBe(true);
  });
});

describe("prefersReducedMotion", () => {
  it("detects reduced motion preferences", () => {
    expect(prefersReducedMotion({ matches: true })).toBe(true);
    expect(prefersReducedMotion({ matches: false })).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });
});
