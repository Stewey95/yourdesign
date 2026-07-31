import type { ProjectRecord } from "./projects.types";
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
  openEditorDatabase,
  PROJECTS_STORE_NAME,
} from "../persistence/editorDatabase";

const ACTIVE_PROJECT_KEY = "gripix_active_project_id";

type StoredProjectRecord = Omit<ProjectRecord, "items"> & {
  items: StoredDesignItem[];
};

let saveQueue: Promise<void> = Promise.resolve();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const restoreProjectRecord = async (
  raw: unknown
): Promise<ProjectRecord | null> => {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    raw.id.length === 0
  ) {
    return null;
  }

  const presetIsKnown = isCanvasPresetId(raw.presetId);
  const presetId: CanvasPresetId = presetIsKnown
    ? (raw.presetId as CanvasPresetId)
    : isValidCanvasSize(raw.canvasSize)
      ? "custom"
      : DEFAULT_DESKTOP_CANVAS_PRESET_ID;
  const fallbackPreset = getCanvasPreset(presetId);
  const canvasSize: CanvasSize = isValidCanvasSize(raw.canvasSize)
    ? raw.canvasSize
    : { width: fallbackPreset.width, height: fallbackPreset.height };
  const items = await restoreStoredDesignItems(raw.items);
  const now = Date.now();

  return {
    id: raw.id,
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title
        : "Untitled Design",
    presetId,
    canvasSize,
    items,
    createdAt:
      typeof raw.createdAt === "number" &&
      Number.isFinite(raw.createdAt)
        ? raw.createdAt
        : now,
    updatedAt:
      typeof raw.updatedAt === "number" &&
      Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : now,
  };
};

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
    const database = await openEditorDatabase();
    const transaction = database.transaction(
      PROJECTS_STORE_NAME,
      "readonly"
    );
    const store = transaction.objectStore(PROJECTS_STORE_NAME);
    const request = store.getAll();

    const rawRecords = await new Promise<unknown[]>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result || []));
      request.addEventListener("error", () => reject(request.error));
    });

    await completeEditorTransaction(transaction);

    const restoredProjects = await Promise.all(
      rawRecords.map(restoreProjectRecord)
    );

    return restoredProjects
      .filter((project): project is ProjectRecord => project !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load projects from IndexedDB:", error);
    return [];
  }
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  try {
    const database = await openEditorDatabase();
    const transaction = database.transaction(
      PROJECTS_STORE_NAME,
      "readonly"
    );
    const store = transaction.objectStore(PROJECTS_STORE_NAME);
    const request = store.get(id);

    const raw = await new Promise<unknown>((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    await completeEditorTransaction(transaction);

    if (!raw) return null;

    return restoreProjectRecord(raw);
  } catch {
    return null;
  }
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openEditorDatabase();
      const storedProject: StoredProjectRecord = {
        ...project,
        items: await prepareDesignItemsForStorage(project.items),
        updatedAt: project.updatedAt || Date.now(),
      };
      const transaction = database.transaction(
        PROJECTS_STORE_NAME,
        "readwrite"
      );
      transaction
        .objectStore(PROJECTS_STORE_NAME)
        .put(storedProject);
      await completeEditorTransaction(transaction);
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
  const database = await openEditorDatabase();
  const transaction = database.transaction(
    PROJECTS_STORE_NAME,
    "readwrite"
  );
  transaction.objectStore(PROJECTS_STORE_NAME).delete(id);
  await completeEditorTransaction(transaction);

  if (getActiveProjectId() === id) {
    setActiveProjectId(null);
  }
}
