import { describe, expect, it } from "vitest";
import {
  allowedConsequenceTimeframes,
  consequenceTimeframesSatisfyRequest,
} from "@/lib/consequence-timeframes";

const immediate = { timeframe: "immediate" as const };
const nextSession = { timeframe: "next_session" as const };
const longTerm = { timeframe: "long_term" as const };

describe("allowedConsequenceTimeframes", () => {
  it("limits a specific filter to that period only", () => {
    expect(allowedConsequenceTimeframes("immediate")).toEqual(["immediate"]);
    expect(allowedConsequenceTimeframes("next_session")).toEqual([
      "next_session",
    ]);
    expect(allowedConsequenceTimeframes("long_term")).toEqual(["long_term"]);
  });

  it("allows all periods when mixed", () => {
    expect(allowedConsequenceTimeframes("mixed")).toEqual([
      "immediate",
      "next_session",
      "long_term",
    ]);
  });
});

describe("consequenceTimeframesSatisfyRequest", () => {
  it("requires every consequence to match a specific timeframe", () => {
    expect(
      consequenceTimeframesSatisfyRequest("long_term", [
        longTerm,
        longTerm,
        longTerm,
      ]),
    ).toBe(true);
    expect(
      consequenceTimeframesSatisfyRequest("long_term", [
        immediate,
        nextSession,
        longTerm,
      ]),
    ).toBe(false);
    expect(
      consequenceTimeframesSatisfyRequest("immediate", [
        immediate,
        immediate,
        immediate,
      ]),
    ).toBe(true);
    expect(
      consequenceTimeframesSatisfyRequest("next_session", [
        nextSession,
        longTerm,
        nextSession,
      ]),
    ).toBe(false);
  });

  it("requires one of each period for mixed with 3 consequences, regardless of order", () => {
    expect(
      consequenceTimeframesSatisfyRequest("mixed", [
        longTerm,
        immediate,
        nextSession,
      ]),
    ).toBe(true);
    expect(
      consequenceTimeframesSatisfyRequest("mixed", [
        immediate,
        immediate,
        longTerm,
      ]),
    ).toBe(false);
    expect(
      consequenceTimeframesSatisfyRequest("mixed", [
        nextSession,
        nextSession,
        nextSession,
      ]),
    ).toBe(false);
  });

  it("requires at least one of each period for mixed with 5 consequences", () => {
    expect(
      consequenceTimeframesSatisfyRequest("mixed", [
        immediate,
        nextSession,
        longTerm,
        longTerm,
        immediate,
      ]),
    ).toBe(true);
    expect(
      consequenceTimeframesSatisfyRequest("mixed", [
        immediate,
        immediate,
        nextSession,
        nextSession,
        nextSession,
      ]),
    ).toBe(false);
  });
});
