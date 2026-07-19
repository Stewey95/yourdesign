import {
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
} from "./editor.constants";

export const MIN_VIEWPORT_ZOOM = 0.25;
export const MAX_VIEWPORT_ZOOM = 5;

export type EditorViewport = {
  zoom: number;
  panX: number;
  panY: number;
};

export const clampViewportZoom = (zoom: number) =>
  Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom));

export const zoomViewportAtAnchor = (
  viewport: EditorViewport,
  requestedZoom: number,
  anchorX = 0,
  anchorY = 0
): EditorViewport => {
  const zoom = clampViewportZoom(requestedZoom);
  const zoomRatio = zoom / viewport.zoom;

  return {
    zoom,
    panX: anchorX - (anchorX - viewport.panX) * zoomRatio,
    panY: anchorY - (anchorY - viewport.panY) * zoomRatio,
  };
};

export const getCanvasDisplayScale = (bounds: DOMRect) =>
  bounds.width / LOGICAL_CANVAS_WIDTH;

export const getCanvasInteractionBounds = (canvas: HTMLElement) => {
  const viewport = canvas.parentElement;

  return viewport?.hasAttribute("data-canvas-viewport")
    ? viewport.getBoundingClientRect()
    : canvas.getBoundingClientRect();
};

export const screenPointToCanvas = (
  clientX: number,
  clientY: number,
  bounds: DOMRect
) => ({
  x:
    ((clientX - bounds.left) / bounds.width) *
    LOGICAL_CANVAS_WIDTH,
  y:
    ((clientY - bounds.top) / bounds.height) *
    LOGICAL_CANVAS_HEIGHT,
});
