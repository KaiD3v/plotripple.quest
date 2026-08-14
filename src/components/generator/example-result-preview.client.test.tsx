/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getExampleResult } from "@/components/generator/example-result";
import { ExampleResultPreview } from "@/components/generator/example-result-preview";
import { getDictionary } from "@/i18n/get-dictionary";

describe("ExampleResultPreview interaction", () => {
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
  });

  it("emits example_selected with only the locale and returns the decision text", async () => {
    const onUseExample = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <ExampleResultPreview
          locale="pt-br"
          dictionary={getDictionary("pt-br")}
          onUseExample={onUseExample}
        />,
      );
    });

    const user = userEvent.setup();
    const button = Array.from(host.querySelectorAll("button")).find((item) =>
      item.textContent?.includes("Usar este exemplo"),
    );
    const gtag = window.gtag as ReturnType<typeof vi.fn>;
    await user.click(button!);

    expect(onUseExample).toHaveBeenCalledTimes(1);
    expect(onUseExample).toHaveBeenCalledWith(getExampleResult("pt-br").decision);
    expect(gtag).toHaveBeenCalledWith("event", "example_selected", {
      locale: "pt-br",
    });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("templo");

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
