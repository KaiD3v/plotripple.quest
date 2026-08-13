import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdSlot } from "@/components/ads/ad-slot";

describe("AdSlot", () => {
  it("reserves space and labels the placeholder", () => {
    const html = renderToStaticMarkup(
      <AdSlot label="Advertisement" variant="leaderboard" />,
    );

    expect(html).toContain("Advertisement");
    expect(html).toContain('aria-label="Advertisement"');
    expect(html).toContain("min-h-[90px]");
    expect(html).toContain("ad-frame");
    expect(html).not.toContain("folio");
  });
});
