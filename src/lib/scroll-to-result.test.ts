import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bringResultIntoView,
  prefersReducedMotion,
  shouldScrollToResult,
} from "@/lib/scroll-to-result";

describe("shouldScrollToResult", () => {
  it("scrolls only when the result start is outside the visible band", () => {
    expect(shouldScrollToResult({ top: 80, bottom: 400 }, 844)).toBe(false);
    expect(shouldScrollToResult({ top: -40, bottom: 200 }, 844)).toBe(true);
    expect(shouldScrollToResult({ top: 900, bottom: 1200 }, 844)).toBe(true);
    expect(shouldScrollToResult({ top: 20, bottom: 400 }, 844)).toBe(true);
    expect(shouldScrollToResult({ top: 80, bottom: 2000 }, 844)).toBe(false);
  });
});

describe("prefersReducedMotion", () => {
  it("detects reduced motion preferences", () => {
    expect(prefersReducedMotion({ matches: true })).toBe(true);
    expect(prefersReducedMotion({ matches: false })).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });
});

describe("bringResultIntoView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockElement(top: number) {
    return {
      getBoundingClientRect: () => ({
        top,
        bottom: top + 320,
        left: 0,
        right: 360,
        width: 360,
        height: 320,
        x: 0,
        y: top,
        toJSON() {
          return {};
        },
      }),
      scrollIntoView: vi.fn(),
      focus: vi.fn(),
    };
  }

  it("scrolls to start and focuses without extra browser scroll", () => {
    const element = mockElement(-100);
    vi.stubGlobal("window", {
      innerHeight: 844,
      matchMedia: () => ({ matches: false }),
    });

    bringResultIntoView(element as unknown as HTMLElement);

    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("does not scroll when the result top is already visible", () => {
    const element = mockElement(90);
    vi.stubGlobal("window", {
      innerHeight: 844,
      matchMedia: () => ({ matches: false }),
    });

    bringResultIntoView(element as unknown as HTMLElement);

    expect(element.scrollIntoView).not.toHaveBeenCalled();
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("uses instant scroll when reduced motion is preferred", () => {
    const element = mockElement(-80);
    vi.stubGlobal("window", {
      innerHeight: 844,
      matchMedia: () => ({ matches: true }),
    });

    bringResultIntoView(element as unknown as HTMLElement);

    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });
});
