import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("security headers", () => {
  it("keeps non-CSP headers and does not send a Content-Security-Policy allowlist", async () => {
    const headers = await nextConfig.headers?.();
    const values = Object.fromEntries(
      (headers ?? []).flatMap((entry) =>
        entry.headers.map((header) => [header.key, header.value]),
      ),
    );

    expect(values["X-Content-Type-Options"]).toBe("nosniff");
    expect(values["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(values["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(values["Permissions-Policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(values["Content-Security-Policy"]).toBeUndefined();
  });
});
