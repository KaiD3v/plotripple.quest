export const MIN_ZOOM = 0.38;
export const MAX_ZOOM = 1.6;
export const DEFAULT_ZOOM = 1;
export const FIT_PADDING_RATIO = 0.12;
export const PAN_KEEP_PX = 96;
export const COMFORTABLE_ZOOM_MIN = 0.78;
export const CONTROL_INSET_TOP = 56;
export const VIEWPORT_INSET = 16;

export type ViewState = {
  x: number;
  y: number;
  scale: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const DEFAULT_INSETS: ViewportInsets = {
  top: CONTROL_INSET_TOP,
  right: VIEWPORT_INSET,
  bottom: VIEWPORT_INSET,
  left: VIEWPORT_INSET,
};

export function clampZoom(
  scale: number,
  min = MIN_ZOOM,
  max = MAX_ZOOM,
): number {
  return Math.min(max, Math.max(min, scale));
}

export function isAtMinZoom(scale: number, epsilon = 0.001): boolean {
  return scale <= MIN_ZOOM + epsilon;
}

export function isAtMaxZoom(scale: number, epsilon = 0.001): boolean {
  return scale >= MAX_ZOOM - epsilon;
}

export function zoomPercent(scale: number): number {
  return Math.round(scale * 100);
}

export function contentBounds(
  nodes: Array<{ x: number; y: number; width: number; height: number }>,
): Rect {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function usableRect(viewport: Size, insets: ViewportInsets): Rect {
  const width = Math.max(1, viewport.width - insets.left - insets.right);
  const height = Math.max(1, viewport.height - insets.top - insets.bottom);
  return {
    x: insets.left,
    y: insets.top,
    width,
    height,
  };
}

function centerViewOnPoint(
  point: { x: number; y: number },
  scale: number,
  usable: Rect,
): ViewState {
  return {
    scale,
    x: usable.x + usable.width / 2 - point.x * scale,
    y: usable.y + usable.height / 2 - point.y * scale,
  };
}

export function fitChronicle(
  bounds: Rect,
  viewport: Size,
  insets: ViewportInsets = DEFAULT_INSETS,
  paddingRatio = FIT_PADDING_RATIO,
): ViewState {
  const usable = usableRect(viewport, insets);
  const paddedWidth = usable.width * (1 - paddingRatio * 2);
  const paddedHeight = usable.height * (1 - paddingRatio * 2);
  const scale = clampZoom(
    Math.min(paddedWidth / bounds.width, paddedHeight / bounds.height),
  );
  return centerViewOnPoint(
    {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    },
    scale,
    usable,
  );
}

export function resetZoom(
  bounds: Rect,
  viewport: Size,
  insets: ViewportInsets = DEFAULT_INSETS,
): ViewState {
  const usable = usableRect(viewport, insets);
  const fit = fitChronicle(bounds, viewport, insets);
  const scale = Math.min(DEFAULT_ZOOM, fit.scale);
  return centerViewOnPoint(
    {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    },
    scale,
    usable,
  );
}

export function centerSelected(
  node: Rect,
  viewport: Size,
  insets: ViewportInsets = DEFAULT_INSETS,
  currentScale = DEFAULT_ZOOM,
): ViewState {
  const usable = usableRect(viewport, insets);
  const scale =
    currentScale < COMFORTABLE_ZOOM_MIN
      ? COMFORTABLE_ZOOM_MIN
      : clampZoom(currentScale);
  return centerViewOnPoint(
    {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    },
    scale,
    usable,
  );
}

export function viewStatesEqual(
  left: ViewState,
  right: ViewState,
  epsilon = 0.001,
): boolean {
  return (
    Math.abs(left.x - right.x) <= epsilon &&
    Math.abs(left.y - right.y) <= epsilon &&
    Math.abs(left.scale - right.scale) <= epsilon
  );
}

export function commitViewState(
  current: ViewState,
  next: ViewState,
  bounds: Rect,
  viewport: Size | null,
): { view: ViewState; changed: boolean } {
  const clamped = viewport ? clampPan(next, bounds, viewport) : next;
  if (viewStatesEqual(current, clamped)) {
    return { view: current, changed: false };
  }
  return { view: clamped, changed: true };
}

export function clampPan(
  view: ViewState,
  bounds: Rect,
  viewport: Size,
  insets: ViewportInsets = DEFAULT_INSETS,
  keepPx = PAN_KEEP_PX,
): ViewState {
  const usable = usableRect(viewport, insets);
  const contentLeft = view.x + bounds.x * view.scale;
  const contentRight = view.x + (bounds.x + bounds.width) * view.scale;
  const contentTop = view.y + bounds.y * view.scale;
  const contentBottom = view.y + (bounds.y + bounds.height) * view.scale;

  let nextX = view.x;
  let nextY = view.y;

  if (contentRight < usable.x + keepPx) {
    nextX += usable.x + keepPx - contentRight;
  } else if (contentLeft > usable.x + usable.width - keepPx) {
    nextX += usable.x + usable.width - keepPx - contentLeft;
  }

  if (contentBottom < usable.y + keepPx) {
    nextY += usable.y + keepPx - contentBottom;
  } else if (contentTop > usable.y + usable.height - keepPx) {
    nextY += usable.y + usable.height - keepPx - contentTop;
  }

  return { ...view, x: nextX, y: nextY };
}

export function rectsOverlap(
  a: Rect,
  b: Rect,
  gap = 0,
): boolean {
  return (
    a.x < b.x + b.width - gap &&
    a.x + a.width - gap > b.x &&
    a.y < b.y + b.height - gap &&
    a.y + a.height - gap > b.y
  );
}

export function nodeIsVisible(
  node: Rect,
  view: ViewState,
  viewport: Size,
  insets: ViewportInsets = DEFAULT_INSETS,
): boolean {
  const usable = usableRect(viewport, insets);
  const left = view.x + node.x * view.scale;
  const top = view.y + node.y * view.scale;
  const right = left + node.width * view.scale;
  const bottom = top + node.height * view.scale;
  return (
    right > usable.x &&
    left < usable.x + usable.width &&
    bottom > usable.y &&
    top < usable.y + usable.height
  );
}

export function nextFocusIndex(
  current: number,
  count: number,
  shiftKey: boolean,
): number {
  if (count <= 0) {
    return 0;
  }
  if (shiftKey) {
    return (current - 1 + count) % count;
  }
  return (current + 1) % count;
}
