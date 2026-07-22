"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import EditorCanvas from "./editor/EditorCanvas";
import type { TextResizeCorner } from "./editor/CanvasTextItem";
import type { CanvasViewMode } from "./editor/CanvasViewModeControl";
import EditorHeader from "./editor/EditorHeader";
import EditorInspector from "./editor/EditorInspector";
import EditorSidebar from "./editor/EditorSidebar";
import ExportCanvas from "./editor/ExportCanvas";
import ExportDialog from "./editor/ExportDialog";
import LayerToolbar from "./editor/LayerToolbar";
import MobileContextToolbar from "./editor/MobileContextToolbar";
import NewDesignDialog from "./editor/NewDesignDialog";
import {
  clampFontSize,
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_MAX_WIDTH,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_DESKTOP_CANVAS_PRESET_ID,
  DEFAULT_MOBILE_CANVAS_PRESET_ID,
  getBoundedImageSize,
  getCanvasPreset,
  getInitialImageSize,
  SNAP_THRESHOLD,
  type CanvasPresetId,
} from "./editor/editor.constants";
import useEditorHistory from "./editor/useEditorHistory";
import {
  getCanvasDisplayScale,
  getCanvasInteractionBounds,
  screenPointToCanvas,
  type EditorViewport,
} from "./editor/editor.viewport";
import type {
  DesignItem,
  Position,
} from "./editor/editor.types";
import {
  exportDesign,
  type ExportDeliveryOptions,
} from "../lib/export/exportDesign";
import type { DesignExportConfig } from "../types/export";
import {
  loadEditorDraft,
  resetEditorDraft,
  saveEditorDraft,
} from "../lib/drafts/editorDraft";

type EditorPreviewProps = {
  fullScreen?: boolean;
};

