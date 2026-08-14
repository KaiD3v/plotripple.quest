/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/canvas/demo",
  useSearchParams: () => new URLSearchParams("fixture=25"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: { preventDefault: () => void }) => void;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

import { LanguageSwitcher } from "@/components/ui/language-switcher";

function triggerOf(host: HTMLElement) {
  return host.querySelector<HTMLButtonElement>("button[aria-haspopup]");
}

function menuOf(host: HTMLElement) {
  return host.querySelector<HTMLElement>('[role="menu"]');
}

async function mountSwitcher(search?: string) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <LanguageSwitcher locale="en" label="Language" search={search} />,
    );
  });
  return { host, root };
}

async function unmount(root: Root, host: HTMLElement) {
  await act(async () => {
    root.unmount();
  });
  host.remove();
}

describe("LanguageSwitcher", () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders a compact closed trigger for the current language", () => {
    const html = renderToStaticMarkup(
      <LanguageSwitcher locale="en" label="Language" />,
    );

    expect(html).toContain("English");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("min-h-11");
    expect(html).toContain("min-w-11");
    expect(html).toContain("lang-switch-trigger");
    expect(html).toContain("lang-switch-sigil");
    expect(html).toContain('aria-hidden="true"');
  });

  it("keeps locale links in the document so the current route can be swapped", () => {
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

  it("opens the menu from the trigger and marks the active locale", async () => {
    const { host, root } = await mountSwitcher("fixture=25");
    const user = userEvent.setup();
    const trigger = triggerOf(host);

    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(menuOf(host)?.hasAttribute("hidden")).toBe(true);

    await user.click(trigger!);

    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    const menu = menuOf(host);
    expect(menu?.hasAttribute("hidden")).toBe(false);

    const portuguese = host.querySelector<HTMLAnchorElement>(
      'a[href="/pt-br/canvas/demo?fixture=25"]',
    );
    const english = host.querySelector<HTMLAnchorElement>(
      'a[href="/en/canvas/demo?fixture=25"]',
    );
    expect(portuguese).toBeTruthy();
    expect(english?.getAttribute("aria-current")).toBe("true");
    expect(english?.className).toContain("is-active");
    expect(english?.className).toContain("text-gold");
    expect(english?.innerHTML).toContain("lang-switch-check");
    expect(portuguese?.className).not.toContain("text-gold");
    expect(portuguese?.innerHTML).not.toContain("lang-switch-check");
    expect(english?.className).toContain("min-h-11");
    expect(portuguese?.className).toContain("min-h-11");

    await unmount(root, host);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const { host, root } = await mountSwitcher();
    const user = userEvent.setup();
    const trigger = triggerOf(host)!;

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await user.keyboard("{Escape}");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menuOf(host)?.hasAttribute("hidden")).toBe(true);
    expect(document.activeElement).toBe(trigger);

    await unmount(root, host);
  });

  it("closes when clicking outside the control", async () => {
    const { host, root } = await mountSwitcher();
    const user = userEvent.setup();
    const trigger = triggerOf(host)!;

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await user.click(document.body);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menuOf(host)?.hasAttribute("hidden")).toBe(true);

    await unmount(root, host);
  });

  it("closes after a locale is selected", async () => {
    const { host, root } = await mountSwitcher("fixture=25");
    const user = userEvent.setup();

    await user.click(triggerOf(host)!);
    await user.click(
      host.querySelector<HTMLAnchorElement>(
        'a[href="/pt-br/canvas/demo?fixture=25"]',
      )!,
    );

    expect(triggerOf(host)?.getAttribute("aria-expanded")).toBe("false");
    expect(menuOf(host)?.hasAttribute("hidden")).toBe(true);

    await unmount(root, host);
  });

  it("emits language_changed once when switching locale", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { host, root } = await mountSwitcher("fixture=25");
    const user = userEvent.setup();

    await user.click(triggerOf(host)!);
    await user.click(
      host.querySelector<HTMLAnchorElement>(
        'a[href="/pt-br/canvas/demo?fixture=25"]',
      )!,
    );

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "language_changed", {
      language: "pt-br",
      locale: "pt-br",
    });
    expect(
      gtag.mock.calls.some((call) => call[1] === "language_change"),
    ).toBe(false);

    await unmount(root, host);
  });

  it("opens from the keyboard and moves between options", async () => {
    const { host, root } = await mountSwitcher();
    const user = userEvent.setup();
    const trigger = triggerOf(host)!;

    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.getAttribute("role")).toBe("menuitem");
    expect(document.activeElement?.textContent).toContain("English");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain("Português");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain("English");

    await unmount(root, host);
  });
});
