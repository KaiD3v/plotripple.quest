"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ChronicleNodeButton } from "@/components/canvas/chronicle-node";
import { layoutNarrativeGraph } from "@/lib/canvas/layout";
import {
  DEFAULT_INSETS,
  type Size,
  type ViewState,
  centerSelected,
  clampPan,
  clampZoom,
  commitViewState,
  contentBounds,
  fitChronicle,
  isAtMaxZoom,
  isAtMinZoom,
  nodeIsVisible,
  resetZoom,
  zoomPercent,
} from "@/lib/canvas/viewport";
import type { ChronicleSelectHandler } from "@/lib/canvas/selection";
import type { NarrativeGraph } from "@/types/narrative-graph";

export type ChronicleMapHandle = {
  fitChronicle: () => void;
  centerSelected: (nodeId?: string) => boolean;
  resetZoom: () => void;
};

export const DesktopChronicleMap = forwardRef<
  ChronicleMapHandle,
  {
    graph: NarrativeGraph;
    dictionary: Dictionary;
    selectedId: string | null;
    relatedNodeIds: Set<string>;
    relatedEdgeIds: Set<string>;
    onSelect: ChronicleSelectHandler;
    registerNode: (nodeId: string, element: HTMLButtonElement | null) => void;
  }
>(function DesktopChronicleMap(
  {
    graph,
    dictionary,
    selectedId,
    relatedNodeIds,
    relatedEdgeIds,
    onSelect,
    registerNode,
  },
  ref,
) {
  const layout = useMemo(() => layoutNarrativeGraph(graph), [graph]);
  const bounds = useMemo(() => contentBounds(layout.nodes), [layout]);
  const nodeById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph],
  );
  const layoutRef = useRef(layout);
  const boundsRef = useRef(bounds);
  layoutRef.current = layout;
  boundsRef.current = bounds;

  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportSizeRef = useRef<Size | null>(null);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    viewX: number;
    viewY: number;
  } | null>(null);
  const fittedGraphId = useRef<string | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState(false);

  function commitView(next: ViewState) {
    const committed = commitViewState(
      viewRef.current,
      next,
      boundsRef.current,
      viewportSizeRef.current,
    );
    if (!committed.changed) {
      return;
    }
    viewRef.current = committed.view;
    setView(committed.view);
  }

  function currentSize(): Size | null {
    const measured = viewportSizeRef.current;
    if (measured && measured.width >= 2 && measured.height >= 2) {
      return measured;
    }
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 2 || rect.height < 2) {
      return null;
    }
    const size = { width: rect.width, height: rect.height };
    viewportSizeRef.current = size;
    return size;
  }

  function applyFit() {
    const size = currentSize();
    if (!size) {
      return false;
    }
    fittedGraphId.current = graph.id;
    commitView(fitChronicle(boundsRef.current, size));
    return true;
  }

  function applyReset() {
    const size = currentSize();
    if (!size) {
      return false;
    }
    commitView(resetZoom(boundsRef.current, size));
    return true;
  }

  function applyCenterSelected(nodeId = selectedIdRef.current) {
    const size = currentSize();
    if (!size || !nodeId) {
      return false;
    }
    const node = layoutRef.current.nodes.find((item) => item.id === nodeId);
    if (!node) {
      return false;
    }
    commitView(centerSelected(node, size, DEFAULT_INSETS, viewRef.current.scale));
    return true;
  }

  useImperativeHandle(ref, () => ({
    fitChronicle: () => {
      applyFit();
    },
    centerSelected: (nodeId?: string) => applyCenterSelected(nodeId),
    resetZoom: () => {
      applyReset();
    },
  }));

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width < 2 || rect.height < 2) {
        return;
      }
      const size = { width: rect.width, height: rect.height };
      viewportSizeRef.current = size;

      if (fittedGraphId.current !== graph.id) {
        fittedGraphId.current = graph.id;
        commitView(fitChronicle(boundsRef.current, size));
        return;
      }

      const selected = layoutRef.current.nodes.find(
        (item) => item.id === selectedIdRef.current,
      );
      if (
        selected &&
        !nodeIsVisible(selected, viewRef.current, size)
      ) {
        commitView(
          centerSelected(selected, size, DEFAULT_INSETS, viewRef.current.scale),
        );
        return;
      }
      commitView(clampPan(viewRef.current, boundsRef.current, size));
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, [graph.id]);

  useEffect(() => {
    if (fittedGraphId.current !== graph.id) {
      fittedGraphId.current = graph.id;
      applyFit();
      return;
    }
    if (selectedIdRef.current) {
      applyCenterSelected(selectedIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyFit reads layout refs.
  }, [graph.id, bounds]);

  useEffect(() => {
    function onWindowResize() {
      applyFit();
    }
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyFit reads layout refs.
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const surface = viewportRef.current;
      const size = currentSize();
      if (!surface || !size) {
        return;
      }
      const current = viewRef.current;
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      const nextScale = clampZoom(current.scale * factor);
      const rect = surface.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const contentX = (cursorX - current.x) / current.scale;
      const contentY = (cursorY - current.y) / current.scale;
      commitView({
        scale: nextScale,
        x: cursorX - contentX * nextScale,
        y: cursorY - contentY * nextScale,
      });
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    const size = currentSize();
    if (!size) {
      return;
    }
    const current = viewRef.current;
    const nextScale = clampZoom(current.scale * factor);
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const contentX = (centerX - current.x) / current.scale;
    const contentY = (centerY - current.y) / current.scale;
    commitView({
      scale: nextScale,
      x: centerX - contentX * nextScale,
      y: centerY - contentY * nextScale,
    });
  }

  const minZoom = isAtMinZoom(view.scale);
  const maxZoom = isAtMaxZoom(view.scale);

  return (
    <div
      ref={viewportRef}
      data-canvas-viewport="desktop"
      className={`chronicle-map${panning ? " is-panning" : ""}`}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("[data-chronicle-node]")) {
          return;
        }
        dragRef.current = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          viewX: viewRef.current.x,
          viewY: viewRef.current.y,
        };
        setPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        commitView({
          ...viewRef.current,
          x: drag.viewX + (event.clientX - drag.pointerX),
          y: drag.viewY + (event.clientY - drag.pointerY),
        });
      }}
      onPointerUp={() => {
        dragRef.current = null;
        setPanning(false);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setPanning(false);
      }}
    >
      <div className="chronicle-map-controls">
        <button
          type="button"
          className="chronicle-map-btn"
          onClick={() => applyFit()}
        >
          {dictionary.canvas.fitChronicle}
        </button>
        <button
          type="button"
          className="chronicle-map-btn"
          onClick={() => applyCenterSelected()}
          disabled={!selectedId}
          title={
            selectedId ? undefined : dictionary.canvas.centerSelectedDisabled
          }
          aria-disabled={!selectedId}
        >
          {dictionary.canvas.centerSelected}
        </button>
        <button
          type="button"
          className="chronicle-map-btn"
          onClick={() => zoomBy(1 / 1.15)}
          disabled={minZoom}
          title={minZoom ? dictionary.canvas.zoomMinReached : undefined}
        >
          {dictionary.canvas.zoomOut}
        </button>
        <button
          type="button"
          className="chronicle-map-btn"
          onClick={() => applyReset()}
          aria-label={dictionary.canvas.resetZoom}
          title={dictionary.canvas.resetZoom}
        >
          {zoomPercent(view.scale)}%
        </button>
        <button
          type="button"
          className="chronicle-map-btn"
          onClick={() => zoomBy(1.15)}
          disabled={maxZoom}
          title={maxZoom ? dictionary.canvas.zoomMaxReached : undefined}
        >
          {dictionary.canvas.zoomIn}
        </button>
      </div>

      <div
        className="chronicle-stage"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
          focusable="false"
        >
          {layout.edges.map((edge) => {
            const target = nodeById.get(edge.target);
            const dismissed =
              target &&
              target.kind !== "decision" &&
              target.status === "dismissed";
            return (
              <path
                key={edge.id}
                className={`chronicle-thread${relatedEdgeIds.has(edge.id) ? " is-related" : ""}${dismissed ? " is-dismissed" : ""}`}
                d={edge.path}
              />
            );
          })}
        </svg>

        {layout.nodes.map((placed) => {
          const node = nodeById.get(placed.id);
          if (!node) {
            return null;
          }
          const selected = selectedId === node.id;
          const related = relatedNodeIds.has(node.id);
          return (
            <ChronicleNodeButton
              key={node.id}
              node={node}
              dictionary={dictionary}
              selected={selected}
              related={Boolean(selectedId) && related}
              dimmed={Boolean(selectedId) && !related}
              variant="map"
              style={{
                left: placed.x,
                top: placed.y,
                width: placed.width,
                height: placed.height,
              }}
              onSelect={onSelect}
              buttonRef={(element) => registerNode(node.id, element)}
            />
          );
        })}
      </div>
    </div>
  );
});
