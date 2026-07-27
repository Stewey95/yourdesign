import type { ProjectRecord } from "./projects.types";
import type { DesignItem, ImageDesignItem, ShapeKind } from "../../components/editor/editor.types";
import {
  DEFAULT_DESKTOP_CANVAS_PRESET_ID,
  getCanvasPreset,
  isCanvasPresetId,
  isValidCanvasSize,
  type CanvasPresetId,
  type CanvasSize,
} from "../../components/editor/editor.constants";
import {
  getDefaultShapeStyle,
  SHAPE_DEFAULT_SIZES,
} from "../../components/editor/shape.constants";

const DATABASE_NAME = "genvilo-editor";
const DATABASE_VERSION = 2;
const DRAFT_STORE = "drafts";
const PROJECTS_STORE = "projects";
const ACTIVE_PROJECT_KEY = "gripix_active_project_id";

type StoredImageItem = Omit<ImageDesignItem, "src"> & {
  src: string | Blob;
};

type StoredDesignItem = Exclude<DesignItem, ImageDesignItem> | StoredImageItem;

type StoredProjectRecord = Omit<ProjectRecord, "items"> & {
  items: StoredDesignItem[];
};

let databasePromise: Promise<IDBDatabase> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

const openDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
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

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Image blob conversion failed."));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });

const prepareImageSource = async (source: string) => {
  if (!source.startsWith("blob:")) return source;
  try {
    const response = await fetch(source);
    if (!response.ok) return source;
    return await readBlobAsDataUrl(await response.blob());
  } catch {
    return source;
  }
};

const prepareItemsForStorage = (items: DesignItem[]) =>
  Promise.all(
    items.map(async (item): Promise<StoredDesignItem> =>
      item.type === "image"
        ? { ...item, src: await prepareImageSource(item.src) }
        : item
    )
  );

const isShapeKind = (value: unknown): value is ShapeKind =>
  value === "rectangle" ||
  value === "roundedRectangle" ||
  value === "circle" ||
  value === "triangle" ||
  value === "star" ||
  value === "line" ||
  value === "arrow";

const restoreStoredItems = (storedItems: StoredDesignItem[]): Promise<DesignItem[]> =>
  Promise.all(
    storedItems.map(async (item): Promise<DesignItem> => {
      const hidden = item.hidden === true;
      const locked = item.locked === true;

      if (item.type === "shape") {
        const shapeKind = isShapeKind(item.shapeKind)
          ? item.shapeKind
          : "rectangle";
        const defaults = getDefaultShapeStyle(shapeKind);
        const size = item.size ?? SHAPE_DEFAULT_SIZES[shapeKind];

        return {
          ...item,
          type: "shape",
          shapeKind,
          hidden,
          locked,
          size,
          fill:
            typeof item.fill === "string" || item.fill === null
              ? item.fill
              : defaults.fill,
          stroke:
            typeof item.stroke === "string" || item.stroke === null
              ? item.stroke
              : defaults.stroke,
          strokeWidth:
            typeof item.strokeWidth === "number" &&
            Number.isFinite(item.strokeWidth) &&
            item.strokeWidth >= 0
              ? item.strokeWidth
              : defaults.strokeWidth,
        };
      }

      if (item.type !== "image" || typeof item.src === "string") {
        return { ...item, hidden, locked } as DesignItem;
      }

      return {
        ...item,
        hidden,
        locked,
        src: await readBlobAsDataUrl(item.src),
      };
    })
  );

export const getActiveProjectId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
};

export const setActiveProjectId = (id: string | null): void => {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
};

