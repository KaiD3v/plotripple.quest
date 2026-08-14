import { describe, expect, it } from "vitest";
import { adsTxtResponse, buildAdsTxt } from "@/app/ads.txt/route";

describe("buildAdsTxt", () => {
  it("publishes the Google DIRECT record from a validated Publisher ID", () => {
    expect(buildAdsTxt("ca-pub-1234567890123456")).toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
    );
  });
});

describe("GET /ads.txt", () => {
  it("returns text/plain when a valid Publisher ID is configured", async () => {
    const response = adsTxtResponse({
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-1234567890123456",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    await expect(response.text()).resolves.toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
    );
  });

  it("returns 404 without an example record when the ID is missing or invalid", async () => {
    const missing = adsTxtResponse({});
    const invalid = adsTxtResponse({
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-123",
    });

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(404);
    await expect(missing.text()).resolves.not.toContain("google.com");
    await expect(invalid.text()).resolves.not.toContain("pub-");
  });
});
