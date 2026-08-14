import { describe, expect, it } from "vitest";
import { formatLocalChronicleDate } from "@/lib/format-local-date";

describe("formatLocalChronicleDate", () => {
  it("formats English and Portuguese dates from the same UTC timestamp", () => {
    const iso = "2026-08-13T12:00:00.000Z";
    expect(formatLocalChronicleDate(iso, "en")).toBe("Aug 13, 2026");
    expect(formatLocalChronicleDate(iso, "pt-br")).toBe("13 de ago. de 2026");
  });

  it("stays stable across SSR and client by formatting in UTC", () => {
    const iso = "2026-08-13T23:30:00.000Z";
    expect(formatLocalChronicleDate(iso, "en")).toBe("Aug 13, 2026");
    expect(formatLocalChronicleDate(iso, "pt-br")).toBe("13 de ago. de 2026");
  });

  it("returns a localized fallback for invalid dates", () => {
    expect(formatLocalChronicleDate("not-a-date", "en", "Unknown date")).toBe(
      "Unknown date",
    );
    expect(
      formatLocalChronicleDate("not-a-date", "pt-br", "Data desconhecida"),
    ).toBe("Data desconhecida");
  });
});
