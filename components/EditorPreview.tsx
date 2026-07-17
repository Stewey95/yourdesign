"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EditorCanvas from "./editor/EditorCanvas";
import type { CanvasViewMode } from "./editor/CanvasViewModeControl";
import EditorHeader from "./editor/EditorHeader";
import EditorInspector from "./editor/EditorInspector";
import EditorSidebar from "./editor/EditorSidebar";
import LayerToolbar from "./editor/LayerToolbar";
import MobileContextToolbar from "./editor/MobileContextToolbar";
import {
  clampFontSize,
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_MAX_WIDTH,
  DEFAULT_TEXT_FONT_SIZE,
  getBoundedImageSize,
  getInitialImageSize,
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
  SNAP_THRESHOLD,
} from "./editor/editor.constants";
import useEditorHistory from "./editor/useEditorHistory";
import type {
  DesignItem,
  Position,
} from "./editor/editor.types";

export default function EditorPreview() {
  const {
    present: items,
    canUndo,
    canRedo,
    commit: commitItems,
    updateTransaction: updateItems,
    beginTransaction: beginHistoryTransaction,
    commitTransaction: commitHistoryTransaction,
    isTransactionActive,
    undo: undoHistory,
    redo: redoHistory,
  } = useEditorHistory<DesignItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showImageAdjustments, setShowImageAdjustments] = useState(false);
  const [showMobileContextToolbar, setShowMobileContextToolbar] =
    useState(false);
  const [canvasViewMode, setCanvasViewMode] =
    useState<CanvasViewMode>("fit");
  const [activeToolbarPanel, setActiveToolbarPanel] = useState<
  "media" | "text" | "arrange" | "effects" | null
