import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

let currentPath = "/en";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
}));

vi.mock("next/link", () => ({
  default: function NextLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} data-next-link="" {...props}>
        {children}
      </a>
    );
  },
}));

import { PrivacyBoundaryLink } from "@/components/ui/privacy-boundary-link";

describe("PrivacyBoundaryLink", () => {
  it("uses a native anchor from home to privacy", () => {
    currentPath = "/en";
    const html = renderToStaticMarkup(
      <PrivacyBoundaryLink href="/en/privacy">Privacy</PrivacyBoundaryLink>,
    );

    expect(html).toContain('href="/en/privacy"');
    expect(html).toContain("Privacy");
    expect(html).not.toContain("data-next-link");
  });

  it("uses a native anchor from privacy to home", () => {
    currentPath = "/en/privacy";
    const html = renderToStaticMarkup(
      <PrivacyBoundaryLink href="/en">Generator</PrivacyBoundaryLink>,
    );

    expect(html).toContain('href="/en"');
    expect(html).not.toContain("data-next-link");
  });

  it("keeps next/link between localized privacy pages", () => {
    currentPath = "/en/privacy";
    const html = renderToStaticMarkup(
      <PrivacyBoundaryLink href="/pt-br/privacy">Português</PrivacyBoundaryLink>,
    );

    expect(html).toContain('href="/pt-br/privacy"');
    expect(html).toContain("data-next-link");
  });

  it("keeps next/link between non-privacy routes", () => {
    currentPath = "/en";
    const html = renderToStaticMarkup(
      <PrivacyBoundaryLink href="/en/about">About</PrivacyBoundaryLink>,
    );

    expect(html).toContain('href="/en/about"');
    expect(html).toContain("data-next-link");
  });
});
