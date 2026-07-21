import type {
  DesignItem,
  ImageDesignItem,
} from "../../components/editor/editor.types";
import type { CanvasPresetId } from "../../components/editor/editor.constants";

const DATABASE_NAME = "genvilo-editor";
const DATABASE_VERSION = 1;
const DRAFT_STORE = "drafts";
const CURRENT_DRAFT_KEY = "current-design";
const DRAFT_VERSION = 1;

type StoredImageItem = Omit<ImageDesignItem, "src"> & {
  src: string | Blob;
};

type StoredDesignItem = Exclude<DesignItem, ImageDesignItem> | StoredImageItem;

type StoredEditorDraft = {
  key: typeof CURRENT_DRAFT_KEY;
  version: typeof DRAFT_VERSION;
  presetId: CanvasPresetId;
  items: StoredDesignItem[];
  savedAt: number;
};

export type EditorDraft = {
  presetId: CanvasPresetId;
  items: DesignItem[];
};

export type RestoredEditorDraft = EditorDraft & {
  release: () => void;
};

let databasePromise: Promise<IDBDatabase> | null = null;
let saveQueue: Promise<void> = Promise.resolve();
let lastSavedSignature: string | null = null;
const pendingSignatures = new Set<string>();
const blobCache = new Map<string, Blob>();

const openDraftDatabase = () => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "key" });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });

  return databasePromise;
};

const completeTransaction = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () => reject(transaction.error));
    transaction.addEventListener("error", () => reject(transaction.error));
  });

const createSignature = (draft: EditorDraft) => JSON.stringify(draft);

const prepareImageSource = async (source: string) => {
  if (!source.startsWith("blob:")) return source;

  const cachedBlob = blobCache.get(source);

  if (cachedBlob) return cachedBlob;

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error("An uploaded image could not be saved to the draft.");
  }

  const blob = await response.blob();

  blobCache.set(source, blob);
  return blob;
};

const prepareItems = (items: DesignItem[]) =>
  Promise.all(
    items.map(async (item): Promise<StoredDesignItem> =>
      item.type === "image"
        ? { ...item, src: await prepareImageSource(item.src) }
        : item
    )
  );

const isCanvasPresetId = (value: unknown): value is CanvasPresetId =>
  value === "landscape" || value === "portrait" || value === "square";

const isStoredDraft = (value: unknown): value is StoredEditorDraft => {
  if (!value || typeof value !== "object") return false;

  const draft = value as Partial<StoredEditorDraft>;

  return (
    draft.key === CURRENT_DRAFT_KEY &&
    draft.version === DRAFT_VERSION &&
    isCanvasPresetId(draft.presetId) &&
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
      const database = await openDraftDatabase();
      const storedDraft: StoredEditorDraft = {
        key: CURRENT_DRAFT_KEY,
        version: DRAFT_VERSION,
        presetId: draft.presetId,
        items: await prepareItems(draft.items),
        savedAt: Date.now(),
      };
      const transaction = database.transaction(DRAFT_STORE, "readwrite");

      transaction.objectStore(DRAFT_STORE).put(storedDraft);
      await completeTransaction(transaction);
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
      const database = await openDraftDatabase();
      const storedDraft: StoredEditorDraft = {
        key: CURRENT_DRAFT_KEY,
        version: DRAFT_VERSION,
        presetId: draft.presetId,
        items: [],
        savedAt: Date.now(),
      };
      const transaction = database.transaction(DRAFT_STORE, "readwrite");
      const store = transaction.objectStore(DRAFT_STORE);

      store.delete(CURRENT_DRAFT_KEY);
      store.put(storedDraft);
      await completeTransaction(transaction);
      lastSavedSignature = signature;
    })
    .finally(() => {
      pendingSignatures.delete(signature);
    });

  return saveQueue;
};

export async function loadEditorDraft(): Promise<RestoredEditorDraft | null> {
  const database = await openDraftDatabase();
  const transaction = database.transaction(DRAFT_STORE, "readonly");
  const request = transaction.objectStore(DRAFT_STORE).get(CURRENT_DRAFT_KEY);
  const storedDraft = await new Promise<unknown>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });

  await completeTransaction(transaction);

  if (!isStoredDraft(storedDraft)) return null;

  const objectUrls: string[] = [];
  const items = storedDraft.items.map((item): DesignItem => {
    const hidden = item.hidden === true;

    if (item.type !== "image" || typeof item.src === "string") {
      return { ...item, hidden } as DesignItem;
    }

    const source = URL.createObjectURL(item.src);

    objectUrls.push(source);
    blobCache.set(source, item.src);
    return { ...item, hidden, src: source };
  });

  lastSavedSignature = createSignature({
    presetId: storedDraft.presetId,
    items,
  });

  return {
    presetId: storedDraft.presetId,
    items,
    release: () => {
      objectUrls.forEach((source) => {
        URL.revokeObjectURL(source);
        blobCache.delete(source);
      });
    },
  };
}
