import { describe, expect, it } from "vitest";

describe("route modules compile", () => {
  it("loads locale pages and AI API routes", async () => {
    await expect(import("@/app/[locale]/page")).resolves.toBeTruthy();
    await expect(import("@/app/api/generate/route")).resolves.toBeTruthy();
    await expect(import("@/app/ads.txt/route")).resolves.toBeTruthy();
  });
});