export async function getAllProjects(): Promise<ProjectRecord[]> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(PROJECTS_STORE, "readonly");
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.getAll();

    const rawRecords = await new Promise<unknown[]>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result || []));
      request.addEventListener("error", () => reject(request.error));
    });

    await completeTransaction(transaction);

    const projects = await Promise.all(
      rawRecords.map(async (raw): Promise<ProjectRecord> => {
        const record = raw as StoredProjectRecord;
        const presetIsKnown = isCanvasPresetId(record.presetId);
        const presetId: CanvasPresetId = presetIsKnown
          ? (record.presetId as CanvasPresetId)
          : DEFAULT_DESKTOP_CANVAS_PRESET_ID;
        const fallbackPreset = getCanvasPreset(presetId);
        const canvasSize: CanvasSize = isValidCanvasSize(record.canvasSize)
          ? record.canvasSize
          : { width: fallbackPreset.width, height: fallbackPreset.height };

        const items = await restoreStoredItems(record.items || []);

        return {
          id: record.id,
          title: record.title || "Untitled Design",
          presetId,
          canvasSize,
          items,
          createdAt: record.createdAt || Date.now(),
          updatedAt: record.updatedAt || Date.now(),
        };
      })
    );

    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load projects from IndexedDB:", error);
    return [];
  }
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(PROJECTS_STORE, "readonly");
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.get(id);

    const raw = await new Promise<unknown>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    await completeTransaction(transaction);

    if (!raw) return null;

    const record = raw as StoredProjectRecord;
    const presetIsKnown = isCanvasPresetId(record.presetId);
    const presetId: CanvasPresetId = presetIsKnown
      ? (record.presetId as CanvasPresetId)
      : DEFAULT_DESKTOP_CANVAS_PRESET_ID;
    const fallbackPreset = getCanvasPreset(presetId);
    const canvasSize: CanvasSize = isValidCanvasSize(record.canvasSize)
      ? record.canvasSize
      : { width: fallbackPreset.width, height: fallbackPreset.height };

    const items = await restoreStoredItems(record.items || []);

    return {
      id: record.id,
      title: record.title || "Untitled Design",
      presetId,
      canvasSize,
      items,
      createdAt: record.createdAt || Date.now(),
      updatedAt: record.updatedAt || Date.now(),
    };
  } catch {
    return null;
  }
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openDatabase();
      const storedProject: StoredProjectRecord = {
        ...project,
        items: await prepareItemsForStorage(project.items),
        updatedAt: Date.now(),
      };
      const transaction = database.transaction(PROJECTS_STORE, "readwrite");
      transaction.objectStore(PROJECTS_STORE).put(storedProject);
      await completeTransaction(transaction);
    });

  return saveQueue;
}

export async function createProject(
  title = "Untitled Design",
  presetId: CanvasPresetId = DEFAULT_DESKTOP_CANVAS_PRESET_ID,
  canvasSize?: CanvasSize,
  items: DesignItem[] = []
): Promise<ProjectRecord> {
  const preset = getCanvasPreset(presetId);
  const finalSize = canvasSize || { width: preset.width, height: preset.height };
  const now = Date.now();
  const id = `proj_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const newProject: ProjectRecord = {
    id,
    title,
    presetId,
    canvasSize: finalSize,
    items,
    createdAt: now,
    updatedAt: now,
  };

  await saveProject(newProject);
  setActiveProjectId(id);
  return newProject;
}

export async function duplicateProject(id: string): Promise<ProjectRecord | null> {
  const original = await getProject(id);
  if (!original) return null;

  const now = Date.now();
  const duplicateId = `proj_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const duplicate: ProjectRecord = {
    ...original,
    id: duplicateId,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
    // Clone items with fresh IDs to prevent reference or key collisions
    items: original.items.map((item) => ({
      ...item,
      id: `item_${Math.random().toString(36).slice(2, 9)}`,
    })),
  };

  await saveProject(duplicate);
  return duplicate;
}

export async function renameProject(
  id: string,
  newTitle: string
): Promise<ProjectRecord | null> {
  const project = await getProject(id);
  if (!project) return null;

  const updated: ProjectRecord = {
    ...project,
    title: newTitle.trim() || "Untitled Design",
    updatedAt: Date.now(),
  };

  await saveProject(updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(PROJECTS_STORE, "readwrite");
  transaction.objectStore(PROJECTS_STORE).delete(id);
  await completeTransaction(transaction);

  if (getActiveProjectId() === id) {
    setActiveProjectId(null);
  }
}
