import type { DesignItem } from "../../components/editor/editor.types";
import {
  DEFAULT_DESKTOP_CANVAS_PRESET_ID,
  getCanvasPreset,
  isCanvasPresetId,
  isValidCanvasSize,
  type CanvasPresetId,
  type CanvasSize,
} from "../../components/editor/editor.constants";
import {
  prepareDesignItemsForStorage,
  restoreStoredDesignItems,
  type StoredDesignItem,
} from "../persistence/designItemStorage";
import {
  completeEditorTransaction,
  DRAFT_STORE_NAME,
  openEditorDatabase,
} from "../persistence/editorDatabase";

const CURRENT_DRAFT_KEY = "current-design";
const DRAFT_VERSION = 2;

type StoredEditorDraft = {
  key: typeof CURRENT_DRAFT_KEY;
  version: number;
  presetId: CanvasPresetId | string;
  canvasSize?: CanvasSize;
  items: StoredDesignItem[];
  savedAt: number;
};

export type EditorDraft = {
  presetId: CanvasPresetId;
  canvasSize: CanvasSize;
  items: DesignItem[];
};

export type RestoredEditorDraft = EditorDraft & {
  release: () => void;
};

let saveQueue: Promise<void> = Promise.resolve();
let lastSavedSignature: string | null = null;
const pendingSignatures = new Set<string>();

const createSignature = (draft: EditorDraft) => JSON.stringify(draft);

const isStoredDraft = (value: unknown): value is StoredEditorDraft => {
  if (!value || typeof value !== "object") return false;

  const draft = value as Partial<StoredEditorDraft>;

  return (
    draft.key === CURRENT_DRAFT_KEY &&
    (draft.version === 1 || draft.version === DRAFT_VERSION) &&
    typeof draft.presetId === "string" &&
    Array.isArray(draft.items)
  );
};

export const saveEditorDraft = (draft: EditorDraft) => {
  const signature = createSignature(draft);

  if (
    signature === lastSavedSignature ||
    pendingSignatures.has(signature)
  ) {
    return saveQueue;
  }

  pendingSignatures.add(signature);
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openEditorDatabase();
      const storedDraft: StoredEditorDraft = {
        key: CURRENT_DRAFT_KEY,
        version: DRAFT_VERSION,
        presetId: draft.presetId,
        canvasSize: draft.canvasSize,
        items: await prepareDesignItemsForStorage(draft.items),
        savedAt: Date.now(),
      };
      const transaction = database.transaction(
        DRAFT_STORE_NAME,
        "readwrite"
      );

      transaction.objectStore(DRAFT_STORE_NAME).put(storedDraft);
      await completeEditorTransaction(transaction);
      lastSavedSignature = signature;
    })
    .finally(() => {
      pendingSignatures.delete(signature);
    });

  return saveQueue;
};

export const resetEditorDraft = (draft: EditorDraft) => {
  const signature = createSignature(draft);

  pendingSignatures.add(signature);
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openEditorDatabase();
      const storedDraft: StoredEditorDraft = {
        key: CURRENT_DRAFT_KEY,
        version: DRAFT_VERSION,
        presetId: draft.presetId,
        canvasSize: draft.canvasSize,
        items: [],
        savedAt: Date.now(),
      };
      const transaction = database.transaction(
        DRAFT_STORE_NAME,
        "readwrite"
      );
      const store = transaction.objectStore(DRAFT_STORE_NAME);

      store.delete(CURRENT_DRAFT_KEY);
      store.put(storedDraft);
      await completeEditorTransaction(transaction);
      lastSavedSignature = signature;
    })
    .finally(() => {
      pendingSignatures.delete(signature);
    });

  return saveQueue;
};

export async function loadEditorDraft(): Promise<RestoredEditorDraft | null> {
  const database = await openEditorDatabase();
  const transaction = database.transaction(
    DRAFT_STORE_NAME,
    "readonly"
  );
  const request = transaction
    .objectStore(DRAFT_STORE_NAME)
    .get(CURRENT_DRAFT_KEY);
  const storedDraft = await new Promise<unknown>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });

  await completeEditorTransaction(transaction);

  if (!isStoredDraft(storedDraft)) return null;

  const items = await restoreStoredDesignItems(storedDraft.items);

  const presetIsKnown = isCanvasPresetId(storedDraft.presetId);
  const storedPresetId: CanvasPresetId = presetIsKnown
    ? (storedDraft.presetId as CanvasPresetId)
    : DEFAULT_DESKTOP_CANVAS_PRESET_ID;
  const fallbackPreset = getCanvasPreset(storedPresetId);
  const canvasSize = isValidCanvasSize(storedDraft.canvasSize)
    ? storedDraft.canvasSize
    : {
        width: fallbackPreset.width,
        height: fallbackPreset.height,
      };
  const presetId: CanvasPresetId = !presetIsKnown
    ? isValidCanvasSize(storedDraft.canvasSize)
      ? "custom"
      : DEFAULT_DESKTOP_CANVAS_PRESET_ID
    : storedPresetId === "custom" &&
        !isValidCanvasSize(storedDraft.canvasSize)
      ? fallbackPreset.id
      : storedPresetId;

  lastSavedSignature = createSignature({
    presetId,
    canvasSize,
    items,
  });

  return {
    presetId,
    canvasSize,
    items,
    release: () => undefined,
  };
}