export default function EditorPreview({
  fullScreen = false,
}: EditorPreviewProps) {
  const {
    present: items,
    canUndo,
    canRedo,
    commit: commitItems,
    updateTransaction: updateItems,
    restore: restoreItems,
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
  const [editorViewport, setEditorViewport] = useState<EditorViewport>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNewDesignDialog, setShowNewDesignDialog] = useState(false);
  const [isStartingNewDesign, setIsStartingNewDesign] = useState(false);
  const [newDesignError, setNewDesignError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [selectedCanvasPresetId, setSelectedCanvasPresetId] =
    useState<CanvasPresetId>(DEFAULT_DESKTOP_CANVAS_PRESET_ID);
  const [canvasPresetFitRequest, setCanvasPresetFitRequest] =
    useState(0);
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
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);
  const hasUserSelectedCanvasPresetRef = useRef(false);
  const restoredDraftReleaseRef = useRef<(() => void) | null>(null);
  const draftSaveTimerRef = useRef<number | null>(null);
  const draftSaveGenerationRef = useRef(0);
  const latestItemsRef = useRef(items);
  const canvasSize = getCanvasPreset(selectedCanvasPresetId);
  const canvasItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        position: {
          x: Math.min(canvasSize.width, Math.max(0, item.position.x)),
          y: Math.min(canvasSize.height, Math.max(0, item.position.y)),
        },
      })),
    [canvasSize.height, canvasSize.width, items]
  );
  const visibleCanvasItems = useMemo(
    () => canvasItems.filter((item) => item.hidden !== true),
    [canvasItems]
  );

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateResponsiveDefault = () => {
      if (hasUserSelectedCanvasPresetRef.current) return;

      setSelectedCanvasPresetId(
        mobileQuery.matches
          ? DEFAULT_MOBILE_CANVAS_PRESET_ID
          : DEFAULT_DESKTOP_CANVAS_PRESET_ID
      );
    };

    updateResponsiveDefault();
    mobileQuery.addEventListener("change", updateResponsiveDefault);

    return () =>
      mobileQuery.removeEventListener("change", updateResponsiveDefault);
  }, []);

  const selectCanvasPreset = (presetId: CanvasPresetId) => {
    hasUserSelectedCanvasPresetRef.current = true;
    setSelectedCanvasPresetId(presetId);
    setCanvasPresetFitRequest((request) => request + 1);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = async () => {
      try {
        const draft = await loadEditorDraft();

        if (cancelled || !draft) return;

        if (
          latestItemsRef.current.length > 0 ||
          hasUserSelectedCanvasPresetRef.current
        ) {
          draft.release();
          return;
        }

        restoredDraftReleaseRef.current = draft.release;
        hasUserSelectedCanvasPresetRef.current = true;
        setSelectedCanvasPresetId(draft.presetId);
        restoreItems(draft.items);
      } catch (error) {
        console.warn("The local editor draft could not be restored.", error);
      } finally {
        if (!cancelled) setDraftReady(true);
      }
    };

    void restoreDraft();

    return () => {
      cancelled = true;
      restoredDraftReleaseRef.current?.();
      restoredDraftReleaseRef.current = null;
    };
  }, [restoreItems]);

  useEffect(() => {
    if (!draftReady) return;

    const saveGeneration = draftSaveGenerationRef.current;
    const draft = {
      presetId: selectedCanvasPresetId,
      items,
    };
    const saveDraft = () => {
      if (saveGeneration !== draftSaveGenerationRef.current) return;

      void saveEditorDraft(draft).catch((error) => {
        console.warn("The local editor draft could not be saved.", error);
      });
    };
    const saveTimer = window.setTimeout(() => {
      if (draftSaveTimerRef.current === saveTimer) {
        draftSaveTimerRef.current = null;
      }
      saveDraft();
    }, 400);
    draftSaveTimerRef.current = saveTimer;
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };

    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveDraft);

    return () => {
      window.clearTimeout(saveTimer);
      if (draftSaveTimerRef.current === saveTimer) {
        draftSaveTimerRef.current = null;
      }
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveDraft);
    };
  }, [draftReady, items, selectedCanvasPresetId]);
  const hideAlignmentGuides = () => {
  setAlignmentGuides({
    vertical: false,
    horizontal: false,
  });
};
const getSnappedPosition = (
  event: React.PointerEvent<HTMLDivElement>,
  canvasBounds: DOMRect
): Position | null => {
  const displayScale = getCanvasDisplayScale(canvasBounds, canvasSize);

  if (!Number.isFinite(displayScale) || displayScale <= 0) return null;

  const canvasPoint = screenPointToCanvas(
    event.clientX,
    event.clientY,
    canvasBounds,
    canvasSize
  );
  const rawX = canvasPoint.x;
  const rawY = canvasPoint.y;

  if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

  const canvasCentreX = canvasSize.width / 2;
  const canvasCentreY = canvasSize.height / 2;
  const activeSnapThreshold =
  (event.pointerType === "touch" ? 18 : SNAP_THRESHOLD) / displayScale;

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

  const selectedTextItem = visibleCanvasItems.find(
    (item): item is Extract<DesignItem, { type: "text" }> =>
      item.id === selectedItemId &&
      item.type === "text" &&
      item.locked !== true
  );

  const selectedImageItem = visibleCanvasItems.find(
    (item): item is Extract<DesignItem, { type: "image" }> =>
      item.id === selectedItemId &&
      item.type === "image" &&
      item.locked !== true
  );
  const selectedVisibleItem = visibleCanvasItems.find(
    (item) => item.id === selectedItemId
  );
  const selectedItem = selectedTextItem ?? selectedImageItem;
  const selectedItemIndex = canvasItems.findIndex(
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
      restoredItems.some(
        (item) =>
          item.id === selectedItemId &&
          item.hidden !== true &&
          item.locked !== true
      );

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

  const duplicateSelectedItem = useCallback(() => {
    if (!selectedItemId) return;

    activeResizeCleanupRef.current?.();
    activeResizeCleanupRef.current = null;
    commitHistoryTransaction();
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;

    let duplicateId: string | null = null;

    commitItems((currentItems) => {
      const sourceItem = currentItems.find(
        (item) => item.id === selectedItemId
      );

      if (!sourceItem) return currentItems;

      const duplicate = structuredClone(sourceItem);
      const horizontalOffset =
        sourceItem.position.x + 20 <= canvasSize.width ? 20 : -20;
      const verticalOffset =
        sourceItem.position.y + 20 <= canvasSize.height ? 20 : -20;

      duplicateId = crypto.randomUUID();
      duplicate.id = duplicateId;
      duplicate.position = {
        x: Math.min(
          canvasSize.width,
          Math.max(0, sourceItem.position.x + horizontalOffset)
        ),
        y: Math.min(
          canvasSize.height,
          Math.max(0, sourceItem.position.y + verticalOffset)
        ),
      };

      return [...currentItems, duplicate];
    });

    if (!duplicateId) return;

    setSelectedItemId(duplicateId);
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(true);
    setShowImageAdjustments(false);
    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });
  }, [
    canvasSize.height,
    canvasSize.width,
    commitHistoryTransaction,
    commitItems,
    selectedItemId,
  ]);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const activeElement = document.activeElement;
      const isEditableElement = (element: EventTarget | null) =>
        element instanceof Element &&
        Boolean(
          element.closest(
            "input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox']"
          )
        );

      const key = event.key.toLowerCase();
      const usesCommandModifier = event.metaKey || event.ctrlKey;
      const usesApplePlatform = /Mac|iPhone|iPad|iPod/.test(
        navigator.platform
      );
      const usesDuplicateModifier = usesApplePlatform
        ? event.metaKey && !event.ctrlKey
        : event.ctrlKey && !event.metaKey;
      const requestsUndo =
        usesCommandModifier && key === "z" && !event.shiftKey;
      const requestsRedo =
        (usesCommandModifier && key === "z" && event.shiftKey) ||
        (event.ctrlKey && key === "y");
      const requestsDuplicate =
        usesDuplicateModifier &&
        key === "d" &&
        !event.shiftKey &&
        !event.altKey &&
        !event.repeat;
      const selectedItemExists =
        selectedItemId !== null &&
        items.some((item) => item.id === selectedItemId);
      const targetTextEditor =
        target instanceof Element
          ? target.closest<HTMLTextAreaElement>(
              "textarea[data-canvas-text-editor]"
            )
          : null;
      const activeTextEditor =
        activeElement instanceof Element
          ? activeElement.closest<HTMLTextAreaElement>(
              "textarea[data-canvas-text-editor]"
            )
          : null;
      const canvasTextEditor = targetTextEditor ?? activeTextEditor;
      const editsSelectedCanvasText = Boolean(
        canvasTextEditor &&
          selectedItemId &&
          canvasTextEditor.dataset.canvasTextEditor === selectedItemId
      );

      if (requestsDuplicate) {
        if (
          !selectedItemExists ||
          showExportDialog ||
          showNewDesignDialog ||
          ((isEditableElement(target) ||
            isEditableElement(activeElement)) &&
            !editsSelectedCanvasText)
        ) {
          return;
        }

        event.preventDefault();

        if (canvasTextEditor && editsSelectedCanvasText) {
          const currentValue = canvasTextEditor.value;

          updateItems((currentItems) =>
            currentItems.map((item) =>
              item.id === selectedItemId && item.type === "text"
                ? { ...item, value: currentValue }
                : item
            )
          );
        }

        duplicateSelectedItem();
        return;
      }

      if (
        isEditableElement(target) ||
        isEditableElement(activeElement)
      ) {
        return;
      }

      if (requestsUndo && canUndo) {
        event.preventDefault();
        performUndo();
      } else if (requestsRedo && canRedo) {
        event.preventDefault();
        performRedo();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut, true);

    return () => {
      window.removeEventListener("keydown", handleHistoryShortcut, true);
    };
  }, [
    canRedo,
    canUndo,
    duplicateSelectedItem,
    items,
    performRedo,
    performUndo,
    selectedItemId,
    showExportDialog,
    showNewDesignDialog,
    updateItems,
  ]);

  useEffect(() => {
    if (fullScreen) return;

    const editorShell = editorShellRef.current;
    const minimumDesktopEditorHeight = 600;

    if (!editorShell) return;

    const updateEditorHeight = () => {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        setDesktopEditorHeight(undefined);
        return;
      }

      const availableHeight =
        window.innerHeight - editorShell.getBoundingClientRect().top - 16;

      setDesktopEditorHeight(
        Math.max(minimumDesktopEditorHeight, availableHeight)
      );
    };

    const initialMeasurementFrame = requestAnimationFrame(
      updateEditorHeight
    );
    window.addEventListener("resize", updateEditorHeight);

    return () => {
      cancelAnimationFrame(initialMeasurementFrame);
      window.removeEventListener("resize", updateEditorHeight);
    };
  }, [fullScreen]);

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

  const startNewDesign = async () => {
    if (isStartingNewDesign) return;

    setIsStartingNewDesign(true);
    setNewDesignError(null);
    draftSaveGenerationRef.current += 1;

    if (draftSaveTimerRef.current !== null) {
      window.clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    }

    try {
      await resetEditorDraft({
        presetId: selectedCanvasPresetId,
        items: [],
      });

      activeResizeCleanupRef.current?.();
      activeResizeCleanupRef.current = null;
      pendingDragRef.current = null;
      pinchRef.current = null;
      canvasTapRef.current = null;
      pageInteractionRef.current = null;
      justPinchedRef.current = false;
      restoredDraftReleaseRef.current?.();
      restoredDraftReleaseRef.current = null;
      latestItemsRef.current = [];

      restoreItems([]);
      setSelectedItemId(null);
      setDraggingItemId(null);
      setEditingItemId(null);
      setShowMobileContextToolbar(false);
      setShowImageAdjustments(false);
      setAlignmentGuides({
        vertical: false,
        horizontal: false,
      });
      setShowNewDesignDialog(false);
    } catch (error) {
      console.error("The new design could not be started.", error);
      void saveEditorDraft({
        presetId: selectedCanvasPresetId,
        items,
      }).catch((saveError) => {
        console.warn("The local editor draft could not be saved.", saveError);
      });
      setNewDesignError(
        "Your saved draft could not be cleared. Please try again."
      );
    } finally {
      setIsStartingNewDesign(false);
    }
  };

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

  const cancelPendingCanvasGesture = useCallback(() => {
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    pendingDragRef.current = null;
    setDraggingItemId(null);
  }, []);

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
  const selectItemFromLayers = (id: string) => {
    if (
      !items.some(
        (item) =>
          item.id === id &&
          item.hidden !== true &&
          item.locked !== true
      )
    ) {
      return;
    }

    commitHistoryTransaction();
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    setDraggingItemId(null);
    setEditingItemId(null);
    setSelectedItemId(id);
    setShowMobileContextToolbar(true);
    setShowImageAdjustments(false);
    hideAlignmentGuides();

    requestAnimationFrame(() => {
      const canvasItem = Array.from(
        canvasRef.current?.querySelectorAll<HTMLElement>(
          "[data-canvas-item-id]"
        ) ?? []
      ).find((element) => element.dataset.canvasItemId === id);

      canvasItem?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
  };
  const reorderLayers = (orderedIds: string[]) => {
    commitItems((currentItems) => {
      if (
        orderedIds.length !== currentItems.length ||
        new Set(orderedIds).size !== currentItems.length
      ) {
        return currentItems;
      }

      const itemsById = new Map(
        currentItems.map((item) => [item.id, item])
      );
      const reorderedItems: DesignItem[] = [];

      for (const id of orderedIds) {
        const item = itemsById.get(id);

        if (!item) return currentItems;
        reorderedItems.push(item);
      }

      if (
        currentItems.every((item, index) => item.id === orderedIds[index])
      ) {
        return currentItems;
      }

      return reorderedItems;
    });
  };
  const toggleLayerVisibility = (id: string) => {
    const layer = items.find((item) => item.id === id);

    if (!layer) return;

    const willHide = layer.hidden !== true;

    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, hidden: willHide } : item
      )
    );

    if (!willHide || selectedItemId !== id) return;

    activeResizeCleanupRef.current?.();
    activeResizeCleanupRef.current = null;
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;
    setSelectedItemId(null);
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
    hideAlignmentGuides();
  };
  const toggleLayerLock = (
    id: string,
    preserveMobileSelection = false
  ) => {
    const layer = items.find((item) => item.id === id);

    if (!layer) return;

    const willLock = layer.locked !== true;

    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, locked: willLock } : item
      )
    );

    if (!willLock || selectedItemId !== id) return;

    activeResizeCleanupRef.current?.();
    activeResizeCleanupRef.current = null;
    pendingDragRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowImageAdjustments(false);
    hideAlignmentGuides();

    if (preserveMobileSelection) {
      setShowMobileContextToolbar(true);
    } else {
      setSelectedItemId(null);
      setShowMobileContextToolbar(false);
    }
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
        hidden: false,
        locked: false,
        src: imageUrl,
        position: {
          x: canvasSize.width / 2,
          y: canvasSize.height / 2,
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
    const newText: DesignItem = {
      id: crypto.randomUUID(),
      type: "text",
      hidden: false,
      locked: false,
      value: "",
      position: {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2,
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

  const updateDraggedItemPosition = (
    itemId: string,
    event: React.PointerEvent<HTMLDivElement>,
    canvasBounds: DOMRect
  ) => {
    const position = getSnappedPosition(event, canvasBounds);

    if (!position) return;

    updateItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, position } : item
      )
    );
  };

  const moveItem = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (pinchRef.current) return;

    const pending = pendingDragRef.current;
    const canvas = getCanvasInteractionBounds(event.currentTarget);

    if (pending) {
      const movedEnough =
        Math.abs(event.clientX - pending.startX) > 5 ||
        Math.abs(event.clientY - pending.startY) > 5;

      if (movedEnough || pending.moved) {
        pending.moved = true;

        setDraggingItemId(pending.itemId);
        setEditingItemId(null);

        updateDraggedItemPosition(pending.itemId, event, canvas);
      }

      return;
    }

    if (!draggingItemId) return;

    setEditingItemId(null);

    updateDraggedItemPosition(draggingItemId, event, canvas);
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

  const startDesktopResize = (
    event: React.PointerEvent<HTMLDivElement>,
    onResize: (event: PointerEvent) => void
  ) => {
    event.stopPropagation();
    commitHistoryTransaction();
    beginHistoryTransaction();

    const stopResize = () => {
      commitHistoryTransaction();

      window.removeEventListener("pointermove", onResize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);

      activeResizeCleanupRef.current = null;
    };

    window.addEventListener("pointermove", onResize);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);

    activeResizeCleanupRef.current = stopResize;
  };

  const startImageResize = (
    event: React.PointerEvent<HTMLDivElement>,
    item: Extract<DesignItem, { type: "image" }>
  ) => {
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;
    const canvasBounds = canvasRef.current
      ? getCanvasInteractionBounds(canvasRef.current)
      : null;
    const measuredDisplayScale = canvasBounds
      ? getCanvasDisplayScale(canvasBounds, canvasSize)
      : 1;
    const displayScale =
      Number.isFinite(measuredDisplayScale) && measuredDisplayScale > 0
        ? measuredDisplayScale
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

    startDesktopResize(event, resize);
  };

  const startTextResize = (
    event: React.PointerEvent<HTMLDivElement>,
    item: Extract<DesignItem, { type: "text" }>,
    corner: TextResizeCorner
  ) => {
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startFontSize = item.fontSize;
    const horizontalDirection = corner.endsWith("right") ? 1 : -1;
    const verticalDirection = corner.startsWith("bottom") ? 1 : -1;
    const canvasBounds = canvasRef.current
      ? getCanvasInteractionBounds(canvasRef.current)
      : null;
    const measuredDisplayScale = canvasBounds
      ? getCanvasDisplayScale(canvasBounds, canvasSize)
      : 1;
    const displayScale =
      Number.isFinite(measuredDisplayScale) && measuredDisplayScale > 0
        ? measuredDisplayScale
        : 1;

    const resize = (moveEvent: PointerEvent) => {
      const horizontalChange =
        (moveEvent.clientX - startX) * horizontalDirection;
      const verticalChange =
        (moveEvent.clientY - startY) * verticalDirection;
      const proportionalChange =
        (horizontalChange + verticalChange) / 2 / displayScale;
      const requestedScale = Math.max(
        Number.EPSILON,
        1 + proportionalChange / startFontSize
      );
      const nextFontSize = clampFontSize(
        startFontSize * requestedScale
      );

      updateItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id && currentItem.type === "text"
            ? {
                ...currentItem,
                fontSize: nextFontSize,
              }
            : currentItem
        )
      );
    };

    startDesktopResize(event, resize);
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

  const exportFile = async (
    config: DesignExportConfig,
    options?: ExportDeliveryOptions
  ) => {
    const exportCanvas = exportCanvasRef.current;

    if (!exportCanvas) {
      throw new Error("The design canvas is not ready to export.");
    }

    return exportDesign(
      exportCanvas,
      visibleCanvasItems,
      config,
      options
    );
  };

  return (
    <>
      <div
        ref={editorShellRef}
        className={
          fullScreen
            ? "w-full overflow-hidden bg-white/5 p-2 shadow-2xl md:flex md:h-full md:min-h-0 md:flex-col md:px-4 md:pb-2 md:pt-3"
            : "mx-auto mt-8 w-full max-w-[1600px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl md:mt-2 md:flex md:flex-col md:px-4 md:pb-2 md:pt-3"
        }
        style={{ height: fullScreen ? undefined : desktopEditorHeight }}
      >
      <EditorHeader
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={performUndo}
        onRedo={performRedo}
        onNewDesign={() => {
          setNewDesignError(null);
          setShowNewDesignDialog(true);
        }}
        onExport={() => setShowExportDialog(true)}
      />

      {selectedVisibleItem && showMobileContextToolbar && (
        <MobileContextToolbar
          item={selectedVisibleItem}
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
          onToggleLock={(id) => toggleLayerLock(id, true)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          onDuplicate={duplicateSelectedItem}
          onDelete={deleteSelected}
          onToggleImageAdjustments={toggleImageAdjustments}
          onAdjustmentStart={startImageAdjustment}
          onAdjustmentEnd={commitHistoryTransaction}
          onAdjustmentChange={changeImageAdjustment}
          onResetImageAdjustments={resetImageAdjustments}
        />
      )}

      <div className="grid gap-4 md:min-h-0 md:flex-1 md:grid-cols-[190px_minmax(0,1fr)_180px] md:gap-2">
        <EditorSidebar
          activeToolbarPanel={activeToolbarPanel}
          onToolbarPanelChange={setActiveToolbarPanel}
          onImageUpload={handleImageUpload}
          onAddText={addText}
          selectedCanvasPresetId={selectedCanvasPresetId}
          onCanvasPresetChange={selectCanvasPreset}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          canDuplicate={Boolean(selectedItem)}
          onDuplicate={duplicateSelectedItem}
          canDelete={Boolean(selectedItemId)}
          onDelete={deleteSelected}
        />

        <EditorCanvas
          canvasRef={canvasRef}
          viewMode={canvasViewMode}
          onViewModeChange={changeCanvasViewMode}
          viewport={editorViewport}
          onViewportChange={setEditorViewport}
          canvasSize={canvasSize}
          canvasPresetFitRequest={canvasPresetFitRequest}
          toolbar={selectedItem ? (
            <LayerToolbar
              itemId={selectedItem.id}
              itemType={selectedItem.type}
              canSendBackward={canSendBackward}
              canBringForward={canBringForward}
              onMoveItemLayer={moveItemLayer}
            />
          ) : null}
          items={visibleCanvasItems}
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
          onTextResizeStart={startTextResize}
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
          onTwoFingerGestureStart={cancelPendingCanvasGesture}
        />

        <EditorInspector
          items={items}
          item={selectedItem}
          selectedItemId={selectedItemId}
          onSelectItem={selectItemFromLayers}
          onReorderLayers={reorderLayers}
          onToggleLayerVisibility={toggleLayerVisibility}
          onToggleLayerLock={toggleLayerLock}
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

      </div>

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
        }}
      >
        <ExportCanvas
          ref={exportCanvasRef}
          items={visibleCanvasItems}
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </div>

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={exportFile}
        canvasSize={canvasSize}
      />

      <NewDesignDialog
        open={showNewDesignDialog}
        isStarting={isStartingNewDesign}
        errorMessage={newDesignError}
        onCancel={() => {
          setNewDesignError(null);
          setShowNewDesignDialog(false);
        }}
        onConfirm={() => void startNewDesign()}
      />
    </>
  );
}
