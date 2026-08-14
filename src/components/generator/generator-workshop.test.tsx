/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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

import { ADVANCED_OPTIONS_ID } from "@/components/generator/preset-summary";
import { getExampleResult } from "@/components/generator/example-result";
import { GeneratorWorkshop } from "@/components/generator/generator-workshop";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  CHRONICLE_LIBRARY_STORAGE_KEY,
  listStoredChronicles,
  resetChronicleLibraryCache,
} from "@/lib/chronicle/library-repository";
import { resetRecentDeviceCache } from "@/lib/chronicle/recent-device";
import {
  CHRONICLE_STORAGE_KEY,
  resetChronicleSnapshotCache,
} from "@/lib/chronicle/session-repository";
import { resetHistorySnapshotCache } from "@/lib/local-history";
import type { GenerationResult } from "@/types/generator";

const decision =
  "The party spared the captured scout and sent them home with a warning.";

const result: GenerationResult = {
  summary: "Mercy leaves a trail of obligations.",
  consequences: [
    {
      title: "A whispered debt",
      description: "The scout’s kin begin asking quiet favors.",
      timeframe: "immediate",
      category: "social",
      trigger: "The scout reports who showed mercy.",
      affectedParties: ["the scout’s kin"],
    },
    {
      title: "Standing orders change",
      description: "The watch is told not to take prisoners.",
      timeframe: "next_session",
      category: "political",
      trigger: "The report reaches the captain.",
      affectedParties: ["the garrison"],
    },
    {
      title: "A rumor becomes a banner",
      description: "Pilgrims start using the party’s name.",
      timeframe: "long_term",
      category: "supernatural",
      trigger: "A chaplain writes the story down.",
      affectedParties: ["border pilgrims"],
    },
  ],
};

const dictionary = getDictionary("en");
const dictionaryPt = getDictionary("pt-br");

function mockViewportApis() {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

async function renderTree(host: HTMLElement, node: ReactNode): Promise<Root> {
  const root = createRoot(host);
  await act(async () => {
    root.render(node);
  });
  return root;
}

async function fillAndSubmit(host: HTMLElement, text = decision) {
  const textarea = host.querySelector(
    "#event-description",
  ) as HTMLTextAreaElement | null;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(textarea, text);
    textarea?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    host.querySelector("form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
  });
  return textarea;
}

