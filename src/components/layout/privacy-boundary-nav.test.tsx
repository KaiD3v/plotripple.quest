import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

let currentPath = "/en";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("next/image", () => ({
  default: function Image({
    alt,
  }: {
    alt?: string;
    [key: string]: unknown;
  }) {
    return <span data-image-alt={alt ?? ""} />;
  },
}));

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getDictionary } from "@/i18n/get-dictionary";

const dictionary = getDictionary("en");

function usesNextLink(html: string, href: string) {
  return (
    html.includes(`href="${href}" data-next-link=""`) ||
    html.includes(`data-next-link="" href="${href}"`)
  );
}

describe("privacy navigation boundary", () => {
  it("uses a full document load from home to privacy, not from home to about", () => {
    currentPath = "/en";
    const header = renderToStaticMarkup(
      <Header locale="en" dictionary={dictionary} />,
    );
    const footer = renderToStaticMarkup(
      <Footer locale="en" dictionary={dictionary} />,
    );
    const html = header + footer;

    expect(html).toContain('href="/en/privacy"');
    expect(usesNextLink(html, "/en/privacy")).toBe(false);
    expect(usesNextLink(html, "/en/about")).toBe(true);
    expect(usesNextLink(html, "/en")).toBe(true);
  });

  it("uses a full document load from privacy to generator and about", () => {
    currentPath = "/en/privacy";
    const header = renderToStaticMarkup(
      <Header locale="en" dictionary={dictionary} />,
    );
    const footer = renderToStaticMarkup(
      <Footer locale="en" dictionary={dictionary} />,
    );
    const html = header + footer;

    expect(usesNextLink(html, "/en")).toBe(false);
    expect(usesNextLink(html, "/en/about")).toBe(false);
    expect(usesNextLink(html, "/en/privacy")).toBe(true);
    expect(usesNextLink(html, "/pt-br/privacy")).toBe(true);
  });
});
