import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stub for next/image
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  ),
}));

import { BrandLockup, BrandMark } from "@/components/ui/brand-mark";
import { BRAND_ASSETS } from "@/lib/brand";

describe("BrandMark", () => {
  it("renders the transparent kit symbol at a fixed size", () => {
    const html = renderToStaticMarkup(<BrandMark className="h-8 w-8" />);

    expect(html).toContain(BRAND_ASSETS.symbol);
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt=""');
  });
});

describe("BrandLockup", () => {
  it("renders the horizontal wordmark with an accessible name", () => {
    const html = renderToStaticMarkup(<BrandLockup />);

    expect(html).toContain(BRAND_ASSETS.lockup);
    expect(html).toContain('alt="PlotRipple"');
    expect(html).toContain('width="200"');
    expect(html).toContain('height="50"');
  });
});
