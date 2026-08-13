export function shouldScrollToResult(
  rect: { top: number; bottom: number },
  viewportHeight: number,
): boolean {
  return rect.top < 0 || rect.top > viewportHeight;
}

export function prefersReducedMotion(
  media: Pick<MediaQueryList, "matches"> | null | undefined,
): boolean {
  return Boolean(media?.matches);
}

export function bringResultIntoView(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const reduceMotion = prefersReducedMotion(
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null,
  );

  if (shouldScrollToResult(rect, window.innerHeight)) {
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}
