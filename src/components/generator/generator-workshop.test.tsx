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

    expect(host.textContent).toContain(dictionary.result.empty);
    await fillAndSubmit(host);

    expect(push).not.toHaveBeenCalled();
    expect(host.textContent).toContain(result.summary);
    expect(host.textContent).toContain("3 consequences");
    for (const consequence of result.consequences) {
      expect(host.textContent).toContain(consequence.title);
      expect(host.textContent).toContain(consequence.description);
    }
    expect(host.textContent).not.toContain(dictionary.result.empty);
    expect(host.querySelector("#event-description")).toBeTruthy();

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

    expect(host.textContent).toContain(dictionary.result.empty);
    expect(host.querySelector(".folio-summary")).toBeNull();
    expect(textarea?.value).toBe(decision);
    expect(document.activeElement).toBe(textarea);
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
