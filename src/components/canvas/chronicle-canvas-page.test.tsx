/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import userEvent from "@testing-library/user-event";
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

import { ChronicleCanvasPage } from "@/components/canvas/chronicle-canvas-page";
import { GeneratorWorkshop } from "@/components/generator/generator-workshop";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  CHRONICLE_LIBRARY_STORAGE_KEY,
  deleteStoredChronicle,
  resetChronicleLibraryCache,
} from "@/lib/chronicle/library-repository";
import { prepareChronicleNavigation } from "@/lib/chronicle/prepare-navigation";
import { resetRecentDeviceCache } from "@/lib/chronicle/recent-device";
import { resolveChronicleGraphId } from "@/lib/chronicle/resolve-graph-id";
import {
  CHRONICLE_STORAGE_KEY,
  getChronicleSnapshot,
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

function mockViewportApis(options?: { mobile?: boolean }) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  const mobile = options?.mobile ?? false;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("max-width: 1023px") ? mobile : !mobile,
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

function assertNoNextOverlay(host: HTMLElement) {
  expect(host.querySelector("nextjs-portal")).toBeNull();
  expect(host.querySelector("[data-nextjs-dialog]")).toBeNull();
  expect(host.textContent).not.toMatch(
    /getSnapshot should be cached|Maximum update depth/i,
  );
}

async function renderTree(host: HTMLElement, node: ReactNode): Promise<Root> {
  const root = createRoot(host);
  await act(async () => {
    root.render(node);
  });
  return root;
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
  resetChronicleSnapshotCache();
  resetChronicleLibraryCache();
  resetRecentDeviceCache();
  resetHistorySnapshotCache();
  sessionStorage.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ChronicleCanvasPage client snapshot", () => {
  it("does not loop when mounting a persisted chronicle", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }

    let renders = 0;
    function CountedPage() {
      renders += 1;
      if (renders > 20) {
        throw new Error("ChronicleCanvasPage render loop");
      }
      return <ChronicleCanvasPage locale="en" dictionary={dictionary} />;
    }

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(host, <CountedPage />);

    expect(renders).toBeLessThan(8);
    expect(host.textContent).toContain(navigation.graph.title);
    expect(host.textContent).toContain("A whispered debt");
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps the chronicle after a simulated reload of /en/canvas", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }

    const host = document.createElement("div");
    document.body.appendChild(host);
    let root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    expect(host.textContent).toContain(navigation.graph.title);
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    resetChronicleSnapshotCache();

    root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    expect(sessionStorage.getItem(CHRONICLE_STORAGE_KEY)).toContain(
      navigation.graph.title,
    );
    expect(host.textContent).toContain(navigation.graph.title);
    expect(host.textContent).toContain(dictionary.canvas.productionHelper);
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

const expandResult = {
  followUps: [
    {
      title: "A quiet ledger opens",
      description: "Kin start recording favors after the mercy.",
    },
    {
      title: "A rival offers shelter",
      description: "A border house invites the party as witnesses.",
    },
  ],
};

describe("generate to canvas flow", () => {
  it("generates, navigates to /en/canvas, and shows the chronicle title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => result,
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const workshopRoot = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const textarea = host.querySelector(
      "#event-description",
    ) as HTMLTextAreaElement | null;
    expect(textarea).toBeTruthy();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea, decision);
      textarea?.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      host.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });

    expect(push).toHaveBeenCalledWith("/en/canvas");
    expect(sessionStorage.getItem(CHRONICLE_STORAGE_KEY)).toContain(
      result.summary,
    );
    expect(localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY)).toContain(
      result.summary,
    );

    await act(async () => {
      workshopRoot.unmount();
    });

    const canvasRoot = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    expect(host.textContent).toContain(result.summary);
    expect(host.textContent).toContain("A whispered debt");
    assertNoNextOverlay(host);

    await act(async () => {
      canvasRoot.unmount();
    });
    host.remove();
  });

  it("generates, expands a ripple, and keeps follow-ups after refresh", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/expand")) {
        return {
          ok: true,
          json: async () => expandResult,
        };
      }
      return {
        ok: true,
        json: async () => result,
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const workshopRoot = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );

    const textarea = host.querySelector(
      "#event-description",
    ) as HTMLTextAreaElement | null;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea, decision);
      textarea?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      host.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });
    expect(push).toHaveBeenCalledWith("/en/canvas");

    await act(async () => {
      workshopRoot.unmount();
    });

    let renders = 0;
    function CountedPage() {
      renders += 1;
      if (renders > 25) {
        throw new Error("ChronicleCanvasPage render loop");
      }
      return <ChronicleCanvasPage locale="en" dictionary={dictionary} />;
    }

    let root = await renderTree(host, <CountedPage />);
    const parentId = getChronicleSnapshot()?.nodes.find(
      (node) => node.type === "consequence",
    )?.id;
    expect(parentId).toBeTruthy();

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });
    const exploreButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.canvas.exploreRipple,
    );
    await act(async () => {
      exploreButton?.click();
      await Promise.resolve();
    });

    expect(host.textContent).toContain("A quiet ledger opens");
    expect(host.textContent).toContain("A rival offers shelter");
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    resetChronicleSnapshotCache();
    renders = 0;
    root = await renderTree(host, <CountedPage />);

    expect(host.textContent).toContain("A quiet ledger opens");
    expect(host.textContent).toContain("A rival offers shelter");
    assertNoNextOverlay(host);
    expect(renders).toBeLessThan(20);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("explore ripple on production canvas", () => {
  it("expands a consequence, updates the outline, survives refresh, and does not loop", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence",
    )?.id;
    expect(parentId).toBeTruthy();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/expand")) {
        return {
          ok: true,
          json: async () => expandResult,
        };
      }
      return {
        ok: false,
        json: async () => ({ error: { code: "INTERNAL_ERROR", message: "nope" } }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    let renders = 0;
    function CountedPage() {
      renders += 1;
      if (renders > 25) {
        throw new Error("ChronicleCanvasPage render loop");
      }
      return <ChronicleCanvasPage locale="en" dictionary={dictionary} />;
    }

    const host = document.createElement("div");
    document.body.appendChild(host);
    let root = await renderTree(host, <CountedPage />);

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    const exploreButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.canvas.exploreRipple,
    );
    expect(exploreButton).toBeTruthy();

    await act(async () => {
      exploreButton?.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain("A quiet ledger opens");
    expect(host.textContent).toContain("A rival offers shelter");
    expect(host.textContent).toContain(dictionary.canvas.branchExplored);
    expect(host.textContent).toContain("2 follow-ups added to A whispered debt.");
    expect(host.querySelector(".chronicle-outline")?.textContent).toContain(
      "A quiet ledger opens",
    );
    assertNoNextOverlay(host);
    expect(renders).toBeLessThan(20);

    await act(async () => {
      root.unmount();
    });
    resetChronicleSnapshotCache();
    renders = 0;
    root = await renderTree(host, <CountedPage />);

    expect(host.textContent).toContain("A quiet ledger opens");
    expect(host.textContent).toContain("A rival offers shelter");
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("shows loading, blocks a second call, and keeps the graph on failure", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence",
    )?.id;

    let release: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    const exploreButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.canvas.exploreRipple,
    );

    await act(async () => {
      exploreButton?.click();
      exploreButton?.click();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain(dictionary.canvas.exploringRipple);

    await act(async () => {
      release?.({
        ok: false,
        json: async () => ({
          error: { code: "AI_UNAVAILABLE", message: "down" },
        }),
      });
      await Promise.resolve();
    });

    expect(host.textContent).toContain(dictionary.canvas.expandUnavailable);
    expect(host.textContent).toContain(dictionary.canvas.tryAgain);
    expect(host.textContent).not.toContain("A quiet ledger opens");
    expect(sessionStorage.getItem(CHRONICLE_STORAGE_KEY)).not.toContain(
      "A quiet ledger opens",
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("localizes the explore action in pt-br", async () => {
    const pt = getDictionary("pt-br");
    const navigation = prepareChronicleNavigation(result, "pt-br", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence",
    )?.id;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="pt-br" dictionary={pt} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    expect(host.textContent).toContain(pt.canvas.exploreRipple);
    expect(host.textContent).not.toContain(dictionary.canvas.exploreRipple);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("clears the explore aria-live announcement when another node is selected", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const consequences = navigation.graph.nodes.filter(
      (node) => node.type === "consequence",
    );
    const firstId = consequences[0]?.id;
    const secondId = consequences[1]?.id;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => expandResult,
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${firstId}"]`,
        )
        ?.click();
    });
    const exploreButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.canvas.exploreRipple,
    );
    await act(async () => {
      exploreButton?.click();
      await Promise.resolve();
    });
    expect(host.querySelector("#chronicle-explore-live")?.textContent).toContain(
      "2 follow-ups added",
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${secondId}"]`,
        )
        ?.click();
    });
    expect(host.querySelector("#chronicle-explore-live")?.textContent).toBe("");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("local chronicle library flow", () => {
  it("updates one library record, survives a new tab, and continues expanding without generate", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const graphId = resolveChronicleGraphId(navigation.graph);
    const firstConsequence = navigation.graph.nodes.find(
      (node) => node.type === "consequence",
    )?.id;
    const secondConsequence = navigation.graph.nodes.find(
      (node) =>
        node.type === "consequence" && node.title === "Standing orders change",
    )?.id;
    const createdAt = JSON.parse(
      localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}",
    ).chronicles?.[0]?.createdAt as string | undefined;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/expand")) {
        return {
          ok: true,
          json: async () =>
            fetchMock.mock.calls.length > 1
              ? {
                  followUps: [
                    {
                      title: "A watch list appears",
                      description: "Names move between ledgers.",
                    },
                    {
                      title: "A smuggler changes routes",
                      description: "The old trail is abandoned.",
                    },
                  ],
                }
              : expandResult,
        };
      }
      return {
        ok: true,
        json: async () => result,
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    let root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${firstConsequence}"]`,
        )
        ?.click();
    });
    await act(async () => {
      Array.from(host.querySelectorAll("button"))
        .find((button) => button.textContent === dictionary.canvas.exploreRipple)
        ?.click();
      await Promise.resolve();
    });

    expect(host.textContent).toContain("A quiet ledger opens");
    const libraryAfterExpand = JSON.parse(
      localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}",
    );
    expect(libraryAfterExpand.chronicles).toHaveLength(1);
    expect(libraryAfterExpand.chronicles[0]?.id).toBe(graphId);
    expect(libraryAfterExpand.chronicles[0]?.createdAt).toBe(createdAt);
    expect(libraryAfterExpand.chronicles[0]?.graph.nodes.length).toBe(6);

    await act(async () => {
      root.unmount();
    });
    sessionStorage.clear();
    resetChronicleSnapshotCache();
    resetRecentDeviceCache();

    root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );
    expect(host.textContent).toContain("6 nodes");
    const generateCallsBeforeOpen = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/api/generate"),
    ).length;

    await act(async () => {
      Array.from(host.querySelectorAll("button"))
        .find((button) => button.textContent === dictionary.history.openMap)
        ?.click();
    });
    expect(push).toHaveBeenCalledWith("/en/canvas");
    expect(
      fetchMock.mock.calls.filter((call) =>
        String(call[0]).includes("/api/generate"),
      ),
    ).toHaveLength(generateCallsBeforeOpen);

    await act(async () => {
      root.unmount();
    });
    root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    expect(host.textContent).toContain("A quiet ledger opens");
    expect(host.textContent).toContain("A rival offers shelter");
    expect(host.textContent).toContain("A whispered debt");
    assertNoNextOverlay(host);

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${secondConsequence}"]`,
        )
        ?.click();
    });
    await act(async () => {
      Array.from(host.querySelectorAll("button"))
        .find((button) => button.textContent === dictionary.canvas.exploreRipple)
        ?.click();
      await Promise.resolve();
    });
    expect(host.textContent).toContain("A watch list appears");

    await act(async () => {
      root.unmount();
    });
    resetChronicleSnapshotCache();
    root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    expect(host.textContent).toContain("A watch list appears");
    expect(host.textContent).toContain("A smuggler changes routes");
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("keeps the open canvas when the library record is deleted", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const graphId = resolveChronicleGraphId(navigation.graph);
    expect(graphId).toBeTruthy();
    deleteStoredChronicle(graphId!);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    expect(host.textContent).toContain("A whispered debt");
    expect(host.textContent).toContain(dictionary.canvas.libraryUnsaved);
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("narrative status on production canvas", () => {
  it("changes status, announces, persists across refresh and reopen without Gemini", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence" && node.title === "A whispered debt",
    )?.id;
    const graphId = resolveChronicleGraphId(navigation.graph);
    const createdAt = JSON.parse(
      localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}",
    ).chronicles?.[0]?.createdAt as string | undefined;

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.appendChild(host);
    let root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    expect(host.querySelector(`[data-status-control="${parentId}"]`)).toBeTruthy();

    const activeRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-mobile"][value="active"]`,
    );
    expect(activeRadio).toBeTruthy();
    await act(async () => {
      activeRadio?.click();
    });

    expect(host.querySelector("#chronicle-status-live")?.textContent).toBe(
      "A whispered debt marked as Active.",
    );
    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("active");
    expect(host.querySelector(".chronicle-outline")?.textContent).toContain("Active");
    expect(fetchMock).not.toHaveBeenCalled();

    const library = JSON.parse(
      localStorage.getItem(CHRONICLE_LIBRARY_STORAGE_KEY) ?? "{}",
    );
    expect(library.chronicles).toHaveLength(1);
    expect(library.chronicles[0]?.createdAt).toBe(createdAt);
    expect(
      library.chronicles[0]?.graph.nodes.find(
        (node: { id: string }) => node.id === parentId,
      )?.status,
    ).toBe("active");

    await act(async () => {
      root.unmount();
    });
    resetChronicleSnapshotCache();
    root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("active");

    await act(async () => {
      root.unmount();
    });
    sessionStorage.clear();
    resetChronicleSnapshotCache();
    resetRecentDeviceCache();

    root = await renderTree(
      host,
      <GeneratorWorkshop locale="en" dictionary={dictionary} />,
    );
    await act(async () => {
      Array.from(host.querySelectorAll("button"))
        .find((button) => button.textContent === dictionary.history.openMap)
        ?.click();
    });
    expect(push).toHaveBeenCalledWith("/en/canvas");
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("active");

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });
    await act(async () => {
      host
        .querySelector<HTMLInputElement>(
          `input[name$="-narrative-status-mobile"][value="resolved"]`,
        )
        ?.click();
    });
    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("resolved");
    expect(host.querySelector("#chronicle-status-live")?.textContent).toBe(
      "A whispered debt marked as Resolved.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(graphId).toBeTruthy();
    assertNoNextOverlay(host);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("does not announce when selecting the already applied status", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence",
    )?.id;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });
    await act(async () => {
      host
        .querySelector<HTMLInputElement>(
          `input[name$="-narrative-status-mobile"][value="pending"]`,
        )
        ?.click();
    });
    expect(host.querySelector("#chronicle-status-live")?.textContent).toBe("");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("supports keyboard selection on the desktop status radios", async () => {
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence" && node.title === "A whispered debt",
    )?.id;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    const user = userEvent.setup();

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    const pendingRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-desktop"][value="pending"]`,
    );
    const activeRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-desktop"][value="active"]`,
    );
    const resolvedRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-desktop"][value="resolved"]`,
    );
    expect(pendingRadio).toBeTruthy();
    expect(activeRadio).toBeTruthy();
    expect(resolvedRadio).toBeTruthy();

    const centerButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.canvas.centerOnNode,
    );
    expect(centerButton).toBeTruthy();
    centerButton?.focus();

    await user.tab();
    expect(document.activeElement).toBe(pendingRadio);

    await user.keyboard("{ArrowRight}");
    expect(activeRadio?.checked).toBe(true);
    expect(document.activeElement).toBe(activeRadio);

    await user.keyboard("{ArrowRight}");
    expect(resolvedRadio?.checked).toBe(true);
    expect(document.activeElement).toBe(resolvedRadio);

    await user.keyboard(" ");
    expect(resolvedRadio?.checked).toBe(true);

    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("resolved");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("supports keyboard selection on the mobile status radios", async () => {
    mockViewportApis({ mobile: true });
    const navigation = prepareChronicleNavigation(result, "en", decision);
    expect(navigation.ok).toBe(true);
    if (!navigation.ok) {
      return;
    }
    const parentId = navigation.graph.nodes.find(
      (node) => node.type === "consequence" && node.title === "A whispered debt",
    )?.id;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = await renderTree(
      host,
      <ChronicleCanvasPage locale="en" dictionary={dictionary} />,
    );
    const user = userEvent.setup();

    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(
          `.chronicle-tree [data-chronicle-node="${parentId}"]`,
        )
        ?.click();
    });

    const pendingRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-mobile"][value="pending"]`,
    );
    const activeRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-mobile"][value="active"]`,
    );
    const resolvedRadio = host.querySelector<HTMLInputElement>(
      `input[name$="-narrative-status-mobile"][value="resolved"]`,
    );
    expect(pendingRadio).toBeTruthy();
    expect(activeRadio).toBeTruthy();
    expect(resolvedRadio).toBeTruthy();

    await user.tab();
    expect(document.activeElement).toBe(pendingRadio);

    await user.keyboard("{ArrowRight}");
    expect(activeRadio?.checked).toBe(true);
    expect(document.activeElement).toBe(activeRadio);

    await user.keyboard("{ArrowRight}");
    expect(resolvedRadio?.checked).toBe(true);
    expect(document.activeElement).toBe(resolvedRadio);

    await user.keyboard(" ");
    expect(resolvedRadio?.checked).toBe(true);

    expect(
      host
        .querySelector(`.chronicle-tree [data-chronicle-node="${parentId}"]`)
        ?.getAttribute("data-narrative-status"),
    ).toBe("resolved");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