beforeEach(() => {
  mockViewportApis();
  resetChronicleSnapshotCache();
  resetChronicleLibraryCache();
  resetRecentDeviceCache();
  resetHistorySnapshotCache();
  sessionStorage.clear();
  localStorage.clear();
  push.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GeneratorWorkshop generation review flow", () => {
  it("shows consequences on success without navigating", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >;
      const captchaTokenField = ["turn", "stile", "Token"].join("");
      expect(body).not.toHaveProperty(captchaTokenField);
      return {
        ok: true,
        json: async () => result,
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    expect(host.textContent).toContain(dictionary.example.label);
    await fillAndSubmit(host);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(host.textContent).toContain(result.summary);
    expect(host.textContent).toContain("3 consequences");
    for (const consequence of result.consequences) {
      expect(host.textContent).toContain(consequence.title);
      expect(host.textContent).toContain(consequence.description);
    }
    expect(host.textContent).not.toContain(dictionary.result.empty);
    expect(host.textContent).not.toContain(dictionary.example.label);
    expect(host.querySelector("#event-description")).toBeTruthy();
    expect(host.innerHTML.toLowerCase()).not.toContain(
      ["turn", "stile"].join(""),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps the form filled and previous result when generation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          error: { code: "AI_UNAVAILABLE", message: "down" },
        }),
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const textarea = await fillAndSubmit(host);
    expect(textarea?.value).toBe(decision);
    expect(host.textContent).toContain(dictionary.errors.AI_UNAVAILABLE);
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CHRONICLE_STORAGE_KEY)).toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("clears only the result and focuses the decision on generate again", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => result,
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const textarea = await fillAndSubmit(host);
    const libraryBefore = localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY);
    expect(host.textContent).toContain(result.summary);

    const again = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes(dictionary.result.regenerate),
    );
    await act(async () => {
      again?.click();
    });

    expect(host.textContent).toContain(dictionary.example.label);
    expect(host.querySelector(".folio-summary")).toBeNull();
    expect(textarea?.value).toBe(decision);
    expect(document.activeElement).toBe(textarea);
    expect(host.querySelector("#result-status")?.textContent).toBe("");
    expect(host.querySelector("section")?.getAttribute("aria-live")).toBeNull();
    expect(localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toBe(
      libraryBefore,
    );
    expect(listStoredChronicles()).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("preserves locale when exploring the map and does not call Gemini again", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => result,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="pt-br" dictionary={dictionaryPt} />,
    );

    await fillAndSubmit(host);
    expect(push).not.toHaveBeenCalled();
    expect(host.textContent).toContain(dictionaryPt.result.exploreMap);

    const explore = Array.from(host.querySelectorAll("button")).find(
      (button) =>
        button.textContent?.includes(dictionaryPt.result.exploreMap),
    );
    const libraryBefore = localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY);
    await act(async () => {
      explore?.click();
      explore?.click();
    });

    expect(push).toHaveBeenCalledWith("/pt-br/canvas");
    expect(push.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toBe(
      libraryBefore,
    );
    expect(listStoredChronicles()).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps a single library entry after generate, explore, and return", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => result,
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    await fillAndSubmit(host);
    const createdAt = JSON.parse(
      localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}",
    ).chronicles?.[0]?.createdAt as string | undefined;

    const explore = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes(dictionary.result.exploreMap),
    );
    await act(async () => {
      explore?.click();
    });

    expect(listStoredChronicles()).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}")
        .chronicles?.[0]?.createdAt,
    ).toBe(createdAt);
    expect(host.textContent).toMatch(/Recent on this device|Mercy|whispered/i);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("GeneratorWorkshop progressive generation", () => {
  it("submits the current defaults while customization stays collapsed", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >;
      expect(body).toMatchObject({
        eventDescription: decision,
        tone: "mysterious",
        intensity: "moderate",
        setting: "fantasy",
        timeframe: "mixed",
        count: 3,
        locale: "en",
      });
      return { ok: true, json: async () => result };
    });
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const toggle = host.querySelector<HTMLButtonElement>(
      `button[aria-controls="${ADVANCED_OPTIONS_ID}"]`,
    );
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    await fillAndSubmit(host);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(
      host.querySelector(`#${ADVANCED_OPTIONS_ID}`)?.hasAttribute("hidden"),
    ).toBe(true);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("submits customized choices without auto-closing the panel", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >;
      expect(body).toMatchObject({
        tone: "dark",
        intensity: "severe",
        setting: "horror",
        timeframe: "immediate",
        count: 5,
        locale: "en",
      });
      return { ok: true, json: async () => result };
    });
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const toggle = host.querySelector<HTMLButtonElement>(
      `button[aria-controls="${ADVANCED_OPTIONS_ID}"]`,
    );
    await act(async () => {
      toggle?.click();
    });
    await act(async () => {
      host.querySelector<HTMLInputElement>("#tone-dark")?.click();
      host.querySelector<HTMLInputElement>("#intensity-severe")?.click();
      host.querySelector<HTMLInputElement>("#setting-horror")?.click();
      host.querySelector<HTMLInputElement>("#timeframe-immediate")?.click();
      host.querySelector<HTMLInputElement>("#count-5")?.click();
    });

    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    await fillAndSubmit(host);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(
      host.querySelector(`#${ADVANCED_OPTIONS_ID}`)?.hasAttribute("hidden"),
    ).toBe(false);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps fields blocked and the panel collapsed while a request is pending", async () => {
    let release: ((value: { ok: boolean; json: () => Promise<GenerationResult> }) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      ),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    await fillAndSubmit(host);

    expect(host.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect(host.querySelector('button[type="submit"]')).toHaveProperty(
      "disabled",
      true,
    );
    expect(host.querySelector("fieldset")).toHaveProperty("disabled", true);
    expect(
      host
        .querySelector(`button[aria-controls="${ADVANCED_OPTIONS_ID}"]`)
        ?.getAttribute("aria-expanded"),
    ).toBe("false");

    await act(async () => {
      release?.({ ok: true, json: async () => result });
      await Promise.resolve();
    });

    expect(
      host
        .querySelector(`button[aria-controls="${ADVANCED_OPTIONS_ID}"]`)
        ?.getAttribute("aria-expanded"),
    ).toBe("false");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("GeneratorWorkshop example preview", () => {
  it("fills only the decision, keeps selected options, and does not generate", async () => {
    const fetchMock = vi.fn();
    const gtag = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.gtag = gtag;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const textarea = host.querySelector(
      "#event-description",
    ) as HTMLTextAreaElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea, "Existing notes about the spared scout.");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const toggle = host.querySelector<HTMLButtonElement>(
      `button[aria-controls="${ADVANCED_OPTIONS_ID}"]`,
    );
    await act(async () => {
      toggle?.click();
    });
    await act(async () => {
      host.querySelector<HTMLInputElement>("#tone-dark")?.click();
      host.querySelector<HTMLInputElement>("#count-5")?.click();
    });

    const libraryBefore = localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY);
    const sessionBefore = sessionStorage.length;
    const useExample = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes(dictionary.example.useExample),
    );
    await act(async () => {
      useExample?.click();
    });

    expect(textarea.value).toBe(getExampleResult("en").decision);
    expect(host.querySelector<HTMLInputElement>("#tone-dark")?.checked).toBe(
      true,
    );
    expect(host.querySelector<HTMLInputElement>("#count-5")?.checked).toBe(
      true,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toBe(
      libraryBefore,
    );
    expect(sessionStorage.length).toBe(sessionBefore);
    expect(document.activeElement).toBe(textarea);
    expect(gtag).toHaveBeenCalledWith("event", "example_selected", {
      locale: "en",
    });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("temple");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
