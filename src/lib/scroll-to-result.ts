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

export type ResultScrollMode = "always" | "mobile" | "never";

export function bringResultIntoView(
  element: HTMLElement | null,
  options?: { focus?: boolean; scroll?: ResultScrollMode },
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
  const isMobile = isMobileResultViewport(
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 1023px)")
      : null,
  );
  const scrollMode = options?.scroll ?? "always";
  const allowScroll =
    scrollMode === "always" || (scrollMode === "mobile" && isMobile);

  if (
    allowScroll &&
    shouldScrollToResult(rect, window.innerHeight) &&
    typeof element.scrollIntoView === "function"
  ) {
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  const shouldFocus = options?.focus ?? isMobile;

  if (shouldFocus && typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}
