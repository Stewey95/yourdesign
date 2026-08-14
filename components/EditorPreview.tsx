"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
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
import UniversalSearch from "./editor/UniversalSearch";
import {
  clampFontSize,
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_MAX_WIDTH,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_DESKTOP_CANVAS_PRESET_ID,
  DEFAULT_MOBILE_CANVAS_PRESET_ID,
  getBoundedElementSize,
  getBoundedImageSize,
  getCanvasPreset,
  getInitialImageSize,
  SNAP_THRESHOLD,
  type CanvasPresetId,
  type CanvasSize,
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
  ResizeCorner,
  ResizableDesignItem,
} from "./editor/editor.types";
import type { ElementAsset } from "./editor/elements/element.types";
import {
  getElementAsset,
  getElementColourMode,
  getElementDefaultStrokeWidth,
  elementSupportsFill,
  elementSupportsStroke,
  getElementVisibleBounds,
} from "./editor/elements/elements.catalog";
import { getDefaultShapeStyle, DEFAULT_SHAPE_COLOUR } from "./editor/shape.constants";
import {
  DEFAULT_SHAPE_STROKE_WIDTH,
  MAX_SHAPE_STROKE_WIDTH,
  MIN_SHAPE_STROKE_WIDTH,
} from "./editor/shape.constants";
import { getTextBoxWidth, TEXT_BOX_MIN_WIDTH } from "./editor/textLayout";
import { isPointerInsideVisibleContent } from "./editor/hitTesting";
import {
  exportDesign,
  type ExportDeliveryOptions,
} from "../lib/export/exportDesign";
import type { DesignExportConfig } from "../types/export";
import {
  loadEditorDraft,
  saveEditorDraft,
} from "../lib/drafts/editorDraft";
import type { Template } from "../lib/templates/templates.types";
import type { ProjectRecord } from "../lib/projects/projects.types";
import {
  createProject,
  getAllProjects,
  getProject,
  saveProject,
  getActiveProjectId,
  setActiveProjectId,
} from "../lib/projects/projectsManager";
import type { ToolbarPanel } from "./editor/EditorSidebar";
import {
  getProduct,
  renamePageInProduct,
  setProductLastEditedAsset,
} from "../lib/products/productsManager";

type EditorPreviewProps = {
  fullScreen?: boolean;
  productId?: string;
  productAssetId?: string;
};

type EditorDesignState = {
  items: DesignItem[];
  canvas: CanvasSize & { presetId: CanvasPresetId };
};

type ItemsUpdate =
  | DesignItem[]
  | ((currentItems: DesignItem[]) => DesignItem[]);

type MobileContextScrollTarget = "toolbar" | "image-adjustments";

const initialCanvasPreset = getCanvasPreset(
  DEFAULT_DESKTOP_CANVAS_PRESET_ID
);

