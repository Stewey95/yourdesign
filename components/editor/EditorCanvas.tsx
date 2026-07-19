"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import AlignmentGuides from "./AlignmentGuides";
import CanvasViewModeControl from "./CanvasViewModeControl";
import CanvasItem from "./CanvasItem";
import type { TextResizeCorner } from "./CanvasTextItem";
import {
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
} from "./editor.constants";
import type {
  DesignItem,
  ImageDesignItem,
  TextDesignItem,
} from "./editor.types";
import type { CanvasViewMode } from "./CanvasViewModeControl";
import {
  clampViewportZoom,
  type EditorViewport,
  zoomViewportAtAnchor,
} from "./editor.viewport";

type EditorCanvasProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  toolbar: ReactNode;
  viewMode: CanvasViewMode;
  onViewModeChange: (mode: CanvasViewMode) => void;
  viewport: EditorViewport;
  onViewportChange: Dispatch<SetStateAction<EditorViewport>>;
  items: DesignItem[];
  selectedItemId: string | null;
  editingItemId: string | null;
  verticalGuide: boolean;
  horizontalGuide: boolean;
  onTouchStartCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchMoveCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchEndCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchCancelCapture: React.TouchEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onImagePointerDown: (id: string) => void;
  onImageResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: ImageDesignItem
  ) => void;
  onTextResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    item: TextDesignItem,
    corner: TextResizeCorner
  ) => void;
  onRequestAutoFit: (
    id: string,
    textarea: HTMLTextAreaElement
  ) => void;
  onTextValueChange: (id: string, value: string) => void;
  onRemoveEmptyText: (id: string) => void;
  onFinishEditing: () => void;
  onEditingPointerDown: (id: string) => void;
  onPendingDragStart: (
    id: string,
    startX: number,
    startY: number
  ) => void;
};

