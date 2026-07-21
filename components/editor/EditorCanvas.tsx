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
import DesktopPanCursor, {
  type DesktopPanCursorHandle,
  type DesktopPanCursorMode,
} from "./DesktopPanCursor";
import MobileCanvasZoomHud from "./MobileCanvasZoomHud";
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
  onTwoFingerGestureStart: () => void;
};

type DesktopPanGesture = {
  pointerId: number;
  mode: "space" | "middle";
  lastX: number;
  lastY: number;
};

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
const DISCRETE_ZOOM_DURATION = 160;

const isTextEditingTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );

const setNativeCursorHidden = (hidden: boolean) => {
  if (hidden) {
    document.documentElement.dataset.editorPanCursor = "active";
  } else {
    delete document.documentElement.dataset.editorPanCursor;
  }
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
  onTwoFingerGestureStart,
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
  const pageLockRef = useRef<{
    scrollX: number;
    scrollY: number;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyWidth: string;
    bodyOverflow: string;
    bodyOverscrollBehavior: string;
    documentOverflow: string;
    documentOverscrollBehavior: string;
  } | null>(null);
  const desktopPanGestureRef = useRef<DesktopPanGesture | null>(null);
  const desktopPanCursorRef = useRef<DesktopPanCursorHandle | null>(null);
  const desktopPanCursorModeRef = useRef<DesktopPanCursorMode | null>(
    null
  );
  const latestPointerRef = useRef({ x: 0, y: 0, valid: false });
  const cursorFrameRef = useRef<number | null>(null);
  const viewportRef = useRef(viewport);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const discreteZoomTargetRef = useRef<number | null>(null);
  const zoomFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const zoomFeedbackIdRef = useRef(0);
  const workspaceHoveredRef = useRef(false);
  const spacePressedRef = useRef(false);
  const [baseScale, setBaseScale] = useState(1);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [zoomFeedback, setZoomFeedback] = useState<{
    id: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

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
      usableHeight <= 0
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
      isDesktop && viewMode !== "fit"
        ? widthScale
        : Math.min(widthScale, heightScale);

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

  const cancelZoomAnimation = useCallback(() => {
    if (zoomAnimationFrameRef.current !== null) {
      cancelAnimationFrame(zoomAnimationFrameRef.current);
      zoomAnimationFrameRef.current = null;
    }
  }, []);

  const showZoomFeedback = useCallback((label: string) => {
    if (zoomFeedbackTimerRef.current) {
      clearTimeout(zoomFeedbackTimerRef.current);
    }

    zoomFeedbackIdRef.current += 1;
    setZoomFeedback({ id: zoomFeedbackIdRef.current, label });
    zoomFeedbackTimerRef.current = setTimeout(() => {
      setZoomFeedback(null);
      zoomFeedbackTimerRef.current = null;
    }, 900);
  }, []);

  const animateViewport = useCallback(
    (
      targetViewport: EditorViewport,
      label: string,
      onComplete?: () => void
    ) => {
      cancelZoomAnimation();
      showZoomFeedback(label);

      const startViewport = viewportRef.current;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) {
        onViewportChange(targetViewport);
        onComplete?.();
        return;
      }

      const startTime = performance.now();
      const step = (time: number) => {
        const progress = Math.min(
          1,
          (time - startTime) / DISCRETE_ZOOM_DURATION
        );
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextViewport = {
          zoom:
            startViewport.zoom +
            (targetViewport.zoom - startViewport.zoom) * easedProgress,
          panX:
            startViewport.panX +
            (targetViewport.panX - startViewport.panX) * easedProgress,
          panY:
            startViewport.panY +
            (targetViewport.panY - startViewport.panY) * easedProgress,
        };

        onViewportChange(nextViewport);

        if (progress < 1) {
          zoomAnimationFrameRef.current = requestAnimationFrame(step);
        } else {
          zoomAnimationFrameRef.current = null;
          onComplete?.();
        }
      };

      zoomAnimationFrameRef.current = requestAnimationFrame(step);
    },
    [cancelZoomAnimation, onViewportChange, showZoomFeedback]
  );

  const runDiscreteZoom = useCallback(
    (
      requestedZoom: number,
      label = `${Math.round(clampViewportZoom(requestedZoom) * 100)}%`,
      clientX?: number,
      clientY?: number
    ) => {
      const workspace = workspaceRef.current;

      if (!workspace) return;

      const bounds = workspace.getBoundingClientRect();
      const anchorX =
        (clientX ?? bounds.left + bounds.width / 2) -
        bounds.left -
        bounds.width / 2;
      const anchorY =
        (clientY ?? bounds.top + bounds.height / 2) -
        bounds.top -
        bounds.height / 2;
      const targetViewport = zoomViewportAtAnchor(
        viewportRef.current,
        requestedZoom,
        anchorX,
        anchorY
      );

      discreteZoomTargetRef.current = targetViewport.zoom;
      animateViewport(targetViewport, label);
    },
    [animateViewport]
  );

  const runZoomStep = useCallback(
    (direction: -1 | 1) => {
      const currentZoom =
        discreteZoomTargetRef.current ?? viewportRef.current.zoom;
      const nextZoom =
        direction === 1
          ? ZOOM_STEPS.find((zoom) => zoom > currentZoom + 0.001) ?? 5
          : [...ZOOM_STEPS]
              .reverse()
              .find((zoom) => zoom < currentZoom - 0.001) ?? 0.25;

      runDiscreteZoom(nextZoom);
    },
    [runDiscreteZoom]
  );

  const freezeDisplayedViewport = useCallback(() => {
    if (zoomAnimationFrameRef.current === null) return;

    cancelZoomAnimation();
    discreteZoomTargetRef.current = null;
    onViewportChange(viewportRef.current);
  }, [cancelZoomAnimation, onViewportChange]);

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
      cancelZoomAnimation();
      discreteZoomTargetRef.current = null;

      if (event.ctrlKey || event.metaKey) {
        const zoomFactor = Math.exp(-event.deltaY * 0.002);

        zoomAtPoint(
          (currentZoom) => currentZoom * zoomFactor,
          event.clientX,
          event.clientY
        );
        return;
      }

      const deltaUnit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? workspace.clientHeight
            : 1;

      onViewportChange((currentViewport) => ({
        ...currentViewport,
        panX: currentViewport.panX - event.deltaX * deltaUnit,
        panY: currentViewport.panY - event.deltaY * deltaUnit,
      }));
    };

    workspace.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => workspace.removeEventListener("wheel", handleWheel);
  }, [cancelZoomAnimation, onViewportChange, zoomAtPoint]);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) return;

    let eligibleEditorSequence = false;
    const activeEditorTouchIds = new Set<number>();

    const addChangedTouches = (touches: TouchList) => {
      for (let index = 0; index < touches.length; index += 1) {
        activeEditorTouchIds.add(touches[index].identifier);
      }
    };

    const removeChangedTouches = (touches: TouchList) => {
      for (let index = 0; index < touches.length; index += 1) {
        activeEditorTouchIds.delete(touches[index].identifier);
      }
    };

    const startsOnExcludedControl = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return true;

      if (target.closest("[data-canvas-item-id]")) return false;

      const protectedArea = target.closest(
        "[data-editor-retain-selection]"
      );

      if (protectedArea && protectedArea !== workspace) return true;

      return Boolean(
        target.closest(
          "button, a, input, textarea, select, [contenteditable='true'], [role='menu'], [role='slider']"
        )
      );
    };

    const lockPage = () => {
      if (pageLockRef.current) return;

      const body = document.body;
      const documentElement = document.documentElement;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      pageLockRef.current = {
        scrollX,
        scrollY,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyWidth: body.style.width,
        bodyOverflow: body.style.overflow,
        bodyOverscrollBehavior: body.style.overscrollBehavior,
        documentOverflow: documentElement.style.overflow,
        documentOverscrollBehavior:
          documentElement.style.overscrollBehavior,
      };

      body.style.position = "fixed";
      body.style.top = `${-scrollY}px`;
      body.style.left = `${-scrollX}px`;
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
    };

    const unlockPage = () => {
      const lock = pageLockRef.current;

      if (!lock) return;

      const body = document.body;
      const documentElement = document.documentElement;

      body.style.position = lock.bodyPosition;
      body.style.top = lock.bodyTop;
      body.style.left = lock.bodyLeft;
      body.style.width = lock.bodyWidth;
      body.style.overflow = lock.bodyOverflow;
      body.style.overscrollBehavior = lock.bodyOverscrollBehavior;
      documentElement.style.overflow = lock.documentOverflow;
      documentElement.style.overscrollBehavior =
        lock.documentOverscrollBehavior;
      pageLockRef.current = null;
      window.scrollTo(lock.scrollX, lock.scrollY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (window.matchMedia("(min-width: 768px)").matches) return;

      if (event.touches.length === 1) {
        eligibleEditorSequence =
          workspace.contains(event.target as Node) &&
          !startsOnExcludedControl(event.target);

        activeEditorTouchIds.clear();

        if (eligibleEditorSequence) {
          addChangedTouches(event.changedTouches);
        }

        return;
      }

      if (pageLockRef.current) {
        addChangedTouches(event.changedTouches);

        if (event.cancelable) {
          event.preventDefault();
        }

        return;
      }

      if (
        event.touches.length !== 2 ||
        !eligibleEditorSequence
      ) {
        return;
      }

      addChangedTouches(event.changedTouches);
      onTwoFingerGestureStart();
      lockPage();

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pageLockRef.current || !event.cancelable) return;

      event.preventDefault();
    };

    const finishTouchSequence = (event: TouchEvent) => {
      if (!eligibleEditorSequence) return;

      removeChangedTouches(event.changedTouches);

      if (activeEditorTouchIds.size > 0) return;

      eligibleEditorSequence = false;
      unlockPage();
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchend", finishTouchSequence, true);
    document.addEventListener("touchcancel", finishTouchSequence, true);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("touchmove", handleTouchMove, true);
      document.removeEventListener("touchend", finishTouchSequence, true);
      document.removeEventListener(
        "touchcancel",
        finishTouchSequence,
        true
      );
      eligibleEditorSequence = false;
      activeEditorTouchIds.clear();
      unlockPage();
    };
  }, [onTwoFingerGestureStart]);

  const setDesktopPanCursor = useCallback(
    (mode: DesktopPanCursorMode | null) => {
      desktopPanCursorModeRef.current = mode;
      setNativeCursorHidden(mode !== null);

      if (!mode) {
        desktopPanCursorRef.current?.hide();
        return;
      }

      const pointer = latestPointerRef.current;

      if (pointer.valid) {
        desktopPanCursorRef.current?.show(mode, pointer.x, pointer.y);
      } else {
        desktopPanCursorRef.current?.hide();
      }
    },
    []
  );

  const updateDesktopPanCursorPosition = useCallback(
    (clientX: number, clientY: number) => {
      latestPointerRef.current = {
        x: clientX,
        y: clientY,
        valid: true,
      };

      if (
        !desktopPanCursorModeRef.current ||
        cursorFrameRef.current !== null
      ) {
        return;
      }

      cursorFrameRef.current = requestAnimationFrame(() => {
        cursorFrameRef.current = null;
        const pointer = latestPointerRef.current;

        if (pointer.valid && desktopPanCursorModeRef.current) {
          desktopPanCursorRef.current?.move(pointer.x, pointer.y);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      updateDesktopPanCursorPosition(event.clientX, event.clientY);
    };

    document.addEventListener("pointermove", trackPointer, {
      passive: true,
    });

    return () => {
      document.removeEventListener("pointermove", trackPointer);

      if (cursorFrameRef.current !== null) {
        cancelAnimationFrame(cursorFrameRef.current);
        cursorFrameRef.current = null;
      }
    };
  }, [updateDesktopPanCursorPosition]);

  const finishDesktopPan = useCallback((pointerId?: number) => {
    const workspace = workspaceRef.current;
    const activeGesture = desktopPanGestureRef.current;

    if (
      pointerId !== undefined &&
      activeGesture?.pointerId !== pointerId
    ) {
      return;
    }

    if (
      workspace &&
      activeGesture &&
      workspace.hasPointerCapture(activeGesture.pointerId)
    ) {
      workspace.releasePointerCapture(activeGesture.pointerId);
    }

    desktopPanGestureRef.current = null;
    setDesktopPanCursor(spacePressedRef.current ? "open" : null);
  }, [setDesktopPanCursor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        isTextEditingTarget(event.target) ||
        !window.matchMedia("(min-width: 768px)").matches ||
        (!workspaceHoveredRef.current && !spacePressedRef.current)
      ) {
        return;
      }

      event.preventDefault();

      if (event.repeat || spacePressedRef.current) return;

      spacePressedRef.current = true;
      setDesktopPanCursor("open");
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !spacePressedRef.current) return;

      event.preventDefault();
      spacePressedRef.current = false;

      if (desktopPanGestureRef.current?.mode === "space") {
        finishDesktopPan();
      } else {
        setDesktopPanCursor(null);
      }
    };

    const handleWindowBlur = () => {
      spacePressedRef.current = false;
      finishDesktopPan();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") return;

      spacePressedRef.current = false;
      finishDesktopPan();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      setDesktopPanCursor(null);
    };
  }, [finishDesktopPan, setDesktopPanCursor]);

  const startDesktopPan: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const target = event.target;
    const startsOnCanvasItem =
      event.button === 0 &&
      target instanceof Element &&
      Boolean(target.closest("[data-canvas-item-id]"));

    if (startsOnCanvasItem) {
      freezeDisplayedViewport();
    }

    const mode =
      event.button === 1
        ? "middle"
        : event.button === 0 && spacePressedRef.current
          ? "space"
          : null;

    if (
      !mode ||
      (mode === "space" && isTextEditingTarget(event.target))
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    cancelZoomAnimation();
    discreteZoomTargetRef.current = null;
    updateDesktopPanCursorPosition(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
    desktopPanGestureRef.current = {
      pointerId: event.pointerId,
      mode,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    if (mode === "space" || spacePressedRef.current) {
      setDesktopPanCursor("grabbing");
    }
  };

  const moveDesktopPan: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    const activeGesture = desktopPanGestureRef.current;

    if (!activeGesture || activeGesture.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.();
    const latestEvent =
      coalescedEvents && coalescedEvents.length > 0
        ? coalescedEvents[coalescedEvents.length - 1]
        : event;

    updateDesktopPanCursorPosition(
      latestEvent.clientX,
      latestEvent.clientY
    );

    const deltaX = event.clientX - activeGesture.lastX;
    const deltaY = event.clientY - activeGesture.lastY;
    activeGesture.lastX = event.clientX;
    activeGesture.lastY = event.clientY;

    onViewportChange((currentViewport) => ({
      ...currentViewport,
      panX: currentViewport.panX + deltaX,
      panY: currentViewport.panY + deltaY,
    }));
  };

  const endDesktopPan: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (desktopPanGestureRef.current?.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.type !== "pointercancel") {
      updateDesktopPanCursorPosition(event.clientX, event.clientY);
    }

    finishDesktopPan(event.pointerId);
  };

  const runViewMode = useCallback(
    (mode: CanvasViewMode) => {
      const measurement = lastValidMeasurementRef.current;

      if (!measurement) return;

      const widthScale = measurement.width / LOGICAL_CANVAS_WIDTH;
      const heightScale = measurement.height / LOGICAL_CANVAS_HEIGHT;
      const targetScale =
        mode === "fit" ? Math.min(widthScale, heightScale) : widthScale;
      const targetViewport = {
        zoom: targetScale / baseScale,
        panX: 0,
        panY: 0,
      };

      discreteZoomTargetRef.current = null;
      animateViewport(
        targetViewport,
        mode === "fit" ? "Fit" : "Fill",
        () => {
          const reset = { zoom: 1, panX: 0, panY: 0 };

          setBaseScale(targetScale);
          onViewModeChange(mode);
          onViewportChange(reset);
        }
      );
    },
    [animateViewport, baseScale, onViewModeChange, onViewportChange]
  );

  const centerCanvas = useCallback(() => {
    cancelZoomAnimation();
    discreteZoomTargetRef.current = null;

    animateViewport(
      {
        ...viewportRef.current,
        panX: 0,
        panY: 0,
      },
      "Centered"
    );
  }, [animateViewport, cancelZoomAnimation]);

  const resetZoom = useCallback(() => {
    cancelZoomAnimation();
    discreteZoomTargetRef.current = 1;

    animateViewport(
      {
        ...viewportRef.current,
        zoom: 1,
      },
      "100%"
    );
  }, [animateViewport, cancelZoomAnimation]);

  useEffect(() => {
    const handleViewportShortcut = (event: KeyboardEvent) => {
      if (
        !window.matchMedia("(min-width: 768px)").matches ||
        !workspaceHoveredRef.current ||
        (!event.metaKey && !event.ctrlKey) ||
        editingItemId !== null ||
        isTextEditingTarget(event.target)
      ) {
        return;
      }

      if (event.code === "Digit0") {
        event.preventDefault();
        runViewMode("fit");
      } else if (event.code === "Digit1") {
        event.preventDefault();
        runDiscreteZoom(1, "100%");
      } else if (
        event.code === "NumpadAdd" ||
        event.code === "Equal" ||
        event.key === "+"
      ) {
        event.preventDefault();
        runZoomStep(1);
      } else if (
        event.code === "NumpadSubtract" ||
        event.code === "Minus"
      ) {
        event.preventDefault();
        runZoomStep(-1);
      }
    };

    window.addEventListener("keydown", handleViewportShortcut, true);

    return () =>
      window.removeEventListener(
        "keydown",
        handleViewportShortcut,
        true
      );
  }, [editingItemId, runDiscreteZoom, runViewMode, runZoomStep]);

  useEffect(
    () => () => {
      cancelZoomAnimation();

      if (zoomFeedbackTimerRef.current) {
        clearTimeout(zoomFeedbackTimerRef.current);
        zoomFeedbackTimerRef.current = null;
      }
    },
    [cancelZoomAnimation]
  );

  const handleWorkspaceDoubleClick: React.MouseEventHandler<
    HTMLDivElement
  > = (event) => {
    if (
      !window.matchMedia("(min-width: 768px)").matches ||
      desktopPanGestureRef.current ||
      editingItemId !== null
    ) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Element &&
      target.closest(
        "[data-canvas-item-id], button, a, input, textarea, select, [contenteditable='true'], [role='menu'], [role='slider']"
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (Math.abs(viewportRef.current.zoom - 1) > 0.01) {
      runDiscreteZoom(1, "100%", event.clientX, event.clientY);
    } else {
      runViewMode("fit");
    }
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

    cancelZoomAnimation();
    discreteZoomTargetRef.current = null;

    const workspace = workspaceRef.current;

    if (!workspace) return;

    const selectedItemElement = selectedItemId
      ? Array.from(
          workspace.querySelectorAll<HTMLElement>(
            "[data-canvas-item-id]"
          )
        ).find(
          (element) =>
            element.dataset.canvasItemId === selectedItemId
        )
      : undefined;
    const selectedItemBounds =
      selectedItemElement?.getBoundingClientRect();
    const pinchHitPadding = 24;
    const mobileLayout = window.matchMedia(
      "(max-width: 767px)"
    ).matches;
    const target = event.target;
    const touchesSelectedItem = mobileLayout
      ? Boolean(
          selectedItemBounds &&
            Array.from(event.touches).some(
              (touch) =>
                touch.clientX >=
                  selectedItemBounds.left - pinchHitPadding &&
                touch.clientX <=
                  selectedItemBounds.right + pinchHitPadding &&
                touch.clientY >=
                  selectedItemBounds.top - pinchHitPadding &&
                touch.clientY <=
                  selectedItemBounds.bottom + pinchHitPadding
            )
        )
      : Boolean(
          target instanceof HTMLElement &&
            selectedItemId !== null &&
            target.closest(
              `[data-canvas-item-id="${selectedItemId}"]`
            )
        );

    if (touchesSelectedItem) {
      viewportGestureRef.current = { mode: "item" };
      onTouchStartCapture(event);
      return;
    }

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
      {isDesktopLayout && (
        <DesktopPanCursor ref={desktopPanCursorRef} />
      )}
      <div
        data-editor-retain-selection
        className="mb-1 hidden h-10 items-center justify-between gap-2 md:flex"
      >
        <div>{toolbar}</div>
        <div className="relative">
          {zoomFeedback && (
            <div className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 z-[60] -translate-y-1/2">
              <div
                key={zoomFeedback.id}
                aria-hidden="true"
                className="rounded-lg border border-white/10 bg-slate-900/95 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white shadow-lg animate-[zoom-feedback_900ms_ease-out_forwards]"
              >
                {zoomFeedback.label}
              </div>
            </div>
          )}
          <CanvasViewModeControl
            zoom={viewport.zoom}
            onZoomIn={() => runZoomStep(1)}
            onZoomOut={() => runZoomStep(-1)}
            onZoomChange={(zoom) => runDiscreteZoom(zoom)}
            onResetZoom={resetZoom}
            onCenter={centerCanvas}
          />
        </div>
      </div>

      <div
        ref={workspaceRef}
        data-editor-retain-selection
        onPointerEnter={(event) => {
          workspaceHoveredRef.current = true;
          updateDesktopPanCursorPosition(event.clientX, event.clientY);
        }}
        onPointerLeave={() => {
          workspaceHoveredRef.current = false;
        }}
        onPointerDownCapture={startDesktopPan}
        onPointerMoveCapture={moveDesktopPan}
        onPointerUpCapture={endDesktopPan}
        onPointerCancelCapture={endDesktopPan}
        onLostPointerCapture={() => finishDesktopPan()}
        onDoubleClickCapture={handleWorkspaceDoubleClick}
        onTouchStartCapture={startTouchGesture}
        onTouchMoveCapture={moveTouchGesture}
        onTouchEndCapture={endTouchGesture}
        onTouchCancelCapture={cancelTouchGesture}
        className={`relative -mx-2 w-[calc(100%+1rem)] touch-pan-y overflow-hidden md:mx-0 md:min-h-0 md:w-full md:flex-1 md:touch-auto md:overscroll-none md:overflow-x-hidden md:px-2 md:pb-2 ${
          viewMode === "fill"
            ? "md:overflow-y-auto"
            : "md:overflow-y-hidden"
        }`}
        style={{
          height: isDesktopLayout
            ? undefined
            : "clamp(17.5rem, 36dvh, 19rem)",
        }}
      >
          <MobileCanvasZoomHud
            zoom={viewport.zoom}
            onZoomOut={() => zoomAtPoint(viewport.zoom / 1.25)}
            onZoomIn={() => zoomAtPoint(viewport.zoom * 1.25)}
            onZoomChange={(zoom) => zoomAtPoint(zoom)}
            onReset={() => {
              cancelZoomAnimation();
              discreteZoomTargetRef.current = null;
              onViewportChange({ zoom: 1, panX: 0, panY: 0 });
            }}
            onFit={() => {
              cancelZoomAnimation();
              discreteZoomTargetRef.current = null;
              onViewModeChange("fit");
              onViewportChange({ zoom: 1, panX: 0, panY: 0 });
            }}
          />
          <div
            data-canvas-viewport
            className="absolute"
            style={{
              left: `calc(50% + ${
                viewport.panX -
                (LOGICAL_CANVAS_WIDTH * displayScale) / 2
              }px)`,
              top: `calc(50% + ${
                viewport.panY -
                (LOGICAL_CANVAS_HEIGHT * displayScale) / 2
              }px)`,
              width: LOGICAL_CANVAS_WIDTH * displayScale,
              height: LOGICAL_CANVAS_HEIGHT * displayScale,
            }}
          >
            <div
              ref={canvasRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onPointerDown={onPointerDown}
              className="relative touch-pan-y overflow-hidden rounded-xl bg-white text-slate-500 select-none md:touch-none"
              style={{
                width: LOGICAL_CANVAS_WIDTH,
                height: LOGICAL_CANVAS_HEIGHT,
                zoom: isDesktopLayout ? displayScale : undefined,
                transform: isDesktopLayout
                  ? undefined
                  : `scale(${displayScale})`,
                transformOrigin: isDesktopLayout ? undefined : "top left",
                WebkitUserSelect: "none",
                userSelect: "none",
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
                  mobileLayout={!isDesktopLayout}
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
    </div>
  );
}
