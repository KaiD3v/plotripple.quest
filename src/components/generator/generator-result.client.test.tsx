/**
 * @vitest-environment jsdom
 */

import { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getExampleResult } from "@/components/generator/example-result";
import { GeneratorResult } from "@/components/generator/generator-result";
import { getDictionary } from "@/i18n/get-dictionary";
import type { GenerationResult } from "@/types/generator";

const result: GenerationResult = {
  summary: "The spared scout carries the party's warning into hostile halls.",
  consequences: [
    {
      title: "A rumor takes root",
      description: "By nightfall, taverns repeat a softer version of the warning.",
      timeframe: "immediate",
      category: "social",
      trigger: "Anyone asks why the scout returned alive.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A debt is named",
      description: "The scout's captain offers a narrow truce.",
      timeframe: "next_session",
      category: "political",
      trigger: "The party approaches the border forts again.",
      affectedParties: ["the captain"],
    },
    {
      title: "Maps are redrawn",
      description: "Merchants avoid the old road.",
      timeframe: "long_term",
      category: "economic",
      trigger: "Caravans hear that mercy changed the watch.",
      affectedParties: ["traders"],
    },
  ],
};

const dictionary = getDictionary("en");

function statusOf(host: HTMLElement) {
  return host.querySelector("#result-status")?.textContent ?? "";
}

function ResultHarness() {
  const [current, setCurrent] = useState<GenerationResult | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setPending(true)}>
        set pending
      </button>
      <button
        type="button"
        onClick={() => {
          setPending(false);
          setCurrent(result);
        }}
      >
        set ready
      </button>
      <GeneratorResult
        result={current}
        dictionary={dictionary}
        pending={pending}
        locale="en"
        onRegenerate={() => setCurrent(null)}
        onUseExample={() => undefined}
      />
    </div>
  );
}

const nextResult: GenerationResult = {
  ...result,
  summary: "A later mercy redraws the border in a different ink.",
};

function CopyHarness() {
  const [current, setCurrent] = useState<GenerationResult | null>(result);

  return (
    <div>
      <button type="button" onClick={() => setCurrent(nextResult)}>
        load next
      </button>
      <GeneratorResult
        result={current}
        dictionary={dictionary}
        pending={false}
        locale="en"
        onRegenerate={() => setCurrent(null)}
        onUseExample={() => undefined}
      />
    </div>
  );
}

describe("GeneratorResult live status", () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("announces pending and ready, then stays quiet when returning to the example", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<ResultHarness />);
    });

    expect(host.textContent).toContain(dictionary.example.label);
    expect(host.textContent).toContain(getExampleResult("en").decision);
    expect(statusOf(host)).toBe("");
    expect(host.querySelector("section")?.getAttribute("aria-live")).toBeNull();
    expect(host.querySelector("#result-status")?.getAttribute("aria-live")).toBeNull();
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);

    const pendingButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === "set pending",
    );
    await act(async () => {
      pendingButton?.click();
    });

    expect(host.querySelector("section")?.getAttribute("aria-busy")).toBe("true");
    expect(statusOf(host)).toBe(dictionary.generator.generating);
    expect(host.textContent).not.toContain(dictionary.example.label);

    const readyButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === "set ready",
    );
    await act(async () => {
      readyButton?.click();
    });

    expect(statusOf(host)).toBe(dictionary.result.ready);
    expect(host.textContent).toContain(result.summary);
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);

    const regenerate = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(dictionary.result.regenerate),
    );
    await act(async () => {
      regenerate?.click();
    });

    expect(host.textContent).toContain(dictionary.example.label);
    expect(host.textContent).toContain(getExampleResult("en").decision);
    expect(statusOf(host)).toBe("");
    expect(statusOf(host)).not.toContain(getExampleResult("en").decision);
    expect(statusOf(host)).not.toContain(dictionary.result.ready);
    expect(host.querySelector("section")?.getAttribute("aria-live")).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps copy failure attached to the result where it happened", async () => {
    const writeText = vi.fn(() => Promise.reject(new Error("denied")));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<CopyHarness />);
    });

    expect(host.textContent).toContain(result.summary);

    const copyButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(dictionary.result.copy),
    );
    await act(async () => {
      copyButton?.click();
      await Promise.resolve();
    });

    expect(host.textContent).toContain(dictionary.result.copyFailed);
    expect(statusOf(host)).toBe(dictionary.result.copyFailed);

    const regenerate = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(dictionary.result.regenerate),
    );
    await act(async () => {
      regenerate?.click();
    });

    expect(host.textContent).toContain(dictionary.example.label);
    expect(host.textContent).toContain(getExampleResult("en").decision);
    expect(host.textContent).not.toContain(dictionary.result.copyFailed);
    expect(statusOf(host)).toBe("");

    const loadNext = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === "load next",
    );
    await act(async () => {
      loadNext?.click();
    });

    expect(host.textContent).toContain(nextResult.summary);
    expect(host.textContent).toContain(dictionary.result.copy);
    expect(host.textContent).not.toContain(dictionary.result.copied);
    expect(host.textContent).not.toContain(dictionary.result.copyFailed);
    expect(statusOf(host)).toBe(dictionary.result.ready);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("emits result_copy with only locale after a successful copy", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<CopyHarness />);
    });

    const copyButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(dictionary.result.copy),
    );
    await act(async () => {
      copyButton?.click();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "result_copy", { locale: "en" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain(result.summary);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("does not emit result_copy when copying fails", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const writeText = vi.fn(() => Promise.reject(new Error("denied")));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<CopyHarness />);
    });

    const copyButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(dictionary.result.copy),
    );
    await act(async () => {
      copyButton?.click();
      await Promise.resolve();
    });

    expect(host.textContent).toContain(dictionary.result.copyFailed);
    expect(gtag).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
