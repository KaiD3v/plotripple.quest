import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_ASSETS, BRAND_OPEN_GRAPH } from "@/lib/brand";

describe("brand kit assets", () => {
  it("keeps every referenced file inside public/branding/plotripple or public root", () => {
    for (const rel of Object.values(BRAND_ASSETS)) {
      const file = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
      expect(existsSync(file), rel).toBe(true);
    }
  });

  it("uses the kit open graph artwork with explicit dimensions", () => {
    expect(BRAND_OPEN_GRAPH.url).toBe(
      "/branding/plotripple/open-graph-1200x630.jpg",
    );
    expect(BRAND_OPEN_GRAPH.width).toBe(1200);
    expect(BRAND_OPEN_GRAPH.height).toBe(630);
  });
});
