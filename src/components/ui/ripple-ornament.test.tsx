import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RippleOrnament } from "@/components/ui/ripple-ornament";

describe("RippleOrnament", () => {
  it("is a decorative svg hidden from assistive tech", () => {
    const html = renderToStaticMarkup(<RippleOrnament />);
    expect(html).toContain("<svg");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });
});
