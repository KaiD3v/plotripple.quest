export const RESULT_SCROLL_OFFSET_PX = 72;

export function shouldScrollToResult(
  rect: { top: number; bottom: number },
  viewportHeight: number,
  headerOffset = RESULT_SCROLL_OFFSET_PX,
): boolean {
  const topIsVisible = rect.top >= headerOffset && rect.top < viewportHeight;
  return !topIsVisible;
}

export function prefersReducedMotion(
  media: Pick<MediaQueryList, "matches"> | null | undefined,
): boolean {
  return Boolean(media?.matches);
}

export function isMobileResultViewport(
  media: Pick<MediaQueryList, "matches"> | null | undefined,
): boolean {
  return Boolean(media?.matches);
}

export function bringResultIntoView(
  element: HTMLElement | null,
  options?: { focus?: boolean },
): void {
  if (!element || typeof window === "undefined") {
    return;
  }

  const rect = element.getBoundingClientRect();
  const reduceMotion = prefersReducedMotion(
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null,
  );

  if (
    shouldScrollToResult(rect, window.innerHeight) &&
    typeof element.scrollIntoView === "function"
  ) {
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  const shouldFocus =
    options?.focus ??
    isMobileResultViewport(
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 1023px)")
        : null,
    );

  if (shouldFocus && typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}
