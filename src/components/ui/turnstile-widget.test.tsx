/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type TurnstileOptions = Parameters<
  NonNullable<Window["turnstile"]>["render"]
>[1];

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

describe("TurnstileWidget", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reset = vi.fn();
  const renderWidget = vi.fn<
    (element: HTMLElement, options: TurnstileOptions) => string
  >(() => "widget-1");

  beforeEach(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.turnstile = {
      render: renderWidget,
      reset,
    };
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    container.remove();
    document
      .querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]')
      .forEach((script) => script.remove());
    delete window.turnstile;
    vi.clearAllMocks();
  });

  it("resets the consumed token when the reset signal changes", async () => {
    const onToken = vi.fn();

    await act(async () => {
      root.render(
        <TurnstileWidget
          siteKey="test-site-key"
          onToken={onToken}
          resetSignal={0}
        />,
      );
    });

    const script = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    ) as HTMLScriptElement;
    await act(async () => script.onload?.(new Event("load")));

    expect(renderWidget).toHaveBeenCalledOnce();
    const options = renderWidget.mock.calls[0]?.[1];
    await act(async () => options?.callback("consumed-token"));
    expect(onToken).toHaveBeenLastCalledWith("consumed-token");

    await act(async () => {
      root.render(
        <TurnstileWidget
          siteKey="test-site-key"
          onToken={onToken}
          resetSignal={1}
        />,
      );
    });

    expect(reset).toHaveBeenCalledWith("widget-1");
    expect(onToken).toHaveBeenLastCalledWith("");
  });

  it("clears tokens on expiry, widget errors, and interactive timeouts", async () => {
    const onToken = vi.fn();

    await act(async () => {
      root.render(
        <TurnstileWidget siteKey="test-site-key" onToken={onToken} />,
      );
    });

    const script = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    ) as HTMLScriptElement;
    await act(async () => script.onload?.(new Event("load")));
    const options = renderWidget.mock.calls[0]?.[1];

    await act(async () => options?.["expired-callback"]?.());
    await act(async () => options?.["error-callback"]?.());
    await act(async () => options?.["timeout-callback"]?.());

    expect(onToken).toHaveBeenNthCalledWith(1, "");
    expect(onToken).toHaveBeenNthCalledWith(2, "");
    expect(onToken).toHaveBeenNthCalledWith(3, "");
  });
});
