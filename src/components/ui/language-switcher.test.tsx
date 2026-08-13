import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/about",
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
    expect(html).toContain('href="/pt-br/about"');
    expect(html).toContain('href="/en/about"');
    expect(html).toContain("Português");
    expect(html).toContain("English");
  });
});
