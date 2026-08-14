function isFocusable(value: unknown): value is HTMLElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof (value as { focus?: unknown }).focus === "function"
  );
}

export function rememberFocusTrigger(
  target?: EventTarget | null,
): HTMLElement | null {
  if (isFocusable(target)) {
    return target;
  }
  if (typeof document === "undefined") {
    return null;
  }
  return isFocusable(document.activeElement) ? document.activeElement : null;
}

export function restoreFocusAfterUnmount(element: HTMLElement | null): void {
  if (!element || typeof element.focus !== "function") {
    return;
  }

  const focus = () => {
    element.focus();
  };

  if (typeof queueMicrotask === "function") {
    queueMicrotask(focus);
    return;
  }

  focus();
}

export type DialogFocusSession = {
  remember(target?: EventTarget | null): void;
  consume(): HTMLElement | null;
};

export function createDialogFocusSession(): DialogFocusSession {
  let trigger: HTMLElement | null = null;

  return {
    remember(target) {
      trigger = rememberFocusTrigger(target);
    },
    consume() {
      const current = trigger;
      trigger = null;
      return current;
    },
  };
}