export default function EditorCanvas({
  canvasRef,
  toolbar,
  viewMode,
  onViewModeChange,
  viewport,
  onViewportChange,
  items,
  selectedItemId,
  editingItemId,
  verticalGuide,
  horizontalGuide,
  onTouchStartCapture,
  onTouchMoveCapture,
  onTouchEndCapture,
  onTouchCancelCapture,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerDown,
  onImagePointerDown,
  onImageResizeStart,
  onTextResizeStart,
  onRequestAutoFit,
  onTextValueChange,
  onRemoveEmptyText,
  onFinishEditing,
  onEditingPointerDown,
  onPendingDragStart,
}: EditorCanvasProps) {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const measurementFrameRef = useRef<number | null>(null);
  const lastValidMeasurementRef = useRef<{
    width: number;
    height: number;
  } | null>(null);
  const viewportGestureRef = useRef<
    | { mode: "item" }
    | {
        mode: "viewport";
        startDistance: number;
        startCenterX: number;
        startCenterY: number;
        startZoom: number;
        startPanX: number;
        startPanY: number;
        workspaceCenterX: number;
        workspaceCenterY: number;
      }
    | null
  >(null);
  const [baseScale, setBaseScale] = useState(1);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  const updateDisplayScale = useCallback(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const workspaceStyle = window.getComputedStyle(workspace);
    const horizontalPadding =
      Number.parseFloat(workspaceStyle.paddingLeft) +
      Number.parseFloat(workspaceStyle.paddingRight);
    const verticalPadding =
      Number.parseFloat(workspaceStyle.paddingTop) +
      Number.parseFloat(workspaceStyle.paddingBottom);
    const usableWidth = Math.max(
      0,
      workspace.clientWidth - horizontalPadding
    );
    const usableHeight = Math.max(
      0,
      workspace.clientHeight - verticalPadding
    );

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (
      usableWidth <= 0 ||
      (isDesktop && usableHeight <= 0)
    ) {
      return;
    }

    lastValidMeasurementRef.current = {
      width: usableWidth,
      height: usableHeight,
    };

    const widthScale = usableWidth / LOGICAL_CANVAS_WIDTH;
    const heightScale = usableHeight / LOGICAL_CANVAS_HEIGHT;
    const nextScale =
      isDesktop && viewMode === "fit" && heightScale > 0
        ? Math.min(widthScale, heightScale)
        : widthScale;

    setIsDesktopLayout(isDesktop);

    setBaseScale((currentScale) =>
      Math.abs(currentScale - nextScale) > 0.001
        ? nextScale
        : currentScale
    );
  }, [viewMode]);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const scheduleDisplayScaleUpdate = () => {
      if (measurementFrameRef.current !== null) {
        cancelAnimationFrame(measurementFrameRef.current);
      }

      measurementFrameRef.current = requestAnimationFrame(() => {
        measurementFrameRef.current = null;
        updateDisplayScale();
      });
    };

    const resizeObserver = new ResizeObserver(
      scheduleDisplayScaleUpdate
    );
    resizeObserver.observe(workspace);
    scheduleDisplayScaleUpdate();
    window.addEventListener("resize", scheduleDisplayScaleUpdate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleDisplayScaleUpdate);

      if (measurementFrameRef.current !== null) {
        cancelAnimationFrame(measurementFrameRef.current);
        measurementFrameRef.current = null;
      }
    };
  }, [updateDisplayScale]);

  const zoomAtPoint = useCallback(
    (
      requestedZoom: number | ((currentZoom: number) => number),
      clientX?: number,
      clientY?: number
    ) => {
      const workspace = workspaceRef.current;

      if (!workspace) return;

      const workspaceBounds = workspace.getBoundingClientRect();
      const anchorX =
        (clientX ?? workspaceBounds.left + workspaceBounds.width / 2) -
        workspaceBounds.left -
        workspaceBounds.width / 2;
      const anchorY =
        (clientY ?? workspaceBounds.top + workspaceBounds.height / 2) -
        workspaceBounds.top -
        workspaceBounds.height / 2;

      onViewportChange((currentViewport) =>
        zoomViewportAtAnchor(
          currentViewport,
          typeof requestedZoom === "function"
            ? requestedZoom(currentViewport.zoom)
            : requestedZoom,
          anchorX,
          anchorY
        )
      );
    },
    [onViewportChange]
  );

  const resetViewport = useCallback(() => {
    onViewportChange({ zoom: 1, panX: 0, panY: 0 });
  }, [onViewportChange]);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    const handleWheel = (event: WheelEvent) => {
      if (!window.matchMedia("(min-width: 768px)").matches) return;

      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        const zoomFactor = Math.exp(-event.deltaY * 0.002);

        zoomAtPoint(
          (currentZoom) => currentZoom * zoomFactor,
          event.clientX,
          event.clientY
        );
      } else {
        onViewportChange((currentViewport) => ({
          ...currentViewport,
          panX: currentViewport.panX - event.deltaX,
          panY: currentViewport.panY - event.deltaY,
        }));
      }
    };

    workspace.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => workspace.removeEventListener("wheel", handleWheel);
  }, [onViewportChange, zoomAtPoint]);

  const fitViewport = () => {
    onViewModeChange("fit");
    resetViewport();
  };

  const changeViewMode = (mode: CanvasViewMode) => {
    onViewModeChange(mode);
    resetViewport();
  };

  const getTouchGesture = (touches: React.TouchList) => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];
    const deltaX = firstTouch.clientX - secondTouch.clientX;
    const deltaY = firstTouch.clientY - secondTouch.clientY;

    return {
      distance: Math.hypot(deltaX, deltaY),
      centerX: (firstTouch.clientX + secondTouch.clientX) / 2,
      centerY: (firstTouch.clientY + secondTouch.clientY) / 2,
    };
  };

  const startTouchGesture: React.TouchEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.touches.length !== 2) return;

    const target = event.target;
    const selectedItemTarget =
      target instanceof HTMLElement &&
      selectedItemId !== null &&
      target.closest(`[data-canvas-item-id="${selectedItemId}"]`);

    if (selectedItemTarget) {
      viewportGestureRef.current = { mode: "item" };
      onTouchStartCapture(event);
      return;
    }

    const workspace = workspaceRef.current;

    if (!workspace) return;

    event.preventDefault();
    event.stopPropagation();

    const gesture = getTouchGesture(event.touches);
    const workspaceBounds = workspace.getBoundingClientRect();

    viewportGestureRef.current = {
      mode: "viewport",
      startDistance: gesture.distance,
      startCenterX: gesture.centerX,
      startCenterY: gesture.centerY,
      startZoom: viewport.zoom,
      startPanX: viewport.panX,
      startPanY: viewport.panY,
      workspaceCenterX: workspaceBounds.left + workspaceBounds.width / 2,
      workspaceCenterY: workspaceBounds.top + workspaceBounds.height / 2,
    };
  };

  const moveTouchGesture: React.TouchEventHandler<HTMLDivElement> = (
    event
  ) => {
    const activeGesture = viewportGestureRef.current;

    if (!activeGesture || event.touches.length !== 2) return;

    if (activeGesture.mode === "item") {
      onTouchMoveCapture(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const gesture = getTouchGesture(event.touches);
    const startDistance = activeGesture.startDistance;
    const startZoom = activeGesture.startZoom;
    const startCenterX = activeGesture.startCenterX;
    const startCenterY = activeGesture.startCenterY;
    const startPanX = activeGesture.startPanX;
    const startPanY = activeGesture.startPanY;
    const workspaceCenterX = activeGesture.workspaceCenterX;
    const workspaceCenterY = activeGesture.workspaceCenterY;
    const nextZoom = clampViewportZoom(
      startZoom * (gesture.distance / startDistance)
    );
    const zoomRatio = nextZoom / startZoom;
    const startAnchorX = startCenterX - workspaceCenterX;
    const startAnchorY = startCenterY - workspaceCenterY;

    onViewportChange({
      zoom: nextZoom,
      panX:
        startPanX +
        (gesture.centerX - startCenterX) +
        (1 - zoomRatio) * (startAnchorX - startPanX),
      panY:
        startPanY +
        (gesture.centerY - startCenterY) +
        (1 - zoomRatio) * (startAnchorY - startPanY),
    });
  };

  const endTouchGesture: React.TouchEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (viewportGestureRef.current?.mode === "item") {
      onTouchEndCapture(event);
    }

    viewportGestureRef.current = null;
  };

  const cancelTouchGesture: React.TouchEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (viewportGestureRef.current?.mode === "item") {
      onTouchCancelCapture(event);
    }

    viewportGestureRef.current = null;
  };

  const displayScale = baseScale * viewport.zoom;

  return (
    <div className="order-first min-w-0 md:order-none md:flex md:h-full md:min-h-0 md:flex-col">
      <div
        data-editor-retain-selection
        className="mb-1 hidden h-10 items-center justify-between gap-2 md:flex"
      >
        <div>{toolbar}</div>
        <CanvasViewModeControl
          mode={viewMode}
          zoom={viewport.zoom}
          onChange={changeViewMode}
          onZoomIn={() => zoomAtPoint(viewport.zoom * 1.25)}
          onZoomOut={() => zoomAtPoint(viewport.zoom / 1.25)}
          onZoomChange={(zoom) => zoomAtPoint(zoom)}
          onReset={resetViewport}
          onFit={fitViewport}
        />
      </div>

      <div
        ref={workspaceRef}
        data-editor-retain-selection
        onTouchStartCapture={startTouchGesture}
        onTouchMoveCapture={moveTouchGesture}
        onTouchEndCapture={endTouchGesture}
        onTouchCancelCapture={cancelTouchGesture}
        className={`relative w-full overflow-hidden md:min-h-0 md:flex-1 md:overflow-x-hidden md:px-2 md:pb-2 ${
          viewMode === "fill"
            ? "md:overflow-y-auto"
            : "md:overflow-y-hidden"
        }`}
        style={{
          height: isDesktopLayout
            ? undefined
            : LOGICAL_CANVAS_HEIGHT * baseScale,
        }}
      >
          <div
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerDown={onPointerDown}
            className="absolute overflow-hidden rounded-xl bg-white text-slate-500 touch-none select-none"
            style={{
              left: `calc(50% + ${viewport.panX}px)`,
              top: `calc(50% + ${viewport.panY}px)`,
              width: LOGICAL_CANVAS_WIDTH,
              height: LOGICAL_CANVAS_HEIGHT,
              transform: `translate(-50%, -50%) scale(${displayScale})`,
              transformOrigin: "center",
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              overscrollBehavior: "contain",
            }}
          >
            {items.length === 0 && (
              <p className="flex h-full items-center justify-center">
                Your design canvas
              </p>
            )}
            <AlignmentGuides
              vertical={verticalGuide}
              horizontal={horizontalGuide}
            />

            {items.map((item) =>
              item.type === "image" ? (
                <CanvasItem
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  displayScale={displayScale}
                  onPointerDown={onImagePointerDown}
                  onResizeStart={onImageResizeStart}
                />
              ) : (
                <CanvasItem
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  editing={editingItemId === item.id}
                  displayScale={displayScale}
                  onRequestAutoFit={onRequestAutoFit}
                  onValueChange={onTextValueChange}
                  onRemoveEmptyText={onRemoveEmptyText}
                  onFinishEditing={onFinishEditing}
                  onEditingPointerDown={onEditingPointerDown}
                  onPendingDragStart={onPendingDragStart}
                  onResizeStart={onTextResizeStart}
                />
              )
            )}
          </div>
      </div>
    </div>
  );
}