export default function EditorPreview({
  fullScreen = false,
  productId,
  productAssetId,
}: EditorPreviewProps) {
  const {
    present: design,
    canUndo,
    canRedo,
    commit: commitDesign,
    updateTransaction: updateDesign,
    restore: restoreDesign,
    beginTransaction: beginHistoryTransaction,
    commitTransaction: commitHistoryTransaction,
    isTransactionActive,
    undo: undoHistory,
    redo: redoHistory,
  } = useEditorHistory<EditorDesignState>({
    items: [],
    canvas: {
      presetId: initialCanvasPreset.id,
      width: initialCanvasPreset.width,
      height: initialCanvasPreset.height,
    },
  });
  const items = design.items;
  const canvasSize = design.canvas;
  const selectedCanvasPresetId = design.canvas.presetId;
  const commitItems = useCallback(
    (update: ItemsUpdate) => {
      commitDesign((current) => ({
        ...current,
        items:
          typeof update === "function"
            ? update(current.items)
            : update,
      }));
    },
    [commitDesign]
  );
  const updateItems = useCallback(
    (update: ItemsUpdate) => {
      updateDesign((current) => ({
        ...current,
        items:
          typeof update === "function"
            ? update(current.items)
            : update,
      }));
    },
    [updateDesign]
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [, setDraggingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showImageAdjustments, setShowImageAdjustments] = useState(false);
  const [shapeStyleItemId, setShapeStyleItemId] = useState<string | null>(
    null
  );
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
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const [isStartingNewDesign, setIsStartingNewDesign] = useState(false);
  const [newDesignError, setNewDesignError] = useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("Untitled Design");
  const [projectsRevision, setProjectsRevision] = useState(0);
  const [productName, setProductName] = useState<string | null>(null);
  const [productAssetName, setProductAssetName] = useState<string | null>(null);
  const [canvasPresetFitRequest, setCanvasPresetFitRequest] =
    useState(0);
  const [activeToolbarPanel, setActiveToolbarPanel] = useState<ToolbarPanel>(null);
  const [mobileContextScrollRequest, setMobileContextScrollRequest] =
    useState<{
      id: number;
      target: MobileContextScrollTarget;
    } | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState({
  vertical: false,
  horizontal: false,
});
  const snapStateRef = useRef({
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
  const draftSaveTimerRef = useRef<number | null>(null);
  const draftSaveGenerationRef = useRef(0);
  const projectSwitchRequestRef = useRef(0);
  const mobileContextScrollRequestIdRef = useRef(0);
  const latestItemsRef = useRef(items);
  const canvasItems = useMemo(
    () => items,
    [items]
  );
  const visibleCanvasItems = useMemo(
    () => canvasItems.filter((item) => item.hidden !== true),
    [canvasItems]
  );

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  const returnToMobileContext = useCallback(
    (target: MobileContextScrollTarget = "toolbar") => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        return false;
      }

      setActiveToolbarPanel(null);
      setShowMobileContextToolbar(true);
      setMobileContextScrollRequest({
        id: ++mobileContextScrollRequestIdRef.current,
        target,
      });
      return true;
    },
    []
  );

  useLayoutEffect(() => {
    if (
      !mobileContextScrollRequest ||
      !window.matchMedia("(max-width: 767px)").matches
    ) {
      return;
    }

    const selector =
      mobileContextScrollRequest.target === "image-adjustments"
        ? "[data-mobile-image-adjustments]"
        : "[data-mobile-context-toolbar]";
    const target =
      editorShellRef.current?.querySelector<HTMLElement>(selector);

    if (!target) return;

    target.scrollIntoView({
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
      block: "start",
      inline: "nearest",
    });
  }, [mobileContextScrollRequest]);

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateResponsiveDefault = () => {
      if (
        hasUserSelectedCanvasPresetRef.current ||
        latestItemsRef.current.length > 0
      ) {
        return;
      }

      const preset = getCanvasPreset(
        mobileQuery.matches
          ? DEFAULT_MOBILE_CANVAS_PRESET_ID
          : DEFAULT_DESKTOP_CANVAS_PRESET_ID
      );

      restoreDesign({
        items: [],
        canvas: {
          presetId: preset.id,
          width: preset.width,
          height: preset.height,
        },
      });
    };

    updateResponsiveDefault();
    mobileQuery.addEventListener("change", updateResponsiveDefault);

    return () =>
      mobileQuery.removeEventListener("change", updateResponsiveDefault);
  }, [restoreDesign]);

  const selectCanvasSize = (
    presetId: CanvasPresetId,
    size: CanvasSize
  ) => {
    if (
      canvasSize.presetId === presetId &&
      canvasSize.width === size.width &&
      canvasSize.height === size.height
    ) {
      return;
    }

    hasUserSelectedCanvasPresetRef.current = true;
    commitDesign((current) => ({
      canvas: {
        presetId,
        width: size.width,
        height: size.height,
      },
      items: current.items,
    }));
    setCanvasPresetFitRequest((request) => request + 1);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = async () => {
      try {
        let requestedProjectId: string | null = null;

        if (productId && productAssetId) {
          const product = await getProduct(productId);
          const productAsset = product?.assets.find(
            (asset) => asset.id === productAssetId
          );
          requestedProjectId = productAsset?.projectId ?? null;

          if (!cancelled && product) {
            setProductName(product.name);
            setProductAssetName(productAsset?.name ?? null);
            void setProductLastEditedAsset(productId, productAssetId);
          }
        }

        const storedActiveId = getActiveProjectId();
        const activeId = storedActiveId ?? requestedProjectId;
        let currentProj = activeId ? await getProject(activeId) : null;

        if (
          !currentProj &&
          requestedProjectId &&
          requestedProjectId !== storedActiveId
        ) {
          currentProj = await getProject(requestedProjectId);
        }

        if (!currentProj) {
          const allProjects = await getAllProjects();
          if (allProjects.length > 0) {
            currentProj = allProjects[0];
          }
        }

        if (!currentProj) {
          const legacyDraft = await loadEditorDraft();
          if (legacyDraft) {
            currentProj = await createProject(
              "My Design 1",
              legacyDraft.presetId,
              legacyDraft.canvasSize,
              legacyDraft.items
            );
            legacyDraft.release();
          } else {
            const defaultPreset = getCanvasPreset(DEFAULT_DESKTOP_CANVAS_PRESET_ID);
            currentProj = await createProject(
              "Untitled Design",
              DEFAULT_DESKTOP_CANVAS_PRESET_ID,
              { width: defaultPreset.width, height: defaultPreset.height },
              []
            );
          }
        }

        if (cancelled || !currentProj) return;

        setActiveProject(currentProj);
        setProjectTitle(currentProj.title);
        setActiveProjectId(currentProj.id);

        if (
          latestItemsRef.current.length > 0 ||
          hasUserSelectedCanvasPresetRef.current
        ) {
          return;
        }

        hasUserSelectedCanvasPresetRef.current = true;
        restoreDesign({
          items: currentProj.items,
          canvas: {
            presetId: currentProj.presetId,
            width: currentProj.canvasSize.width,
            height: currentProj.canvasSize.height,
          },
        });
      } catch (error) {
        console.warn("The local project draft could not be restored.", error);
      } finally {
        if (!cancelled) setDraftReady(true);
      }
    };

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [productAssetId, productId, restoreDesign]);

  useEffect(() => {
    if (!draftReady || !activeProject) return;

    const saveGeneration = draftSaveGenerationRef.current;
    const draft = {
      presetId: selectedCanvasPresetId,
      canvasSize: {
        width: canvasSize.width,
        height: canvasSize.height,
      },
      items,
    };
    const saveDraft = () => {
      if (saveGeneration !== draftSaveGenerationRef.current) return;

      const updatedRecord: ProjectRecord = {
        ...activeProject,
        title: projectTitle,
        presetId: selectedCanvasPresetId,
        canvasSize: {
          width: canvasSize.width,
          height: canvasSize.height,
        },
        items,
        updatedAt: Date.now(),
      };

      void saveProject(updatedRecord)
        .then(() => setDraftSaveError(null))
        .catch((error) => {
          console.warn("The local project could not be saved.", error);
          setDraftSaveError(
            error instanceof DOMException &&
              error.name === "QuotaExceededError"
              ? "This design is too large to save locally. Your canvas is still open."
              : "This design could not be saved locally. Your canvas is still open."
          );
        });

      void saveEditorDraft(draft).catch(() => undefined);
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
  }, [
    activeProject,
    canvasSize.height,
    canvasSize.width,
    draftReady,
    items,
    projectTitle,
    selectedCanvasPresetId,
  ]);
  const hideAlignmentGuides = useCallback(() => {
    snapStateRef.current = {
      vertical: false,
      horizontal: false,
    };
    setAlignmentGuides((current) =>
      current.vertical || current.horizontal
        ? { vertical: false, horizontal: false }
        : current
    );
  }, []);
const getSnappedPosition = (
  event: React.PointerEvent<HTMLDivElement>,
  canvasBounds: DOMRect,
  grabOffset: Position
): Position | null => {
  const displayScale = getCanvasDisplayScale(canvasBounds, canvasSize);

  if (!Number.isFinite(displayScale) || displayScale <= 0) return null;

  const canvasPoint = screenPointToCanvas(
    event.clientX,
    event.clientY,
    canvasBounds,
    canvasSize
  );
  const rawX = canvasPoint.x - grabOffset.x;
  const rawY = canvasPoint.y - grabOffset.y;

  if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;

  const canvasCentreX = canvasSize.width / 2;
  const canvasCentreY = canvasSize.height / 2;
  const activeSnapThreshold =
  (event.pointerType === "touch" ? 18 : SNAP_THRESHOLD) / displayScale;
  const snapReleaseThreshold = activeSnapThreshold * 1.75;
  const previousSnap = snapStateRef.current;

  const snapToVerticalCentre =
    Math.abs(rawX - canvasCentreX) <=
    (previousSnap.vertical
      ? snapReleaseThreshold
      : activeSnapThreshold);

  const snapToHorizontalCentre =
    Math.abs(rawY - canvasCentreY) <=
    (previousSnap.horizontal
      ? snapReleaseThreshold
      : activeSnapThreshold);

  const nextSnap = {
    vertical: snapToVerticalCentre,
    horizontal: snapToHorizontalCentre,
  };

  if (
    nextSnap.vertical !== previousSnap.vertical ||
    nextSnap.horizontal !== previousSnap.horizontal
  ) {
    snapStateRef.current = nextSnap;
    setAlignmentGuides(nextSnap);
  }

  return {
    x: snapToVerticalCentre ? canvasCentreX : rawX,
    y: snapToHorizontalCentre ? canvasCentreY : rawY,
  };
};
  const justPinchedRef = useRef(false);

  const selectedVisibleItem = visibleCanvasItems.find(
    (item) => item.id === selectedItemId
  );
  const selectedItem = selectedVisibleItem;
  const selectedItemIndex = canvasItems.findIndex(
    (item) => item.id === selectedItemId
  );

  const canSendBackward = selectedItemIndex > 0;

  const canBringForward =
    selectedItemIndex !== -1 &&
    selectedItemIndex < items.length - 1;

  const pendingDragRef = useRef<{
    itemId: string;
    itemType: DesignItem["type"];
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const activeDragRef = useRef<{
    itemId: string;
    pointerId: number;
  } | null>(null);
  const dragGrabOffsetRef = useRef<{
    itemId: string;
    offset: Position;
  } | null>(null);
  const pendingDragPositionRef = useRef<{
    itemId: string;
    position: Position;
  } | null>(null);
  const dragPositionFrameRef = useRef<number | null>(null);

  const pinchRef = useRef<{
    itemId: string;
    itemType: DesignItem["type"];
    startDistance: number;
    startWidth?: number;
    startHeight?: number;
    startFontSize?: number;
  } | null>(null);
  const pendingPinchDistanceRef = useRef<number | null>(null);
  const pinchFrameRef = useRef<number | null>(null);

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

  const reconcileAfterHistoryNavigation = useCallback((restoredDesign: EditorDesignState) => {
    const restoredItems = restoredDesign.items;

    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
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
          item.hidden !== true
      );

    if (!selectedItemSurvives) {
      setShapeStyleItemId(null);
      setSelectedItemId(null);
      setShowMobileContextToolbar(false);
    } else {
      const restoredSelectedItem = restoredItems.find(
        (item) => item.id === selectedItemId
      );

      if (restoredSelectedItem?.locked) {
        setShapeStyleItemId(null);
      }
    }

    setCanvasPresetFitRequest((request) => request + 1);
  }, [selectedItemId]);

  const performUndo = useCallback(() => {
    if (!canUndo) return;

    const restoredDesign = undoHistory();

    if (restoredDesign) {
      reconcileAfterHistoryNavigation(restoredDesign);
    }
  }, [canUndo, reconcileAfterHistoryNavigation, undoHistory]);

  const performRedo = useCallback(() => {
    if (!canRedo) return;

    const restoredDesign = redoHistory();

    if (restoredDesign) {
      reconcileAfterHistoryNavigation(restoredDesign);
    }
  }, [canRedo, reconcileAfterHistoryNavigation, redoHistory]);

  const duplicateSelectedItem = useCallback(() => {
    if (!selectedItemId) return;

    activeResizeCleanupRef.current?.();
    activeResizeCleanupRef.current = null;
    commitHistoryTransaction();
    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;

    let duplicateId: string | null = null;

    commitItems((currentItems) => {
      const sourceItem = currentItems.find(
        (item) => item.id === selectedItemId
      );

      if (!sourceItem || sourceItem.locked) return currentItems;

      const duplicate = structuredClone(sourceItem);
      const horizontalOffset =
        sourceItem.position.x + 20 <= canvasSize.width ? 20 : -20;
      const verticalOffset =
        sourceItem.position.y + 20 <= canvasSize.height ? 20 : -20;

      duplicateId = crypto.randomUUID();
      duplicate.id = duplicateId;
      duplicate.position = {
        x: sourceItem.position.x + horizontalOffset,
        y: sourceItem.position.y + verticalOffset,
      };

      return [...currentItems, duplicate];
    });

    if (!duplicateId) return;

    setSelectedItemId(duplicateId);
    setShapeStyleItemId(null);
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
    setShapeStyleItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });
  }, [commitItems, selectedItemId]);

  const handleSelectProject = useCallback(
    async (project: ProjectRecord) => {
      if (project.id === activeProject?.id) return;

      const switchRequest = projectSwitchRequestRef.current + 1;
      projectSwitchRequestRef.current = switchRequest;

      if (activeProject) {
        try {
          await saveProject({
            ...activeProject,
            title: projectTitle,
            presetId: selectedCanvasPresetId,
            canvasSize: {
              width: canvasSize.width,
              height: canvasSize.height,
            },
            items: latestItemsRef.current,
            updatedAt: activeProject.updatedAt,
          });
        } catch (error) {
          console.warn(
            "The current project could not be saved before switching.",
            error
          );
          setDraftSaveError(
            "This design could not be saved, so Gripix kept it open."
          );
          return;
        }
      }

      const freshProject = await getProject(project.id);

      if (projectSwitchRequestRef.current !== switchRequest) return;

      if (!freshProject) {
        setDraftSaveError(
          "That saved project could not be opened. Your current design is still safe."
        );
        return;
      }

      activeResizeCleanupRef.current?.();
      activeResizeCleanupRef.current = null;
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      pinchRef.current = null;
      canvasTapRef.current = null;
      pageInteractionRef.current = null;
      justPinchedRef.current = false;

      latestItemsRef.current = freshProject.items;
      setActiveProject(freshProject);
      setProjectTitle(freshProject.title);
      setActiveProjectId(freshProject.id);
      setDraftSaveError(null);

      hasUserSelectedCanvasPresetRef.current = true;
      restoreDesign({
        items: freshProject.items,
        canvas: {
          presetId: freshProject.presetId,
          width: freshProject.canvasSize.width,
          height: freshProject.canvasSize.height,
        },
      });

      setSelectedItemId(null);
      setShapeStyleItemId(null);
      setDraggingItemId(null);
      setEditingItemId(null);
      setShowMobileContextToolbar(false);
      setShowImageAdjustments(false);
      setCanvasPresetFitRequest((request) => request + 1);
    },
    [activeProject, canvasSize.height, canvasSize.width, projectTitle, restoreDesign, selectedCanvasPresetId]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      const trimmed = newTitle.trim() || "Untitled Design";
      setProjectTitle(trimmed);
      if (activeProject) {
        const updated = {
          ...activeProject,
          title: trimmed,
          presetId: selectedCanvasPresetId,
          canvasSize: {
            width: canvasSize.width,
            height: canvasSize.height,
          },
          items: latestItemsRef.current,
          updatedAt: Date.now(),
        };
        setActiveProject(updated);
        void saveProject(updated).then(() =>
          setProjectsRevision((revision) => revision + 1)
        );
      }
      if (productId && productAssetId) {
        setProductAssetName(trimmed);
        void renamePageInProduct(productId, productAssetId, trimmed);
      }
    },
    [
      activeProject,
      canvasSize.height,
      canvasSize.width,
      productAssetId,
      productId,
      selectedCanvasPresetId,
    ]
  );

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
      if (activeProject) {
        await saveProject({
          ...activeProject,
          title: projectTitle,
          presetId: selectedCanvasPresetId,
          canvasSize: {
            width: canvasSize.width,
            height: canvasSize.height,
          },
          items: latestItemsRef.current,
          updatedAt: Date.now(),
        });
      }

      const defaultPreset = getCanvasPreset(selectedCanvasPresetId);
      const newProj = await createProject(
        "Untitled Design",
        selectedCanvasPresetId,
        { width: defaultPreset.width, height: defaultPreset.height },
        []
      );

      activeResizeCleanupRef.current?.();
      activeResizeCleanupRef.current = null;
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      pinchRef.current = null;
      canvasTapRef.current = null;
      pageInteractionRef.current = null;
      justPinchedRef.current = false;
      latestItemsRef.current = [];

      setActiveProject(newProj);
      setProjectTitle(newProj.title);
      setActiveProjectId(newProj.id);
      setProjectsRevision((revision) => revision + 1);

      restoreDesign({
        items: [],
        canvas: {
          presetId: selectedCanvasPresetId,
          width: defaultPreset.width,
          height: defaultPreset.height,
        },
      });
      setSelectedItemId(null);
      setShapeStyleItemId(null);
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
      setNewDesignError(
        "A new project design could not be initialized. Please try again."
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
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    setDraggingItemId(null);
  }, []);

  const changeTextFontSize = (id: string, fontSize: number) => {
    const nextFontSize = clampFontSize(fontSize);
    const updateText = (currentItems: DesignItem[]) =>
      currentItems.map((item) =>
        item.id === id && item.type === "text"
          ? { ...item, fontSize: nextFontSize }
          : item
      );

    if (isTransactionActive()) {
      updateItems(updateText);
    } else {
      commitItems(updateText);
    }
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
          item.hidden !== true
      )
    ) {
      return;
    }

    commitHistoryTransaction();
    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    setDraggingItemId(null);
    setEditingItemId(null);
    setSelectedItemId(id);
    setShapeStyleItemId(null);
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
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;
    setSelectedItemId(null);
    setShapeStyleItemId(null);
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
    hideAlignmentGuides();
  };
  const toggleLayerLock = (id: string) => {
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
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    pageInteractionRef.current = null;
    justPinchedRef.current = false;
    setDraggingItemId(null);
    setEditingItemId(null);
    setShowImageAdjustments(false);
    setShapeStyleItemId(null);
    hideAlignmentGuides();
    setShowMobileContextToolbar(true);
  };

  const getTemplateItemPosition = (item: DesignItem) => {
    const position = item.position;

    if (item.type === "shape" || item.type === "image" || item.type === "element") {
      return {
        x: position.x + item.size.width / 2,
        y: position.y + item.size.height / 2,
      };
    }

    if (item.type === "text") {
      const lines = item.value.split("\n");
      const lineHeight = item.fontSize * 1.15;
      const textHeight = Math.max(1, lines.length) * lineHeight;
      const maxLineLength = Math.max(...lines.map((line) => line.length));
      const approximateCharWidth = item.fontSize * 0.55;
      const textWidth = Math.max(1, maxLineLength * approximateCharWidth);

      return {
        x: position.x + textWidth / 2,
        y: position.y + textHeight / 2,
      };
    }

    return position;
  };

  const handleSelectTemplate = useCallback(
    (template: Template) => {
      activeResizeCleanupRef.current?.();
      activeResizeCleanupRef.current = null;
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      pinchRef.current = null;
      canvasTapRef.current = null;
      pageInteractionRef.current = null;
      justPinchedRef.current = false;

      const freshItems: DesignItem[] = template.items.map((item, index) => ({
        ...item,
        // Templates are authored compositions, so their text gets an
        // explicit width based on its authored left inset. New free-form
        // text deliberately has no textBoxWidth.
        ...(item.type === "text" && !getTextBoxWidth(item)
          ? {
              textBoxWidth: Math.max(
                TEXT_BOX_MIN_WIDTH,
                template.width - item.position.x * 2
              ),
            }
          : {}),
        id: `item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        position: getTemplateItemPosition(item),
      }));

      hasUserSelectedCanvasPresetRef.current = true;
      commitDesign({
        items: freshItems,
        canvas: {
          presetId: template.presetId,
          width: template.width,
          height: template.height,
        },
      });

      setSelectedItemId(null);
      setEditingItemId(null);
      setShapeStyleItemId(null);
      setDraggingItemId(null);
      setShowImageAdjustments(false);
      hideAlignmentGuides();
      setCanvasPresetFitRequest((count) => count + 1);

      const mobileSelection = [...freshItems]
        .reverse()
        .find(
          (item) =>
            item.hidden !== true &&
            item.locked !== true
        );

      if (
        mobileSelection &&
        returnToMobileContext()
      ) {
        setSelectedItemId(mobileSelection.id);
      } else {
        setSelectedItemId(null);
        setShowMobileContextToolbar(false);
      }
    },
    [commitDesign, hideAlignmentGuides, returnToMobileContext]
  );
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

  const changeElementOpacity = (id: string, opacity: number) => {
    const updateElement = (currentItems: DesignItem[]) =>
      currentItems.map((item) =>
        item.id === id && item.type === "element"
          ? { ...item, opacity: Math.max(0, Math.min(100, opacity)) }
          : item
      );

    if (isTransactionActive()) updateItems(updateElement);
    else commitItems(updateElement);
  };

  const changeShapeFill = (id: string, fill: string | null) => {
    commitItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && (item.type === "shape" || item.type === "element")
          ? { ...item, fill }
          : item
      )
    );
  };

  // Some catalog elements have detailed artwork with multiple close
  // internal negative-space regions (e.g. a pencil's banding) that a
  // stroke width the shared MAX_SHAPE_STROKE_WIDTH allows would swallow,
  // turning the artwork into a solid blob - element.maxStrokeWidth (set
  // per-element from an empirical audit) caps those specific elements
  // below that shared ceiling. Every other shape/element keeps the full
  // shared range; this never lowers it, only tightens it per-element.
  const getEffectiveMaxStrokeWidth = (
    item: Extract<DesignItem, { type: "shape" | "element" }>
  ) => {
    if (item.type !== "element") return MAX_SHAPE_STROKE_WIDTH;

    const asset = getElementAsset(item.elementId);

    return Math.min(MAX_SHAPE_STROKE_WIDTH, asset?.maxStrokeWidth ?? MAX_SHAPE_STROKE_WIDTH);
  };

  // Elements crop their SVG viewBox to geometryBounds inflated by the
  // current stroke's half-width (see getElementVisibleBounds), so the true
  // visible bounds shift whenever stroke width or stroke presence changes.
  // item.size (the wrapper the selection ring/handles/drag area all read)
  // stays a fixed multiple - the user's chosen zoom - of those true
  // bounds; when the true bounds change, item.size must be rescaled by
  // that same fixed multiple, or the wrapper stops matching the artwork
  // (which is exactly the "selection box doesn't grow with border width"
  // regression). Shapes are unaffected: their own path geometry is
  // recomputed straight from item.size on every render, so they are
  // already exact and need no rescale.
  const rescaleElementSizeForStrokeChange = (
    item: Extract<DesignItem, { type: "element" }>,
    nextStrokeWidth: number,
    nextStroke: string | null
  ) => {
    const asset = getElementAsset(item.elementId);
    if (!asset?.geometryBounds) return item.size;

    const mode = getElementColourMode(asset);
    const oldHasStroke = elementSupportsStroke(mode) && item.stroke !== null;
    const newHasStroke = elementSupportsStroke(mode) && nextStroke !== null;

    const oldBounds = getElementVisibleBounds(
      asset.geometryBounds,
      item.strokeWidth,
      oldHasStroke
    );
    const newBounds = getElementVisibleBounds(
      asset.geometryBounds,
      nextStrokeWidth,
      newHasStroke
    );

    if (
      !oldBounds ||
      !newBounds ||
      oldBounds.width <= 0 ||
      oldBounds.height <= 0
    ) {
      return item.size;
    }

    const scale =
      (item.size.width / oldBounds.width +
        item.size.height / oldBounds.height) /
      2;

    return getBoundedElementSize(
      newBounds.width * scale,
      newBounds.height * scale
    );
  };

  const changeShapeStroke = (id: string, stroke: string | null) => {
    commitItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id || (item.type !== "shape" && item.type !== "element")) {
          return item;
        }

        const nextStrokeWidth =
          stroke && item.strokeWidth < MIN_SHAPE_STROKE_WIDTH
            ? DEFAULT_SHAPE_STROKE_WIDTH
            : item.strokeWidth;

        return {
          ...item,
          stroke,
          strokeWidth: nextStrokeWidth,
          size:
            item.type === "element"
              ? rescaleElementSizeForStrokeChange(
                  item,
                  nextStrokeWidth,
                  stroke
                )
              : item.size,
        };
      })
    );
  };

  const changeShapeStrokeWidth = (id: string, strokeWidth: number) => {
    const updateShape = (currentItems: DesignItem[]) =>
      currentItems.map((item) => {
        if (item.id !== id || (item.type !== "shape" && item.type !== "element")) {
          return item;
        }

        const effectiveMax = getEffectiveMaxStrokeWidth(item);
        const nextStrokeWidth = Math.max(
          MIN_SHAPE_STROKE_WIDTH,
          Math.min(effectiveMax, strokeWidth)
        );

        return {
          ...item,
          strokeWidth: nextStrokeWidth,
          size:
            item.type === "element"
              ? rescaleElementSizeForStrokeChange(
                  item,
                  nextStrokeWidth,
                  item.stroke
                )
              : item.size,
        };
      });

    if (isTransactionActive()) {
      updateItems(updateShape);
    } else {
      commitItems(updateShape);
    }
  };

  const startCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !selectedItemId) return;

    const selectedItem = items.find(
      (item) => item.id === selectedItemId
    );

    if (!selectedItem || selectedItem.locked) return;

    event.preventDefault();
    event.stopPropagation();

    commitHistoryTransaction();
    beginHistoryTransaction();

    pinchRef.current = {
      itemId: selectedItem.id,
      itemType: selectedItem.type,
      startDistance: getTouchDistance(event.touches),
      startWidth:
        selectedItem.type === "image" ||
        selectedItem.type === "shape" ||
        selectedItem.type === "element"
          ? selectedItem.size.width
          : undefined,
      startHeight:
        selectedItem.type === "image" ||
        selectedItem.type === "shape" ||
        selectedItem.type === "element"
          ? selectedItem.size.height
          : undefined,
      startFontSize:
        selectedItem.type === "text"
          ? selectedItem.fontSize
          : undefined,
    };

    justPinchedRef.current = true;
    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    setDraggingItemId(null);

    if (selectedItem.type !== "text") {
      setEditingItemId(null);
    }
  };

  const applyPinchDistance = (distance: number) => {
    if (!pinchRef.current) return;

    const scale = distance / pinchRef.current.startDistance;

    updateItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== pinchRef.current?.itemId) {
          return item;
        }

        if (
          item.type === "image" ||
          item.type === "shape" ||
          item.type === "element"
        ) {
          const width =
            (pinchRef.current.startWidth || DEFAULT_IMAGE_MAX_WIDTH) *
            scale;
          const height =
            (pinchRef.current.startHeight || DEFAULT_IMAGE_MAX_HEIGHT) *
            scale;

          return {
            ...item,
            size:
              item.type === "image"
                ? getBoundedImageSize(width, height)
                : getBoundedElementSize(width, height),
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

  const flushPinchDistance = () => {
    if (pinchFrameRef.current !== null) {
      cancelAnimationFrame(pinchFrameRef.current);
      pinchFrameRef.current = null;
    }

    const pendingDistance = pendingPinchDistanceRef.current;
    pendingPinchDistanceRef.current = null;

    if (pendingDistance !== null) {
      applyPinchDistance(pendingDistance);
    }
  };

  const moveCanvasPinch = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    pendingPinchDistanceRef.current = getTouchDistance(event.touches);

    if (pinchFrameRef.current !== null) return;

    pinchFrameRef.current = requestAnimationFrame(() => {
      pinchFrameRef.current = null;
      const distance = pendingPinchDistanceRef.current;
      pendingPinchDistanceRef.current = null;

      if (distance !== null) {
        applyPinchDistance(distance);
      }
    });
  };

  const endCanvasPinch = () => {
    if (pinchRef.current) {
      flushPinchDistance();
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

    const reader = new FileReader();
    const uploadedImage = new Image();

    uploadedImage.onload = () => {
      const newImage: DesignItem = {
        id: crypto.randomUUID(),
        type: "image",
        hidden: false,
        locked: false,
        src: uploadedImage.src,
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
      setShapeStyleItemId(null);
      setEditingItemId(null);
      setShowMobileContextToolbar(true);
      setShowImageAdjustments(false);
    };

    reader.onload = () => {
      if (typeof reader.result === "string") {
        uploadedImage.src = reader.result;
      }
    };
    reader.onerror = () => {
      setDraftSaveError(
        "This image could not be read. Please try uploading it again."
      );
    };
    uploadedImage.onerror = () => {
      setDraftSaveError(
        "This image could not be opened. Please try another file."
      );
    };

    reader.readAsDataURL(file);
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
      textAlign: "center",
    };

    commitItems((currentItems) => [
      ...currentItems,
      newText,
    ]);

    setSelectedItemId(newText.id);
    setShapeStyleItemId(null);
    setEditingItemId(newText.id);
    setShowMobileContextToolbar(true);
    setShowImageAdjustments(false);

    setTimeout(() => {
      canvasRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const addElement = (element: ElementAsset) => {
    const commonProperties = {
      id: crypto.randomUUID(),
      hidden: false,
      locked: false,
      position: {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2,
      },
      size: getBoundedElementSize(
        element.defaultSize.width,
        element.defaultSize.height
      ),
      rotation: 0,
    };
    const colourMode = getElementColourMode(element);
    const shapeStyle =
      element.insertion.kind === "shape"
        ? getDefaultShapeStyle(element.insertion.shapeKind)
        : null;
    const newElement: DesignItem = {
      ...commonProperties,
      type: "element",
      elementId: element.id,
      displayName: element.name,
      category: element.category,
      fill: elementSupportsFill(colourMode) ? shapeStyle?.fill ?? null : null,
      stroke: elementSupportsStroke(colourMode)
        ? shapeStyle?.stroke ?? DEFAULT_SHAPE_COLOUR
        : null,
      strokeWidth:
        elementSupportsStroke(colourMode)
          ? shapeStyle?.strokeWidth ?? getElementDefaultStrokeWidth(element)
          : 0,
      opacity: 100,
    };

    commitItems((currentItems) => [...currentItems, newElement]);
    setSelectedItemId(newElement.id);
    setShapeStyleItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(true);
    setShowImageAdjustments(false);
    returnToMobileContext();
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;

    commitItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== selectedItemId
      )
    );

    setSelectedItemId(null);
    setShapeStyleItemId(null);
    setEditingItemId(null);
    setShowMobileContextToolbar(false);
    setShowImageAdjustments(false);
  };

  const captureDragGrabOffset = (
    itemId: string,
    clientX: number,
    clientY: number
  ) => {
    const canvas = canvasRef.current;
    const item = latestItemsRef.current.find(
      (currentItem) => currentItem.id === itemId
    );

    if (!canvas || !item) {
      dragGrabOffsetRef.current = null;
      return;
    }

    const canvasBounds = getCanvasInteractionBounds(canvas);
    const canvasPoint = screenPointToCanvas(
      clientX,
      clientY,
      canvasBounds,
      canvasSize
    );

    dragGrabOffsetRef.current = {
      itemId,
      offset: {
        x: canvasPoint.x - item.position.x,
        y: canvasPoint.y - item.position.y,
      },
    };
  };

  const getPointerCanvasPoint = (
    clientX: number,
    clientY: number
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const canvasBounds = getCanvasInteractionBounds(canvas);

    return {
      point: screenPointToCanvas(
        clientX,
        clientY,
        canvasBounds,
        canvasSize
      ),
      scale: getCanvasDisplayScale(canvasBounds, canvasSize),
    };
  };

  const resolveVisiblePointerTarget = (
    pressedItem: DesignItem,
    clientX: number,
    clientY: number,
    pointerType: string,
    sourceElement?: HTMLElement
  ) => {
    if (
      pressedItem.id === selectedItemId ||
      pressedItem.type === "text" ||
      !sourceElement
    ) {
      return pressedItem;
    }

    const pointerCanvas = getPointerCanvasPoint(clientX, clientY);
    const pressedElement = sourceElement.closest<HTMLElement>(
      "[data-canvas-item-id]"
    );

    if (
      !pointerCanvas ||
      !pressedElement ||
      isPointerInsideVisibleContent({
        item: pressedItem,
        canvasPoint: pointerCanvas.point,
        element: pressedElement,
        canvasScale: pointerCanvas.scale,
        pointerType,
      })
    ) {
      return pressedItem;
    }

    const canvas = canvasRef.current;

    if (!canvas) return null;

    const pressedIndex = visibleCanvasItems.findIndex(
      (item) => item.id === pressedItem.id
    );

    for (let index = pressedIndex - 1; index >= 0; index -= 1) {
      const candidate = visibleCanvasItems[index];
      const candidateElement = canvas.querySelector<HTMLElement>(
        `[data-canvas-item-id="${CSS.escape(candidate.id)}"]`
      );

      if (
        candidateElement &&
        (candidate.type !== "text" ||
          document
            .elementsFromPoint(clientX, clientY)
            .some((element) => candidateElement.contains(element))) &&
        isPointerInsideVisibleContent({
          item: candidate,
          canvasPoint: pointerCanvas.point,
          element: candidateElement,
          canvasScale: pointerCanvas.scale,
          pointerType,
        })
      ) {
        return candidate;
      }
    }

    return null;
  };

  const applyDraggedItemPosition = useCallback((
    itemId: string,
    position: Position
  ) => {
    updateItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, position } : item
      )
    );
  }, [updateItems]);

  const flushDraggedItemPosition = useCallback(() => {
    if (dragPositionFrameRef.current !== null) {
      cancelAnimationFrame(dragPositionFrameRef.current);
      dragPositionFrameRef.current = null;
    }

    const pendingPosition = pendingDragPositionRef.current;
    pendingDragPositionRef.current = null;

    if (pendingPosition) {
      applyDraggedItemPosition(
        pendingPosition.itemId,
        pendingPosition.position
      );
    }
  }, [applyDraggedItemPosition]);

  const updateDraggedItemPosition = (
    itemId: string,
    event: React.PointerEvent<HTMLDivElement>,
    canvasBounds: DOMRect
  ) => {
    const grabOffset =
      dragGrabOffsetRef.current?.itemId === itemId
        ? dragGrabOffsetRef.current.offset
        : { x: 0, y: 0 };
    const position = getSnappedPosition(
      event,
      canvasBounds,
      grabOffset
    );

    if (!position) return;

    pendingDragPositionRef.current = { itemId, position };

    if (dragPositionFrameRef.current !== null) return;

    dragPositionFrameRef.current = requestAnimationFrame(() => {
      dragPositionFrameRef.current = null;
      const pendingPosition = pendingDragPositionRef.current;
      pendingDragPositionRef.current = null;

      if (pendingPosition) {
        applyDraggedItemPosition(
          pendingPosition.itemId,
          pendingPosition.position
        );
      }
    });
  };

  const moveItem = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (pinchRef.current) return;

    const pending = pendingDragRef.current;
    const canvas = getCanvasInteractionBounds(event.currentTarget);

    if (pending && pending.pointerId === event.pointerId) {
      const movedEnough =
        Math.abs(event.clientX - pending.startX) > 5 ||
        Math.abs(event.clientY - pending.startY) > 5;

      if (movedEnough || pending.moved) {
        pending.moved = true;

        activeDragRef.current = {
          itemId: pending.itemId,
          pointerId: pending.pointerId,
        };
        setDraggingItemId(pending.itemId);
        setEditingItemId(null);

        updateDraggedItemPosition(pending.itemId, event, canvas);
      }

      return;
    }

    const activeDrag = activeDragRef.current;

    if (
      !activeDrag ||
      activeDrag.pointerId !== event.pointerId
    ) {
      return;
    }

    setEditingItemId(null);

    updateDraggedItemPosition(activeDrag.itemId, event, canvas);
  };

  const stopDragging = () => {
  flushDraggedItemPosition();
  hideAlignmentGuides();

  requestAnimationFrame(() => {
    hideAlignmentGuides();
  });
    if (justPinchedRef.current) {
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      setDraggingItemId(null);

      return;
    }

    commitHistoryTransaction();

    if (
      pendingDragRef.current &&
      !pendingDragRef.current.moved
    ) {
      if (pendingDragRef.current.itemType === "text") {
        setEditingItemId(pendingDragRef.current.itemId);
      }

      setSelectedItemId(
        pendingDragRef.current.itemId
      );
    }

    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    setDraggingItemId(null);
  };

  useEffect(() => {
    const cancelDragOnWindowBlur = () => {
      if (!pendingDragRef.current && !activeDragRef.current) return;

      flushDraggedItemPosition();
      commitHistoryTransaction();
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      setDraggingItemId(null);
      setAlignmentGuides({
        vertical: false,
        horizontal: false,
      });
    };

    window.addEventListener("blur", cancelDragOnWindowBlur);

    return () => {
      window.removeEventListener("blur", cancelDragOnWindowBlur);
      pendingDragRef.current = null;
      activeDragRef.current = null;
      dragGrabOffsetRef.current = null;
      pendingDragPositionRef.current = null;
      if (dragPositionFrameRef.current !== null) {
        cancelAnimationFrame(dragPositionFrameRef.current);
        dragPositionFrameRef.current = null;
      }
    };
  }, [commitHistoryTransaction, flushDraggedItemPosition]);

  const startDesktopResize = (
    event: React.PointerEvent<HTMLDivElement>,
    onResize: (event: PointerEvent) => void,
    onComplete?: () => void,
    onStart?: () => void
  ) => {
    event.preventDefault();
    event.stopPropagation();
    activeResizeCleanupRef.current?.();
    commitHistoryTransaction();
    beginHistoryTransaction();
    onStart?.();

    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    let resizeFrame: number | null = null;
    let latestMoveEvent: PointerEvent | null = null;
    let stopped = false;

    const flushResize = () => {
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = null;
      }

      if (!latestMoveEvent) return;

      const moveEvent = latestMoveEvent;

      latestMoveEvent = null;
      onResize(moveEvent);
    };

    const scheduleResize = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      latestMoveEvent = moveEvent;

      if (resizeFrame !== null) return;

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        flushResize();
      });
    };

    const stopResize = (endEvent?: PointerEvent) => {
      if (stopped) return;
      if (endEvent && endEvent.pointerId !== pointerId) return;

      stopped = true;

      if (endEvent?.type === "pointerup") {
        latestMoveEvent = endEvent;
      }

      flushResize();
      onComplete?.();
      commitHistoryTransaction();

      handle.removeEventListener("pointermove", scheduleResize);
      handle.removeEventListener("pointerup", stopResize);
      handle.removeEventListener("pointercancel", stopResize);
      handle.removeEventListener("lostpointercapture", stopResize);
      window.removeEventListener("pointermove", scheduleResize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      window.removeEventListener("blur", stopResizeOnBlur);

      try {
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
      } catch {
        // Safari may already have released capture before this callback.
      }

      activeResizeCleanupRef.current = null;
    };
    const stopResizeOnBlur = () => stopResize();

    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // Window listeners below provide the Safari fallback when capture is
      // unavailable on a desktop resize handle.
    }
    handle.addEventListener("pointermove", scheduleResize);
    handle.addEventListener("pointerup", stopResize);
    handle.addEventListener("pointercancel", stopResize);
    handle.addEventListener("lostpointercapture", stopResize);
    window.addEventListener("pointermove", scheduleResize);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    window.addEventListener("blur", stopResizeOnBlur);

    activeResizeCleanupRef.current = stopResize;
  };

  const startImageResize = (
    event: React.PointerEvent<HTMLDivElement>,
    item: ResizableDesignItem,
    corner: ResizeCorner
  ) => {
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;
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
      const screenHorizontalChange =
        (moveEvent.clientX - startX) / displayScale;
      const screenVerticalChange =
        (moveEvent.clientY - startY) / displayScale;
      const rotation = (item.rotation * Math.PI) / 180;
      const horizontalChange =
        (screenHorizontalChange * Math.cos(rotation) +
          screenVerticalChange * Math.sin(rotation)) * horizontalDirection;
      const verticalChange =
        (-screenHorizontalChange * Math.sin(rotation) +
          screenVerticalChange * Math.cos(rotation)) * verticalDirection;
      const sizeVectorLengthSquared =
        startWidth * startWidth + startHeight * startHeight;
      const requestedScale = Math.max(
        Number.EPSILON,
        1 +
          (2 *
            (horizontalChange * startWidth +
              verticalChange * startHeight)) /
            sizeVectorLengthSquared
      );
      const nextSize =
        item.type === "image"
          ? getBoundedImageSize(
              startWidth * requestedScale,
              startHeight * requestedScale
            )
          : getBoundedElementSize(
              startWidth * requestedScale,
              startHeight * requestedScale
            );

      updateItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id &&
          currentItem.type === item.type
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
    const startPosition = { ...item.position };
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
    const canvasItem = canvasRef.current?.querySelector<HTMLElement>(
      `[data-canvas-item-id="${item.id}"]`
    );
    const selectionOverlay = canvasRef.current?.querySelector<HTMLElement>(
      `[data-selection-overlay="${item.id}"]`
    );
    const canvasTextRoot = canvasItem?.querySelector<HTMLElement>(
      `[data-canvas-text-root="${item.id}"]`
    );
    const previewLayout = canvasItem
      ? { overflow: canvasItem.style.overflow }
      : null;
    const measuredTextWidth = canvasTextRoot
      ? Number.parseFloat(getComputedStyle(canvasTextRoot).width)
      : Number.NaN;
    const frozenTextWidth = Number.isFinite(measuredTextWidth)
      ? measuredTextWidth
      : null;
    const startTextWidth = Math.max(
      1,
      canvasTextRoot?.offsetWidth ?? canvasItem?.offsetWidth ?? 1
    );
    const startTextHeight = Math.max(
      1,
      canvasTextRoot?.offsetHeight ?? canvasItem?.offsetHeight ?? 1
    );
    let finalFontSize = startFontSize;

    const freezePreviewLayout = () => {
      if (!canvasItem || frozenTextWidth === null) return;

      // Freeze the exact authored line box for the duration of the gesture.
      // The non-editing display is the sole intrinsic layout source, and the
      // explicit outer dimensions prevent WebKit from re-resolving
      // max-content/boundary sizing while its compositor scale changes.
      canvasItem.style.setProperty(
        "--text-resize-preview-width",
        `${frozenTextWidth}px`
      );
      canvasItem.style.setProperty(
        "--text-resize-preview-max-width",
        "none"
      );
      canvasItem.style.overflow = "visible";
    };

    const applyPreviewScale = (fontSize: number) => {
      const scale = fontSize / startFontSize;

      for (const element of [canvasItem, selectionOverlay]) {
        if (!element) continue;
        element.style.setProperty(
          "--text-resize-preview-scale",
          String(scale)
        );
        element.dataset.textResizePreview = "active";
      }

      if (canvasItem && frozenTextWidth !== null) {
        canvasItem.style.setProperty(
          "--text-resize-preview-width",
          `${frozenTextWidth}px`
        );
        canvasItem.style.setProperty(
          "--text-resize-preview-max-width",
          "none"
        );
        canvasItem.style.overflow = "visible";
      }
    };

    const clearPreviewScale = () => {
      for (const element of [canvasItem, selectionOverlay]) {
        if (!element) continue;
        element.style.removeProperty("--text-resize-preview-scale");
        delete element.dataset.textResizePreview;
      }
    };

    const restorePreviewLayout = () => {
      if (!canvasItem || !previewLayout) return;
      canvasItem.style.removeProperty("--text-resize-preview-width");
      canvasItem.style.removeProperty("--text-resize-preview-max-width");
      canvasItem.style.overflow = previewLayout.overflow;
    };

    const resize = (moveEvent: PointerEvent) => {
      const screenHorizontalChange =
        (moveEvent.clientX - startX) / displayScale;
      const screenVerticalChange =
        (moveEvent.clientY - startY) / displayScale;
      const rotation = (item.rotation * Math.PI) / 180;
      const horizontalChange =
        (screenHorizontalChange * Math.cos(rotation) +
          screenVerticalChange * Math.sin(rotation)) *
        horizontalDirection;
      const verticalChange =
        (-screenHorizontalChange * Math.sin(rotation) +
          screenVerticalChange * Math.cos(rotation)) *
        verticalDirection;
      // Project pointer travel onto the selected box's starting corner
      // vector. Font size is the committed scalar, but it is not the box's
      // geometric radius: dividing pointer travel by fontSize made a small
      // drag explosively scale wide/multi-line text, then appear to jump when
      // the real boundary-wrapped box replaced that preview on pointerup.
      const sizeVectorLengthSquared =
        startTextWidth * startTextWidth +
        startTextHeight * startTextHeight;
      const requestedScale = Math.max(
        Number.EPSILON,
        1 +
          (2 *
            (horizontalChange * startTextWidth +
              verticalChange * startTextHeight)) /
            sizeVectorLengthSquared
      );
      const nextFontSize = clampFontSize(
        startFontSize * requestedScale
      );

      // Keep the starting line layout stable during the gesture and scale
      // the complete rendered object. Re-laying out fontSize on every frame
      // causes max-content/boundary wrapping to feed back into the next
      // intrinsic measurement and can clip glyphs in both WebKit and Chrome.
      finalFontSize = nextFontSize;
      applyPreviewScale(nextFontSize);
    };

    const commitTextResize = () => {
      // Remove the promoted preview layer before committing the new font
      // metrics. Both mutations happen in the same pointerup task, so there
      // is no intermediate paint, and Safari cannot retain a raster surface
      // sized for the old intrinsic box after the final layout grows.
      clearPreviewScale();
      restorePreviewLayout();

      // Reconcile font size and the shared canvas-boundary layout only once,
      // at the gesture boundary.
      flushSync(() => {
        updateItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === item.id && currentItem.type === "text"
              ? {
                  ...currentItem,
                  fontSize: finalFontSize,
                  // A resize owns size only. Reassert the pointerdown anchor
                  // so no pending drag/observer work can feed measured bounds
                  // back into the persisted logical position.
                  position: startPosition,
                }
              : currentItem
          )
        );
      });

      const committedCanvasItem = canvasRef.current?.querySelector<HTMLElement>(
        `[data-canvas-item-id="${item.id}"]`
      );
      const committedTextRoot = committedCanvasItem?.querySelector<HTMLElement>(
        `[data-canvas-text-root="${item.id}"]`
      );
      const committedDisplay = committedCanvasItem?.querySelector<HTMLElement>(
        `[data-canvas-text-display="${item.id}"]`
      );
      const committedOverlay = canvasRef.current?.querySelector<HTMLElement>(
        `[data-selection-overlay="${item.id}"]`
      );

      if (committedCanvasItem && committedTextRoot && committedDisplay) {
        // Establish the complete final intrinsic box synchronously before
        // this pointerup task yields to paint. Reading both the root and the
        // visible display also guarantees that every final line participates
        // in WebKit's layout invalidation.
        const width = committedTextRoot.offsetWidth;
        const height = Math.max(
          committedTextRoot.offsetHeight,
          committedDisplay.scrollHeight
        );

        if (committedOverlay) {
          committedOverlay.style.width = `${width}px`;
          committedOverlay.style.height = `${height}px`;
        }

        committedDisplay.getClientRects();
        committedCanvasItem.getBoundingClientRect();
      }
    };

    startDesktopResize(
      event,
      resize,
      commitTextResize,
      freezePreviewLayout
    );
  };

  const changeCanvasViewMode = (mode: CanvasViewMode) => {
    if (mode === canvasViewMode) return;

    activeResizeCleanupRef.current?.();
    commitHistoryTransaction();
    pendingDragRef.current = null;
    activeDragRef.current = null;
    dragGrabOffsetRef.current = null;
    pinchRef.current = null;
    canvasTapRef.current = null;
    justPinchedRef.current = false;
    setDraggingItemId(null);
    setEditingItemId(null);
    hideAlignmentGuides();
    setCanvasViewMode(mode);
  };
  const toggleImageAdjustments = () => {
  setShapeStyleItemId(null);
  setShowImageAdjustments((currentValue) => {
    const nextValue = !currentValue;

    if (nextValue) {
      returnToMobileContext("image-adjustments");
    }

    return nextValue;
  });
};

  const toggleShapeStyle = () => {
    if (
      !selectedVisibleItem ||
      (selectedVisibleItem.type !== "shape" &&
        selectedVisibleItem.type !== "element") ||
      selectedVisibleItem.locked
    ) {
      return;
    }

    setShowImageAdjustments(false);
    setShapeStyleItemId((currentItemId) =>
      currentItemId === selectedVisibleItem.id
        ? null
        : selectedVisibleItem.id
    );
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
            ? "editor-focus-shell w-full max-w-full overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] md:flex md:h-full md:min-h-0 md:flex-col md:px-4 md:pb-3 md:pt-3"
            : "editor-focus-shell mx-auto mt-8 w-full max-w-[1600px] overflow-hidden rounded-xl border border-[var(--editor-border-subtle)] p-2 shadow-[0_16px_48px_rgb(2_6_23/0.24)] md:mt-2 md:flex md:flex-col md:px-4 md:pb-3 md:pt-3"
        }
        style={{ height: fullScreen ? undefined : desktopEditorHeight }}
      >
      <EditorHeader
        projectTitle={projectTitle}
        productName={productName}
        productAssetName={productAssetName}
        saveStatus={draftSaveError ? "Save issue" : draftReady ? "Autosave on" : "Opening draft"}
        productStudioHref={
          productId
            ? `/studio/${encodeURIComponent(productId)}${
                productAssetId
                  ? `?asset=${encodeURIComponent(productAssetId)}`
                  : ""
              }`
            : undefined
        }
        onTitleChange={handleTitleChange}
        onOpenProjects={() => setActiveToolbarPanel("projects")}
        onOpenSearch={() => setShowUniversalSearch(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={performUndo}
        onRedo={performRedo}
        onNewDesign={() => {
          setNewDesignError(null);
          setShapeStyleItemId(null);
          setShowNewDesignDialog(true);
        }}
        onExport={() => setShowExportDialog(true)}
      />

      {draftSaveError && (
        <p
          role="status"
          className="mx-1 mb-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
        >
          {draftSaveError}
        </p>
      )}

      {selectedVisibleItem && showMobileContextToolbar && (
        <MobileContextToolbar
          item={selectedVisibleItem}
          canSendBackward={canSendBackward}
          canBringForward={canBringForward}
          showImageAdjustments={showImageAdjustments}
          showShapeStyle={shapeStyleItemId === selectedVisibleItem.id}
          onChangeTextFontSize={changeTextFontSize}
          onChangeTextColor={changeTextColor}
          onChangeTextFont={changeTextFont}
          onRotate={rotateItem}
          onMoveBackward={(id) =>
            moveItemLayer(id, "backward")
          }
          onMoveForward={(id) =>
            moveItemLayer(id, "forward")
          }
          onToggleLock={toggleLayerLock}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          onDuplicate={duplicateSelectedItem}
          onDelete={deleteSelected}
          onToggleImageAdjustments={toggleImageAdjustments}
          onToggleShapeStyle={toggleShapeStyle}
          onChangeShapeFill={changeShapeFill}
          onChangeShapeStroke={changeShapeStroke}
          onChangeShapeStrokeWidth={changeShapeStrokeWidth}
          onChangeElementOpacity={changeElementOpacity}
          onAdjustmentStart={startImageAdjustment}
          onAdjustmentEnd={commitHistoryTransaction}
          onAdjustmentChange={changeImageAdjustment}
          onResetImageAdjustments={resetImageAdjustments}
        />
      )}

      <div className="grid min-w-0 gap-4 md:min-h-0 md:flex-1 md:grid-cols-[clamp(220px,18vw,260px)_minmax(0,1fr)_180px] md:gap-2">
        <EditorSidebar
          activeToolbarPanel={activeToolbarPanel}
          onToolbarPanelChange={setActiveToolbarPanel}
          activeProjectId={activeProject?.id ?? null}
          projectsRevision={projectsRevision}
          onSelectProject={handleSelectProject}
          onNewProject={() => {
            setNewDesignError(null);
            setShowNewDesignDialog(true);
          }}
          onImageUpload={handleImageUpload}
          onAddText={addText}
          onAddElement={addElement}
          onSelectTemplate={handleSelectTemplate}
          canvasSize={canvasSize}
          selectedCanvasPresetId={selectedCanvasPresetId}
          onCanvasSizeChange={selectCanvasSize}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
          canDuplicate={Boolean(selectedItem && !selectedItem.locked)}
          onDuplicate={duplicateSelectedItem}
          canDelete={Boolean(selectedItem && !selectedItem.locked)}
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
          emptyCanvasTitle={`Start your ${(
            productAssetName ?? projectTitle ?? "design"
          ).toLocaleLowerCase()}`}
          toolbar={selectedItem && !selectedItem.locked ? (
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
          onImagePointerDown={(
            id,
            clientX,
            clientY,
            pointerId,
            pointerType,
            sourceElement
          ) => {
            const pressedItem = latestItemsRef.current.find(
              (currentItem) => currentItem.id === id
            );

            if (!pressedItem) return false;

            const targetItem = resolveVisiblePointerTarget(
              pressedItem,
              clientX,
              clientY,
              pointerType,
              sourceElement
            );

            if (!targetItem) {
              clearSelection();
              return false;
            }

            if (targetItem.locked) {
              commitHistoryTransaction();
              pendingDragRef.current = null;
              activeDragRef.current = null;
              dragGrabOffsetRef.current = null;
              pinchRef.current = null;
              canvasTapRef.current = null;
              setDraggingItemId(null);
              setEditingItemId(null);
              setSelectedItemId(targetItem.id);
              setShapeStyleItemId(null);
              setShowMobileContextToolbar(true);
              setShowImageAdjustments(false);
              hideAlignmentGuides();
              return false;
            }

            commitHistoryTransaction();
            beginHistoryTransaction();

            captureDragGrabOffset(
              targetItem.id,
              clientX,
              clientY
            );
            activeDragRef.current = null;
            pendingDragRef.current = {
              itemId: targetItem.id,
              itemType: targetItem.type,
              pointerId,
              startX: clientX,
              startY: clientY,
              moved: false,
            };
            setSelectedItemId(targetItem.id);
            setShapeStyleItemId(null);
            setEditingItemId(null);
            setShowMobileContextToolbar(true);
            setShowImageAdjustments(false);
            return true;
          }}
          onLockedItemPointerDown={(id) => {
            commitHistoryTransaction();
            pendingDragRef.current = null;
            activeDragRef.current = null;
            dragGrabOffsetRef.current = null;
            pinchRef.current = null;
            canvasTapRef.current = null;
            setDraggingItemId(null);
            setEditingItemId(null);
            setSelectedItemId(id);
            setShapeStyleItemId(null);
            setShowMobileContextToolbar(true);
            setShowImageAdjustments(false);
            hideAlignmentGuides();
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
              setShapeStyleItemId(null);
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
            activeDragRef.current = null;
            dragGrabOffsetRef.current = null;
            setDraggingItemId(null);
            setSelectedItemId(id);
            setShapeStyleItemId(null);
            setShowMobileContextToolbar(true);
          }}
          onPendingDragStart={(id, startX, startY, pointerId) => {
            commitHistoryTransaction();
            beginHistoryTransaction();
            const item = latestItemsRef.current.find(
              (currentItem) => currentItem.id === id
            );

            captureDragGrabOffset(id, startX, startY);
            pendingDragRef.current = {
              itemId: id,
              itemType: item?.type ?? "text",
              pointerId,
              startX,
              startY,
              moved: false,
            };

            setSelectedItemId(id);
            setShapeStyleItemId(null);
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
          onChangeTextFontSize={changeTextFontSize}
          onChangeTextColor={changeTextColor}
          onChangeTextFont={changeTextFont}
          onRotate={rotateItem}
          onChangeShapeFill={changeShapeFill}
          onChangeShapeStroke={changeShapeStroke}
          onChangeShapeStrokeWidth={changeShapeStrokeWidth}
          onChangeElementOpacity={changeElementOpacity}
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

      <UniversalSearch
        open={showUniversalSearch}
        onClose={() => setShowUniversalSearch(false)}
        hasSelectedTextItem={Boolean(
          selectedItem &&
            selectedItem.type === "text" &&
            !selectedItem.locked
        )}
        onSelectFont={(fontFamily) => {
          if (selectedItem && selectedItem.type === "text") {
            changeTextFont(selectedItem.id, fontFamily);
          }
        }}
        onInsertElement={addElement}
        onSelectTemplate={handleSelectTemplate}
        onSelectProject={(project) => void handleSelectProject(project)}
      />
    </>
  );
}
