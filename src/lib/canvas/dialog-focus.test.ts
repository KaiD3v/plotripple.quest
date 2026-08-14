import { describe, expect, it } from "vitest";
import {
  createDialogFocusSession,
  rememberFocusTrigger,
  restoreFocusAfterUnmount,
} from "@/lib/canvas/dialog-focus";

function fakeTrigger() {
  const calls: string[] = [];
  return {
    focus() {
      calls.push("focus");
    },
    calls,
  };
}

describe("mobile dialog focus session", () => {
  it("remembers the triggering element before the dialog opens", () => {
    const trigger = fakeTrigger();
    const session = createDialogFocusSession();
    session.remember(trigger as unknown as HTMLElement);
    expect(rememberFocusTrigger(trigger as unknown as HTMLElement)).toBe(trigger);
    expect(session.consume()).toBe(trigger);
    expect(session.consume()).toBeNull();
  });

  it("restores focus after unmount for Escape and the close button", async () => {
    const trigger = fakeTrigger();
    const session = createDialogFocusSession();

    session.remember(trigger as unknown as HTMLElement);
    restoreFocusAfterUnmount(session.consume());
    expect(trigger.calls).toEqual([]);
    await Promise.resolve();
    expect(trigger.calls).toEqual(["focus"]);

    trigger.calls.length = 0;
    session.remember(trigger as unknown as HTMLElement);
    restoreFocusAfterUnmount(session.consume());
    await Promise.resolve();
    expect(trigger.calls).toEqual(["focus"]);
  });

  it("does not focus immediately while the dialog is still conceptually mounted", () => {
    const trigger = fakeTrigger();
    restoreFocusAfterUnmount(trigger as unknown as HTMLElement);
    expect(trigger.calls).toEqual([]);
  });
});
