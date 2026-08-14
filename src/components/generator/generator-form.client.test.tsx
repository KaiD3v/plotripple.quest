/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ADVANCED_OPTIONS_ID, PRESET_SUMMARY_ID } from "@/components/generator/preset-summary";
import { GeneratorForm } from "@/components/generator/generator-form";
import { getDictionary } from "@/i18n/get-dictionary";
import type { GeneratorInputParsed } from "@/schemas/generator";

const initialValues: GeneratorInputParsed = {
  eventDescription: "The party spared the captured scout and sent them home.",
  tone: "mysterious",
  intensity: "moderate",
  setting: "fantasy",
  timeframe: "mixed",
  count: 3,
  locale: "en",
};

function Harness({
  dictionary = getDictionary("en"),
  pending = false,
  onSubmit = () => undefined,
  values: startingValues = initialValues,
}: {
  dictionary?: ReturnType<typeof getDictionary>;
  pending?: boolean;
  onSubmit?: () => void;
  values?: GeneratorInputParsed;
}) {
  const [values, setValues] = useState(startingValues);
  return (
    <GeneratorForm
      dictionary={dictionary}
      values={values}
      errors={{}}
      pending={pending}
      onChange={setValues}
      onSubmit={onSubmit}
    />
  );
}

function toggleOf(host: HTMLElement) {
  return host.querySelector<HTMLButtonElement>(
    `button[aria-controls="${ADVANCED_OPTIONS_ID}"]`,
  );
}

function panelOf(host: HTMLElement) {
  return host.querySelector<HTMLElement>(`#${ADVANCED_OPTIONS_ID}`);
}

async function mountForm(node: ReactNode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(node);
  });
  return { host, root };
}

async function unmount(root: Root, host: HTMLElement) {
  await act(async () => {
    root.unmount();
  });
  host.remove();
}

describe("GeneratorForm progressive customization", () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    window.gtag = vi.fn();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("toggles the advanced options with mouse and keyboard", async () => {
    const { host, root } = await mountForm(<Harness />);
    const user = userEvent.setup();
    const toggle = toggleOf(host);
    const panel = panelOf(host);

    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.getAttribute("aria-describedby")).toBe(PRESET_SUMMARY_ID);
    expect(panel?.hasAttribute("hidden")).toBe(true);

    await user.click(toggle!);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.hasAttribute("hidden")).toBe(false);
    expect(toggle?.textContent).toContain(
      getDictionary("en").generator.hideCustomization,
    );

    await user.click(toggle!);
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(panel?.hasAttribute("hidden")).toBe(true);

    toggle?.focus();
    await user.keyboard("{Enter}");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");

    await user.keyboard(" ");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");

    await unmount(root, host);
  });

  it("updates the summary when an option changes and keeps the value after collapse", async () => {
    const { host, root } = await mountForm(<Harness />);
    const user = userEvent.setup();

    await user.click(toggleOf(host)!);
    await user.click(host.querySelector("#tone-dark")!);

    expect(host.textContent).toContain(
      "Dark · Moderate · Fantasy · Mixed · 3 consequences",
    );

    await user.click(toggleOf(host)!);
    expect(panelOf(host)?.hasAttribute("hidden")).toBe(true);
    expect(host.textContent).toContain(
      "Dark · Moderate · Fantasy · Mixed · 3 consequences",
    );

    await user.click(toggleOf(host)!);
    expect(host.querySelector<HTMLInputElement>("#tone-dark")?.checked).toBe(
      true,
    );
    expect(
      host.querySelector<HTMLInputElement>("#tone-mysterious")?.checked,
    ).toBe(false);

    await unmount(root, host);
  });

  it("fires advanced_options_opened only when the panel opens", async () => {
    const { host, root } = await mountForm(<Harness />);
    const user = userEvent.setup();
    const gtag = window.gtag as ReturnType<typeof vi.fn>;

    await user.click(toggleOf(host)!);
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "advanced_options_opened",
      { locale: "en" },
    );

    await user.click(toggleOf(host)!);
    await user.click(toggleOf(host)!);
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag.mock.calls.every((call) => call[1] === "advanced_options_opened")).toBe(
      true,
    );

    await unmount(root, host);
  });

  it("includes the active locale on advanced_options_opened", async () => {
    const { host, root } = await mountForm(
      <Harness
        dictionary={getDictionary("pt-br")}
        values={{ ...initialValues, locale: "pt-br" }}
      />,
    );
    const user = userEvent.setup();
    const gtag = window.gtag as ReturnType<typeof vi.fn>;

    await user.click(toggleOf(host)!);
    expect(gtag).toHaveBeenCalledWith("event", "advanced_options_opened", {
      locale: "pt-br",
    });

    await unmount(root, host);
  });
});
