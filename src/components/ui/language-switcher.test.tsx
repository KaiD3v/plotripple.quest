import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/canvas/demo",
  useSearchParams: () => new URLSearchParams("fixture=25"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { LanguageSwitcher } from "@/components/ui/language-switcher";

describe("LanguageSwitcher", () => {
  it("links to the equivalent path in the other locale", () => {
    const html = renderToStaticMarkup(
      <LanguageSwitcher locale="en" label="Language" />,
    );
    expect(html).toContain('href="/pt-br/canvas/demo"');
    expect(html).toContain('href="/en/canvas/demo"');
    expect(html).toContain("Português");
    expect(html).toContain("English");
  });

  it("keeps the demo fixture when search is provided", () => {
    const html = renderToStaticMarkup(
      <LanguageSwitcher locale="en" label="Language" search="fixture=25" />,
    );
    expect(html).toContain('href="/pt-br/canvas/demo?fixture=25"');
    expect(html).toContain('href="/en/canvas/demo?fixture=25"');
  });
});
