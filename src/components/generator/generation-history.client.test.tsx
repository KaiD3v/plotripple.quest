/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerationHistory } from "@/components/generator/generation-history";
import { getDictionary } from "@/i18n/get-dictionary";
import type { RecentDeviceItem } from "@/lib/chronicle/recent-device";

const item: Extract<RecentDeviceItem, { kind: "chronicle" }> = {
  kind: "chronicle",
  id: "chr-mercy",
  title: "Scout mercy",
  locale: "en",
  nodeCount: 4,
  updatedAt: "2026-08-13T12:00:00.000Z",
  persisted: true,
};

describe("GenerationHistory confirmation", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("restores focus to the delete trigger when confirmation is cancelled", async () => {
    const dictionary = getDictionary("en");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <GenerationHistory
          items={[item]}
          locale="en"
          dictionary={dictionary}
          onOpenMap={() => undefined}
          onReviewLegacy={() => undefined}
          onDelete={vi.fn()}
          onClear={() => undefined}
        />,
      );
    });

    const deleteButton = Array.from(host.querySelectorAll("button")).find(
      (button) =>
        button.getAttribute("aria-label") ===
        dictionary.history.deleteNamed.replace("{title}", item.title),
    );
    expect(deleteButton).toBeTruthy();
    await act(async () => {
      deleteButton?.focus();
      deleteButton?.click();
    });
    expect(host.textContent).toContain(dictionary.history.deleteConfirmTitle);

    const cancel = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.history.deleteCancel,
    );
    await act(async () => {
      cancel?.click();
      await Promise.resolve();
    });

    expect(host.textContent).not.toContain(dictionary.history.deleteConfirmTitle);
    expect(document.activeElement).toBe(deleteButton);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it("restores focus to the clear trigger when confirmation is cancelled", async () => {
    const dictionary = getDictionary("en");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <GenerationHistory
          items={[item]}
          locale="en"
          dictionary={dictionary}
          onOpenMap={() => undefined}
          onReviewLegacy={() => undefined}
          onDelete={vi.fn()}
          onClear={vi.fn()}
        />,
      );
    });

    const clearButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === dictionary.history.clear,
    );
    expect(clearButton).toBeTruthy();
    await act(async () => {
      clearButton?.focus();
      clearButton?.click();
    });
    expect(host.textContent).toContain(dictionary.history.clearConfirmTitle);
    expect(host.textContent).toContain("Clear local chronicles");

    const cancel = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === dictionary.history.clearCancel,
    );
    await act(async () => {
      cancel?.click();
      await Promise.resolve();
    });

    expect(host.textContent).not.toContain(dictionary.history.clearConfirmTitle);
    expect(document.activeElement).toBe(clearButton);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
