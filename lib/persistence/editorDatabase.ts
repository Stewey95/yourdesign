export const EDITOR_DATABASE_NAME = "genvilo-editor";
export const EDITOR_DATABASE_VERSION = 3;
export const DRAFT_STORE_NAME = "drafts";
export const PROJECTS_STORE_NAME = "projects";
export const PRODUCTS_STORE_NAME = "products";

let databasePromise: Promise<IDBDatabase> | null = null;

const prepareDatabase = (database: IDBDatabase) => {
  database.addEventListener("versionchange", () => {
    database.close();
    databasePromise = null;
  });

  return database;
};

const openCurrentDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(
      EDITOR_DATABASE_NAME,
      EDITOR_DATABASE_VERSION
    );

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        database.createObjectStore(DRAFT_STORE_NAME, {
          keyPath: "key",
        });
      }

      if (!database.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
        database.createObjectStore(PROJECTS_STORE_NAME, {
          keyPath: "id",
        });
      }

      if (!database.objectStoreNames.contains(PRODUCTS_STORE_NAME)) {
        database.createObjectStore(PRODUCTS_STORE_NAME, {
          keyPath: "id",
        });
      }
    });
    request.addEventListener("success", () =>
      resolve(prepareDatabase(request.result))
    );
    request.addEventListener("error", () => reject(request.error));
  });

const openFutureDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(EDITOR_DATABASE_NAME);

    request.addEventListener("success", () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(DRAFT_STORE_NAME) ||
        !database.objectStoreNames.contains(PROJECTS_STORE_NAME) ||
        !database.objectStoreNames.contains(PRODUCTS_STORE_NAME)
      ) {
        database.close();
        reject(
          new Error(
            "The editor database is missing a required storage area."
          )
        );
        return;
      }

      resolve(prepareDatabase(database));
    });
    request.addEventListener("error", () => reject(request.error));
  });

export const openEditorDatabase = () => {
  if (databasePromise) return databasePromise;

  databasePromise = openCurrentDatabase().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "VersionError") {
      return openFutureDatabase();
    }

    throw error;
  });

  databasePromise.catch(() => {
    databasePromise = null;
  });

  return databasePromise;
};

export const completeEditorTransaction = (
  transaction: IDBTransaction
) =>
  new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () =>
      reject(transaction.error)
    );
    transaction.addEventListener("error", () =>
      reject(transaction.error)
    );
  });