>(null);
  const [alignmentGuides, setAlignmentGuides] = useState({
  vertical: false,
  horizontal: false,
});
  const [desktopEditorHeight, setDesktopEditorHeight] = useState<
    number | undefined
  >(undefined);

  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const hideAlignmentGuides = () => {
  setAlignmentGuides({
    vertical: false,
    horizontal: false,
  });
};
const getSnappedPosition = (
  event: React.PointerEvent<HTMLDivElement>,
  canvasBounds: DOMRect
): Position => {
  const scaleX = canvasBounds.width / LOGICAL_CANVAS_WIDTH;
  const scaleY = canvasBounds.height / LOGICAL_CANVAS_HEIGHT;
  const rawX = (event.clientX - canvasBounds.left) / scaleX;
  const rawY = (event.clientY - canvasBounds.top) / scaleY;

  const canvasCentreX = LOGICAL_CANVAS_WIDTH / 2;
  const canvasCentreY = LOGICAL_CANVAS_HEIGHT / 2;
  const activeSnapThreshold =
  (event.pointerType === "touch" ? 18 : SNAP_THRESHOLD) / scaleX;

  const snapToVerticalCentre =
    Math.abs(rawX - canvasCentreX) <= activeSnapThreshold;

  const snapToHorizontalCentre =
    Math.abs(rawY - canvasCentreY) <= activeSnapThreshold;

  setAlignmentGuides({
    vertical: snapToVerticalCentre,
    horizontal: snapToHorizontalCentre,
  });

  return {
    x: snapToVerticalCentre ? canvasCentreX : rawX,
    y: snapToHorizontalCentre ? canvasCentreY : rawY,
  };
};
  const justPinchedRef = useRef(false);

  const selectedTextItem = items.find(
    (item): item is Extract<DesignItem, { type: "text" }> =>
      item.id === selectedItemId && item.type === "text"
  );

  const selectedImageItem = items.find(
    (item): item is Extract<DesignItem, { type: "image" }> =>
      item.id === selectedItemId && item.type === "image"
  );
  const selectedItem = selectedTextItem ?? selectedImageItem;
    const selectedItemIndex = items.findIndex(
    (item) => item.id === selectedItemId
  );

  const canSendBackward = selectedItemIndex > 0;

  const canBringForward =
    selectedItemIndex !== -1 &&
    selectedItemIndex < items.length - 1;

  const pendingDragRef = useRef<{
    itemId: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const pinchRef = useRef<{
    itemId: string;
    itemType: "image" | "text";
    startDistance: number;
    startWidth?: number;
    startHeight?: number;
    startFontSize?: number;
  } | null>(null);

  const canvasTapRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const pageInteractionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const activeResizeCleanupRef = useRef<(() => void) | null>(null);

  const reconcileAfterHistoryNavigation = useCallback((restoredItems: DesignItem[]) => {
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowImageAdjustments(false);
    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });

    const selectedItemSurvives =
      selectedItemId !== null &&
      restoredItems.some((item) => item.id === selectedItemId);

    if (!selectedItemSurvives) {
      setSelectedItemId(null);
      setShowMobileContextToolbar(false);
    }
  }, [selectedItemId]);

  const performUndo = useCallback(() => {
    if (!canUndo) return;

    const restoredItems = undoHistory();

    if (restoredItems) {
      reconcileAfterHistoryNavigation(restoredItems);
    }
  }, [canUndo, reconcileAfterHistoryNavigation, undoHistory]);

  const performRedo = useCallback(() => {
    if (!canRedo) return;

    const restoredItems = redoHistory();

    if (restoredItems) {
      reconcileAfterHistoryNavigation(restoredItems);
    }
  }, [canRedo, reconcileAfterHistoryNavigation, redoHistory]);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") ||
          target.isContentEditable ||
          Boolean(target.closest("[contenteditable='true']")))
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const usesCommandModifier = event.metaKey || event.ctrlKey;
      const requestsUndo =
        usesCommandModifier && key === "z" && !event.shiftKey;
      const requestsRedo =
        (usesCommandModifier && key === "z" && event.shiftKey) ||
        (event.ctrlKey && key === "y");

      if (requestsUndo && canUndo) {
        event.preventDefault();
        performUndo();
      } else if (requestsRedo && canRedo) {
        event.preventDefault();
        performRedo();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);

    return () => {
      window.removeEventListener("keydown", handleHistoryShortcut);
    };
  }, [
    canRedo,
    canUndo,
    performRedo,
    performUndo,
  ]);

  useEffect(() => {
    const editorShell = editorShellRef.current;

    if (!editorShell) return;

    const updateEditorHeight = () => {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        setDesktopEditorHeight(undefined);
        return;
      }

      const availableHeight =
        window.innerHeight - editorShell.getBoundingClientRect().top - 16;

      setDesktopEditorHeight(Math.max(480, availableHeight));
    };

    const initialMeasurementFrame = requestAnimationFrame(
      updateEditorHeight
    );
    window.addEventListener("resize", updateEditorHeight);

    return () => {
      cancelAnimationFrame(initialMeasurementFrame);
      window.removeEventListener("resize", updateEditorHeight);
    };
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const clearSelection = useCallback(() => {
    if (selectedItemId) {
      commitItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              item.id === selectedItemId &&
              item.type === "text" &&
              item.value.trim() === ""
            )
        )
      );
    }

    setSelectedItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });
  }, [commitItems, selectedItemId]);

  useEffect(() => {
    const isMobileViewport = () =>
      window.matchMedia("(max-width: 767px)").matches;

    const retainsSelection = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return true;

      if (canvasRef.current?.contains(target)) return true;

      return Boolean(
        target.closest(
          "button, a, input, textarea, select, [contenteditable='true'], [data-editor-retain-selection]"
        )
      );
    };

    const startPageInteraction = (event: PointerEvent) => {
      if (
        !selectedItemId ||
        !isMobileViewport() ||
        !event.isPrimary ||
        retainsSelection(event.target)
      ) {
        pageInteractionRef.current = null;
        return;
      }

      pageInteractionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
    };

    const trackPageInteraction = (event: PointerEvent) => {
      const interaction = pageInteractionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const horizontalDistance = Math.abs(
        event.clientX - interaction.startX
      );
      const verticalDistance = Math.abs(
        event.clientY - interaction.startY
      );

      if (horizontalDistance > 5 || verticalDistance > 5) {
        interaction.moved = true;
      }

      const scrollingElement = document.scrollingElement;
      const pageCanScroll = Boolean(
        scrollingElement &&
          scrollingElement.scrollHeight > scrollingElement.clientHeight
      );

      if (
        pageCanScroll &&
        verticalDistance > 8 &&
        verticalDistance > horizontalDistance
      ) {
        pageInteractionRef.current = null;
        setShowMobileContextToolbar(false);
        setShowImageAdjustments(false);
      }
    };

    const finishPageInteraction = (event: PointerEvent) => {
      const interaction = pageInteractionRef.current;

      pageInteractionRef.current = null;

      if (
        interaction &&
        interaction.pointerId === event.pointerId &&
        !interaction.moved &&
        event.isPrimary &&
        !retainsSelection(event.target)
      ) {
        clearSelection();
      }
    };

    const cancelPageInteraction = () => {
      pageInteractionRef.current = null;
    };

    document.addEventListener("pointerdown", startPageInteraction);
    document.addEventListener("pointermove", trackPageInteraction);
    document.addEventListener("pointerup", finishPageInteraction);
    document.addEventListener("pointercancel", cancelPageInteraction);

    return () => {
      document.removeEventListener("pointerdown", startPageInteraction);
      document.removeEventListener("pointermove", trackPageInteraction);
      document.removeEventListener("pointerup", finishPageInteraction);
      document.removeEventListener("pointercancel", cancelPageInteraction);
    };
  }, [clearSelection, selectedItemId]);

  const startCanvasTap = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      !event.isPrimary ||
      event.target !== event.currentTarget
    ) {
      canvasTapRef.current = null;
      return;
    }

    canvasTapRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const trackCanvasTap = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const canvasTap = canvasTapRef.current;

    if (!canvasTap || canvasTap.pointerId !== event.pointerId) {
      return;
    }

    if (
      Math.abs(event.clientX - canvasTap.startX) > 5 ||
      Math.abs(event.clientY - canvasTap.startY) > 5
    ) {
      canvasTap.moved = true;
    }
  };

  const finishCanvasTap = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const canvasTap = canvasTapRef.current;

    canvasTapRef.current = null;

    if (
      canvasTap &&
      canvasTap.pointerId === event.pointerId &&
      !canvasTap.moved &&
      event.isPrimary &&
      event.target === event.currentTarget &&
      !pinchRef.current
    ) {
      clearSelection();
    }

    stopDragging();
  };

  const cancelCanvasTap = () => {
    canvasTapRef.current = null;
    stopDragging();
  };

  const changeTextSize = (id: string, amount: number) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? {
              ...item,
              fontSize: clampFontSize(item.fontSize + amount),
            }
          : item
      )
    );
  };

  const changeTextColor = (id: string, color: string) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, color }
          : item
      )
    );
  };

  const changeTextFont = (id: string, fontFamily: string) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, fontFamily }
          : item
      )
    );
  };
  const fitTextInsideCanvas = (
  id: string,
  textarea: HTMLTextAreaElement
) => {
  const canvas = canvasRef.current;

  if (!canvas) return;

  const maximumTextHeight =
    canvas.clientHeight * 0.82;

  if (textarea.scrollHeight <= maximumTextHeight) {
    return;
  }

  beginHistoryTransaction();
  updateItems((currentItems) =>
    currentItems.map((item) => {
      if (item.id !== id || item.type !== "text") {
        return item;
      }

      const scale =
        maximumTextHeight / textarea.scrollHeight;

      return {
        ...item,
        fontSize: clampFontSize(
          Math.floor(item.fontSize * scale)
        ),
      };
    })
  );
};

  const rotateItem = (id: string, amount: number) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              rotation: item.rotation + amount,
            }
          : item
      )
    );
  };
    const moveItemLayer = (
    id: string,
    direction:
  | "forward"
  | "backward"
  | "front"
  | "back"
  ) => {
    commitItems((currentItems) => {
      const currentIndex = currentItems.findIndex(
        (item) => item.id === id
      );

      if (currentIndex === -1) {
        return currentItems;
      }
      if (direction === "front") {
  if (currentIndex === currentItems.length - 1) {
    return currentItems;
  }

  const reorderedItems = [...currentItems];

  const [selectedItem] = reorderedItems.splice(
    currentIndex,
    1
  );

  reorderedItems.push(selectedItem);

  return reorderedItems;
}
if (direction === "back") {
  if (currentIndex === 0) {
    return currentItems;
  }

  const reorderedItems = [...currentItems];

  const [selectedItem] = reorderedItems.splice(
    currentIndex,
    1
  );

  reorderedItems.unshift(selectedItem);

  return reorderedItems;
}

      const targetIndex =
        direction === "forward"
          ? currentIndex + 1
          : currentIndex - 1;

      if (
        targetIndex < 0 ||
        targetIndex >= currentItems.length
      ) {
        return currentItems;
      }

      const reorderedItems = [...currentItems];

      [
        reorderedItems[currentIndex],
        reorderedItems[targetIndex],
      ] = [
        reorderedItems[targetIndex],
        reorderedItems[currentIndex],
      ];

      return reorderedItems;
    });
  };

  const changeImageAdjustment = (
    id: string,
    adjustment: "brightness" | "contrast" | "saturation" | "opacity",
    value: number
  ) => {
    if (isTransactionActive()) {
      updateItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id && item.type === "image"
            ? {
                ...item,
                [adjustment]: value,
              }
            : item
        )
      );

      return;
    }

    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "image"
          ? {
              ...item,
              [adjustment]: value,
            }
          : item
      )
    );
  };

  const resetImageAdjustments = (id: string) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.type === "image"
          ? {
              ...item,
              brightness: 100,
              contrast: 100,
              saturation: 100,
              opacity: 100,
            }
          : item
      )
    );
  };

  const startCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !selectedItemId) return;

    const selectedItem = items.find(
      (item) => item.id === selectedItemId
    );

    if (!selectedItem) return;

    event.preventDefault();
    event.stopPropagation();

    commitHistoryTransaction();
    beginHistoryTransaction();

    pinchRef.current = {
      itemId: selectedItem.id,
      itemType: selectedItem.type,
      startDistance: getTouchDistance(event.touches),
      startWidth:
        selectedItem.type === "image"
          ? selectedItem.size.width
          : undefined,
      startHeight:
        selectedItem.type === "image"
          ? selectedItem.size.height
          : undefined,
      startFontSize:
        selectedItem.type === "text"
          ? selectedItem.fontSize
          : undefined,
    };

    justPinchedRef.current = true;
    pendingDragRef.current = null;
    setDraggingItemId(null);

    if (selectedItem.type === "image") {
      setEditingItemId(null);
    }
  };

  const moveCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const newDistance = getTouchDistance(event.touches);
    const scale =
      newDistance / pinchRef.current.startDistance;

    updateItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== pinchRef.current?.itemId) {
          return item;
        }

        if (item.type === "image") {
          const width =
            (pinchRef.current.startWidth || DEFAULT_IMAGE_MAX_WIDTH) *
            scale;
          const height =
            (pinchRef.current.startHeight || DEFAULT_IMAGE_MAX_HEIGHT) *
            scale;

          return {
            ...item,
            size: getBoundedImageSize(width, height),
          };
        }

        return {
          ...item,
          fontSize: clampFontSize(
            (pinchRef.current.startFontSize || DEFAULT_TEXT_FONT_SIZE) *
              scale
          ),
        };
      })
    );
  };

  const endCanvasPinch = () => {
    if (pinchRef.current) {
      commitHistoryTransaction();
      justPinchedRef.current = true;

      setTimeout(() => {
        justPinchedRef.current = false;
      }, 500);
    }

    pinchRef.current = null;
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const uploadedImage = new Image();

    uploadedImage.onload = () => {
      const newImage: DesignItem = {
        id: crypto.randomUUID(),
        type: "image",
        src: imageUrl,
        position: {
          x: LOGICAL_CANVAS_WIDTH / 2,
          y: LOGICAL_CANVAS_HEIGHT / 2,
        },
        size: getInitialImageSize(
          uploadedImage.naturalWidth,
          uploadedImage.naturalHeight
        ),
        rotation: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        opacity: 100,
      };

      commitItems((currentItems) => [
        ...currentItems,
        newImage,
      ]);

      setSelectedItemId(newImage.id);
      setEditingItemId(null);
      setShowMobileContextToolbar(true);
      setShowImageAdjustments(false);
    };

    uploadedImage.onerror = () => {
      URL.revokeObjectURL(imageUrl);
    };

    uploadedImage.src = imageUrl;

    event.target.value = "";
  };

  const addText = () => {
    const canvas = canvasRef.current;

    const canvasWidth = canvas?.clientWidth || LOGICAL_CANVAS_WIDTH;
    const canvasHeight = canvas?.clientHeight || LOGICAL_CANVAS_HEIGHT;

    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      value: "",
      position: {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
      },
      fontSize: DEFAULT_TEXT_FONT_SIZE,
      color: "#0f172a",
      fontFamily: "Arial",
      rotation: 0,
    };

    commitItems((currentItems) => [
      ...currentItems,
      newText,
    ]);

    setSelectedItemId(newText.id);
    setEditingItemId(null);
    setShowMobileContextToolbar(true);
    setShowImageAdjustments(false);

    setTimeout(() => {
      canvasRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;

    commitItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== selectedItemId
      )
    );

    setSelectedItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
  };

  const moveItem = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (pinchRef.current) return;

    const pending = pendingDragRef.current;
    const canvas =
      event.currentTarget.getBoundingClientRect();

    if (pending) {
      const movedEnough =
        Math.abs(event.clientX - pending.startX) > 5 ||
        Math.abs(event.clientY - pending.startY) > 5;

      if (movedEnough || pending.moved) {
        pending.moved = true;

        setDraggingItemId(pending.itemId);
        setEditingItemId(null);

        updateItems((currentItems) =>
  currentItems.map((item) =>
    item.id === pending.itemId
      ? {
          ...item,
          position: getSnappedPosition(
            event,
            canvas
          ),
        }
      : item
  )
);
      }

      return;
    }

    if (!draggingItemId) return;

    setEditingItemId(null);

    updateItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? {
              ...item,
              position: getSnappedPosition(
                event,
                canvas
              ),
            }
          : item
      )
    );
  };

  const stopDragging = () => {
  hideAlignmentGuides();

  requestAnimationFrame(() => {
    hideAlignmentGuides();
  });
    if (justPinchedRef.current) {
      pendingDragRef.current = null;
      setDraggingItemId(null);

      return;
    }

    commitHistoryTransaction();

    if (
      pendingDragRef.current &&
      !pendingDragRef.current.moved
    ) {
      setEditingItemId(
        pendingDragRef.current.itemId
      );

      setSelectedItemId(
        pendingDragRef.current.itemId
      );
    }

    pendingDragRef.current = null;
    setDraggingItemId(null);
  };

  const startImageResize = (
    event: React.PointerEvent<HTMLDivElement>,
    item: Extract<DesignItem, { type: "image" }>
  ) => {
    event.stopPropagation();
    commitHistoryTransaction();
    beginHistoryTransaction();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    const displayScale = canvasBounds
      ? canvasBounds.width / LOGICAL_CANVAS_WIDTH
      : 1;

    const resize = (moveEvent: PointerEvent) => {
      const change = Math.max(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY
      ) / displayScale;
      const requestedScale = Math.max(
        Number.EPSILON,
        1 + change / Math.max(startWidth, startHeight)
      );
      const nextSize = getBoundedImageSize(
        startWidth * requestedScale,
        startHeight * requestedScale
      );

      updateItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id &&
          currentItem.type === "image"
            ? {
                ...currentItem,
                size: nextSize,
              }
            : currentItem
        )
      );
    };

    const stopResize = () => {
      commitHistoryTransaction();

      window.removeEventListener(
        "pointermove",
        resize
      );

      window.removeEventListener(
        "pointerup",
        stopResize
      );

      activeResizeCleanupRef.current = null;
    };

    window.addEventListener(
      "pointermove",
      resize
    );

    window.addEventListener(
      "pointerup",
      stopResize
    );

    activeResizeCleanupRef.current = stopResize;
  };

  const changeCanvasViewMode = (mode: CanvasViewMode) => {
    if (mode === canvasViewMode) return;

    activeResizeCleanupRef.current?.();
    commitHistoryTransaction();
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    justPinchedRef.current = false;
    setDraggingItemId(null);
    setEditingItemId(null);
    hideAlignmentGuides();
    setCanvasViewMode(mode);
  };
  const toggleImageAdjustments = () => {
  setShowImageAdjustments((currentValue) => {
    const nextValue = !currentValue;

    if (nextValue) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          canvasRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        });
      });
    }

    return nextValue;
  });
};

  const startImageAdjustment = () => {
    commitHistoryTransaction();
    beginHistoryTransaction();
  };

  return (
    <>
      <div
        ref={editorShellRef}
        className="mx-auto mt-8 w-full max-w-[1600px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl md:mt-2 md:flex md:flex-col md:px-4 md:pb-2 md:pt-3"
        style={{ height: desktopEditorHeight }}
      >
      <EditorHeader
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={performUndo}
        onRedo={performRedo}
      />

      <div className="grid gap-4 md:min-h-0 md:flex-1 md:grid-cols-[190px_minmax(0,1fr)_180px] md:gap-2">
        <EditorSidebar
          activeToolbarPanel={activeToolbarPanel}
          onToolbarPanelChange={setActiveToolbarPanel}
          onImageUpload={handleImageUpload}
          onAddText={addText}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          canDelete={Boolean(selectedItemId)}
          onDelete={deleteSelected}
        />

        <EditorCanvas
          canvasRef={canvasRef}
          viewMode={canvasViewMode}
          onViewModeChange={changeCanvasViewMode}
          toolbar={selectedItem ? (
            <LayerToolbar
              itemId={selectedItem.id}
              itemType={selectedItem.type}
              canSendBackward={canSendBackward}
              canBringForward={canBringForward}
              onMoveItemLayer={moveItemLayer}
            />
          ) : null}
          items={items}
          selectedItemId={selectedItemId}
          editingItemId={editingItemId}
          verticalGuide={alignmentGuides.vertical}
          horizontalGuide={alignmentGuides.horizontal}
          onTouchStartCapture={startCanvasPinch}
          onTouchMoveCapture={moveCanvasPinch}
          onTouchEndCapture={() => {
            endCanvasPinch();
            stopDragging();
          }}
          onTouchCancelCapture={() => {
            endCanvasPinch();
            stopDragging();
          }}
          onPointerMove={(event) => {
            trackCanvasTap(event);
            moveItem(event);
          }}
          onPointerUp={finishCanvasTap}
          onPointerCancel={cancelCanvasTap}
          onPointerDown={startCanvasTap}
          onImagePointerDown={(id) => {
            commitHistoryTransaction();
            beginHistoryTransaction();
            setDraggingItemId(id);
            setSelectedItemId(id);
            setEditingItemId(null);
            setShowMobileContextToolbar(true);
            setShowImageAdjustments(false);
          }}
          onImageResizeStart={startImageResize}
          onRequestAutoFit={fitTextInsideCanvas}
          onTextValueChange={(id, value) => {
            beginHistoryTransaction();
            updateItems((currentItems) =>
              currentItems.map((currentItem) =>
                currentItem.id === id
                  ? { ...currentItem, value }
                  : currentItem
              )
            );
          }}
          onRemoveEmptyText={(id) => {
            commitItems((currentItems) =>
              currentItems.filter(
                (currentItem) => currentItem.id !== id
              )
            );

            if (selectedItemId === id) {
              setSelectedItemId(null);
              setShowMobileContextToolbar(false);
              setShowImageAdjustments(false);
            }
          }}
          onFinishEditing={() => {
            commitHistoryTransaction();
            setEditingItemId(null);
          }}
          onEditingPointerDown={(id) => {
            pendingDragRef.current = null;
            setDraggingItemId(null);
            setSelectedItemId(id);
            setShowMobileContextToolbar(true);
          }}
          onPendingDragStart={(id, startX, startY) => {
            commitHistoryTransaction();
            beginHistoryTransaction();
            pendingDragRef.current = {
              itemId: id,
              startX,
              startY,
              moved: false,
            };

            setSelectedItemId(id);
            setShowMobileContextToolbar(true);
          }}
        />

        <EditorInspector
          item={selectedItem}
          onChangeTextSize={changeTextSize}
          onChangeTextColor={changeTextColor}
          onChangeTextFont={changeTextFont}
          onRotate={rotateItem}
          onAdjustmentStart={startImageAdjustment}
          onAdjustmentEnd={commitHistoryTransaction}
          onAdjustmentChange={changeImageAdjustment}
          onResetImageAdjustments={resetImageAdjustments}
        />
      </div>

      {selectedItem && showMobileContextToolbar && (
        <div
          aria-hidden="true"
          className="h-[calc(env(safe-area-inset-bottom)+4.75rem)] md:hidden"
        />
      )}
      </div>

      {selectedItem && showMobileContextToolbar && (
        <MobileContextToolbar
          item={selectedItem}
          canSendBackward={canSendBackward}
          canBringForward={canBringForward}
          showImageAdjustments={showImageAdjustments}
          onChangeTextSize={changeTextSize}
          onChangeTextColor={changeTextColor}
          onChangeTextFont={changeTextFont}
          onRotate={rotateItem}
          onMoveBackward={(id) =>
            moveItemLayer(id, "backward")
          }
          onMoveForward={(id) =>
            moveItemLayer(id, "forward")
          }
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          onDelete={deleteSelected}
          onToggleImageAdjustments={toggleImageAdjustments}
          onAdjustmentStart={startImageAdjustment}
          onAdjustmentEnd={commitHistoryTransaction}
          onAdjustmentChange={changeImageAdjustment}
          onResetImageAdjustments={resetImageAdjustments}
        />
      )}
    </>
  );
}
