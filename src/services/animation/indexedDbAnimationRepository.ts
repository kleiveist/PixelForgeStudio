import {
  AnimationPartAssetSchema,
  AnimationProjectSchema,
  CharacterKitSchema,
  type AnimationPartAsset,
  type AnimationProject,
  type CharacterKit,
  type StableId
} from "../../schemas";
import {
  analyzeAnimationBinaryReferences,
  type AnimationBinaryReferenceSnapshot
} from "./animationReferenceAnalysis";
import {
  createAnimationProjectSummary,
  parseAnimationProjectBundleImport,
  PersistAnimationPartImportInputSchema,
  PersistAnimationPartSetupInputSchema,
  sortAnimationProjects,
  sortAnimationProjectSummaries,
  sortCharacterKits,
  type AnimationGarbageCollectionResult,
  type AnimationProjectSummary,
  type AnimationRepository,
  type AnimationRepositoryFactoryResult,
  type AnimationRepositoryInvalidResult,
  type AnimationRepositoryMutationResult,
  type AnimationRepositoryQueryResult,
  type AnimationRepositoryReadResult,
  type AnimationRepositoryValueMutationResult,
  type PersistedAnimationPartImport,
  type PersistedAnimationPartSetup,
  type PersistedAnimationProjectBundle
} from "./animationRepository";
import {
  createDuplicatedProject,
  parseDuplicateProjectInput,
  parseRepositoryId,
  parseRepositoryValue,
  repositoryConflict,
  repositoryInvalid,
  repositoryNotFound,
  repositoryOpenUnavailable,
  repositoryTransactionFailed
} from "./repositorySupport";

export const ANIMATION_DATABASE_NAME = "pixelforge-studio" as const;
export const ANIMATION_DATABASE_VERSION = 1 as const;

export const ANIMATION_DATABASE_STORES = Object.freeze({
  projects: "animationProjects",
  partAssets: "animationPartAssets",
  imageBlobs: "animationImageBlobs",
  kits: "animationCharacterKits",
  previews: "animationPreviews"
} as const);

export const ANIMATION_DATABASE_INDEXES = Object.freeze({
  projectUpdatedAt: "updatedAt",
  partSlot: "slot",
  partDirection: "direction",
  kitUpdatedAt: "updatedAt"
} as const);

interface StoredImageBlob {
  readonly blobId: StableId;
  readonly blob: Blob;
}

interface StoredPreview {
  readonly previewId: StableId;
  readonly blob: Blob;
}

function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string
): void {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, { unique: false });
  }
}

function getOrCreateStore(
  database: IDBDatabase,
  transaction: IDBTransaction,
  name: string,
  keyPath: string
): IDBObjectStore {
  return database.objectStoreNames.contains(name)
    ? transaction.objectStore(name)
    : database.createObjectStore(name, { keyPath });
}

/**
 * Additive database migrations live in monotonically ordered oldVersion
 * blocks. Future versions append a new `if (oldVersion < n)` block and must
 * not delete a previous store or index as part of an ordinary upgrade.
 */
export function upgradeAnimationDatabase(
  database: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number
): void {
  if (oldVersion < 1) {
    const projects = getOrCreateStore(
      database,
      transaction,
      ANIMATION_DATABASE_STORES.projects,
      "projectId"
    );
    ensureIndex(
      projects,
      ANIMATION_DATABASE_INDEXES.projectUpdatedAt,
      "updatedAt"
    );

    const partAssets = getOrCreateStore(
      database,
      transaction,
      ANIMATION_DATABASE_STORES.partAssets,
      "assetId"
    );
    ensureIndex(partAssets, ANIMATION_DATABASE_INDEXES.partSlot, "slot");
    ensureIndex(
      partAssets,
      ANIMATION_DATABASE_INDEXES.partDirection,
      "direction"
    );

    getOrCreateStore(
      database,
      transaction,
      ANIMATION_DATABASE_STORES.imageBlobs,
      "blobId"
    );

    const kits = getOrCreateStore(
      database,
      transaction,
      ANIMATION_DATABASE_STORES.kits,
      "kitId"
    );
    ensureIndex(kits, ANIMATION_DATABASE_INDEXES.kitUpdatedAt, "updatedAt");

    getOrCreateStore(
      database,
      transaction,
      ANIMATION_DATABASE_STORES.previews,
      "previewId"
    );
  }
}

function openAnimationDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(
      ANIMATION_DATABASE_NAME,
      ANIMATION_DATABASE_VERSION
    );
    let settled = false;

    request.onupgradeneeded = (event) => {
      const transaction = request.transaction;
      if (!transaction) {
        settled = true;
        reject(new Error("IndexedDB upgrade transaction is unavailable."));
        return;
      }

      try {
        upgradeAnimationDatabase(
          request.result,
          transaction,
          event.oldVersion
        );
      } catch (error) {
        transaction.abort();
        settled = true;
        reject(error);
      }
    };

    request.onblocked = () => {
      if (settled) return;
      settled = true;
      reject(new Error("IndexedDB open request is blocked by another connection."));
    };

    request.onerror = () => {
      if (settled) return;
      settled = true;
      reject(request.error ?? new Error("IndexedDB open request failed."));
    };

    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      resolve(request.result);
    };
  });
}

function requestValue<Value>(request: IDBRequest<Value>): Promise<Value> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  const completion = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
  void completion.catch(() => undefined);
  return completion;
}

function abortQuietly(transaction: IDBTransaction): void {
  try {
    transaction.abort();
  } catch {
    // A transaction that already completed needs no further rollback.
  }
}

function isConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ConstraintError"
  );
}

function isBlob(value: unknown): value is Blob {
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Blob>;
  return (
    typeof candidate.size === "number" &&
    typeof candidate.type === "string" &&
    typeof candidate.slice === "function"
  );
}

function parseStoredBlob(
  input: unknown,
  idKey: "blobId" | "previewId",
  expectedId: StableId
):
  | Readonly<{ success: true; value: Blob }>
  | Readonly<{ success: false; result: AnimationRepositoryInvalidResult }> {
  if (typeof input !== "object" || input === null) {
    return {
      success: false,
      result: repositoryInvalid(
        "Stored binary data is invalid.",
        idKey,
        "The binary record must be an object."
      )
    };
  }

  const record = input as Record<string, unknown>;
  const parsedId = parseRepositoryId(record[idKey], idKey);
  if (!parsedId.success) return parsedId;
  if (parsedId.value !== expectedId) {
    return {
      success: false,
      result: repositoryInvalid(
        "Stored binary data is invalid.",
        idKey,
        "The stored record ID does not match its IndexedDB key."
      )
    };
  }
  if (!isBlob(record.blob)) {
    return {
      success: false,
      result: repositoryInvalid(
        "Stored binary data is invalid.",
        "blob",
        "The stored binary value is not a Blob."
      )
    };
  }
  return { success: true, value: record.blob };
}

export class IndexedDbAnimationRepository implements AnimationRepository {
  private databasePromise: Promise<IDBDatabase> | undefined;

  public constructor(private readonly factory: IDBFactory) {}

  private getDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;

    const opening = openAnimationDatabase(this.factory);
    this.databasePromise = opening;
    void opening.catch(() => {
      if (this.databasePromise === opening) this.databasePromise = undefined;
    });
    void opening
      .then((database) => {
        database.onversionchange = () => {
          database.close();
          if (this.databasePromise === opening) this.databasePromise = undefined;
        };
      })
      .catch(() => undefined);
    return opening;
  }

  public async initialize(): Promise<
    Readonly<{ status: "ok" }> | ReturnType<typeof repositoryOpenUnavailable>
  > {
    try {
      await this.getDatabase();
      return { status: "ok" };
    } catch (error) {
      return repositoryOpenUnavailable(error);
    }
  }

  public async close(): Promise<void> {
    const databasePromise = this.databasePromise;
    this.databasePromise = undefined;
    if (!databasePromise) return;
    try {
      const database = await databasePromise;
      database.close();
    } catch {
      // A failed open has no connection to close.
    }
  }

  private async databaseOrUnavailable(): Promise<
    | Readonly<{ status: "ok"; value: IDBDatabase }>
    | ReturnType<typeof repositoryOpenUnavailable>
  > {
    try {
      return { status: "ok", value: await this.getDatabase() };
    } catch (error) {
      return repositoryOpenUnavailable(error);
    }
  }

  public async listProjects(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProject[]>
  > {
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readonly"
      );
      const completion = transactionDone(transaction);
      const rows = await requestValue<unknown[]>(
        transaction.objectStore(ANIMATION_DATABASE_STORES.projects).getAll()
      );
      await completion;

      const projects: AnimationProject[] = [];
      for (const row of rows) {
        const project = parseRepositoryValue(
          AnimationProjectSchema,
          row,
          "Stored project metadata is invalid."
        );
        if (!project.success) return project.result;
        projects.push(project.value);
      }
      return { status: "ok", value: sortAnimationProjects(projects) };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async listProjectSummaries(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProjectSummary[]>
  > {
    const projects = await this.listProjects();
    if (projects.status !== "ok") return projects;
    return {
      status: "ok",
      value: sortAnimationProjectSummaries(
        projects.value.map(createAnimationProjectSummary)
      )
    };
  }

  public async readProject(
    projectId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationProject>> {
    const id = parseRepositoryId(projectId, "Project ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readonly"
      );
      const completion = transactionDone(transaction);
      const row = await requestValue<unknown>(
        transaction.objectStore(ANIMATION_DATABASE_STORES.projects).get(id.value)
      );
      await completion;
      if (row === undefined) return repositoryNotFound("project", id.value);
      const project = parseRepositoryValue(
        AnimationProjectSchema,
        row,
        "Stored project metadata is invalid."
      );
      return project.success
        ? { status: "ok", value: project.value }
        : project.result;
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async createProject(
    input: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const project = parseRepositoryValue(
      AnimationProjectSchema,
      input,
      "The project was not created because its metadata is invalid."
    );
    if (!project.success) return project.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const addition = requestValue(
        transaction
          .objectStore(ANIMATION_DATABASE_STORES.projects)
          .add(project.value)
      );
      await Promise.all([addition, completion]);
      return { status: "ok" };
    } catch (error) {
      return isConstraintError(error)
        ? repositoryConflict("project", project.value.projectId)
        : repositoryTransactionFailed(error);
    }
  }

  public async writeProject(
    input: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const project = parseRepositoryValue(
      AnimationProjectSchema,
      input,
      "The project was not written because its metadata is invalid."
    );
    if (!project.success) return project.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const store = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const existing = await requestValue<unknown>(
        store.get(project.value.projectId)
      );
      if (existing === undefined) {
        await completion;
        return repositoryNotFound("project", project.value.projectId);
      }
      await Promise.all([requestValue(store.put(project.value)), completion]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async deleteProject(
    projectId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(projectId, "Project ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const store = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const existing = await requestValue<unknown>(store.get(id.value));
      if (existing === undefined) {
        await completion;
        return repositoryNotFound("project", id.value);
      }
      await Promise.all([requestValue(store.delete(id.value)), completion]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async duplicateProject(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<AnimationProject>> {
    const command = parseDuplicateProjectInput(input);
    if (!command.success) return command.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.projects,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const store = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const [sourceRow, destinationRow] = await Promise.all([
        requestValue<unknown>(store.get(command.value.sourceProjectId)),
        requestValue<unknown>(store.get(command.value.newProjectId))
      ]);
      if (sourceRow === undefined) {
        await completion;
        return repositoryNotFound("project", command.value.sourceProjectId);
      }
      if (destinationRow !== undefined) {
        await completion;
        return repositoryConflict("project", command.value.newProjectId);
      }

      const source = parseRepositoryValue(
        AnimationProjectSchema,
        sourceRow,
        "Stored source project metadata is invalid."
      );
      if (!source.success) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return source.result;
      }
      const duplicate = createDuplicatedProject(source.value, command.value);
      if (!duplicate.success) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return duplicate.result;
      }

      await Promise.all([requestValue(store.add(duplicate.value)), completion]);
      return { status: "ok", value: duplicate.value };
    } catch (error) {
      return isConstraintError(error)
        ? repositoryConflict("project", command.value.newProjectId)
        : repositoryTransactionFailed(error);
    }
  }

  public async importProjectBundle(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationProjectBundle>> {
    const command = parseAnimationProjectBundleImport(input);
    if (!command.success) return command.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    const { bundle, imageBlobs, preview, conflictResolution } = command.value;
    let transaction: IDBTransaction | undefined;
    let completion: Promise<void> | undefined;
    const pendingRequests: Promise<unknown>[] = [];
    try {
      transaction = database.value.transaction(
        [
          ANIMATION_DATABASE_STORES.projects,
          ANIMATION_DATABASE_STORES.partAssets,
          ANIMATION_DATABASE_STORES.imageBlobs,
          ANIMATION_DATABASE_STORES.previews
        ],
        "readwrite"
      );
      completion = transactionDone(transaction);
      const projects = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const parts = transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets);
      const blobs = transaction.objectStore(ANIMATION_DATABASE_STORES.imageBlobs);
      const previews = transaction.objectStore(ANIMATION_DATABASE_STORES.previews);

      const projectRead = requestValue<unknown>(projects.get(bundle.project.projectId));
      const partReads = bundle.partAssets.map((part) =>
        requestValue<unknown>(parts.get(part.assetId))
      );
      const blobReads = imageBlobs.map((entry) =>
        requestValue<unknown>(blobs.get(entry.blobId))
      );
      const previewRead = preview
        ? requestValue<unknown>(previews.get(preview.previewId))
        : Promise.resolve(undefined);
      pendingRequests.push(projectRead, ...partReads, ...blobReads, previewRead);
      const [existingProject, existingParts, existingBlobs, existingPreview] =
        await Promise.all([
          projectRead,
          Promise.all(partReads),
          Promise.all(blobReads),
          previewRead
        ]);
      const replacing = existingProject !== undefined;

      if (conflictResolution === "abort") {
        let conflict: ReturnType<typeof repositoryConflict> | null = null;
        if (replacing) {
          conflict = repositoryConflict("project", bundle.project.projectId);
        } else {
          const partIndex = existingParts.findIndex((row) => row !== undefined);
          const blobIndex = existingBlobs.findIndex((row) => row !== undefined);
          if (partIndex >= 0) {
            conflict = repositoryConflict(
              "partAsset",
              bundle.partAssets[partIndex]!.assetId
            );
          } else if (blobIndex >= 0) {
            conflict = repositoryConflict("imageBlob", imageBlobs[blobIndex]!.blobId);
          } else if (preview && existingPreview !== undefined) {
            conflict = repositoryConflict("preview", preview.previewId);
          }
        }
        if (conflict) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return conflict;
        }
      }

      const writes: Promise<unknown>[] = [requestValue(projects.put(bundle.project))];
      for (const part of bundle.partAssets) writes.push(requestValue(parts.put(part)));
      for (const entry of imageBlobs) {
        const row: StoredImageBlob = { blobId: entry.blobId, blob: entry.blob };
        writes.push(requestValue(blobs.put(row)));
      }
      if (preview) {
        const row: StoredPreview = { previewId: preview.previewId, blob: preview.blob };
        writes.push(requestValue(previews.put(row)));
      }
      pendingRequests.push(...writes);
      await Promise.all([...writes, completion]);
      return {
        status: "ok",
        value: Object.freeze({ project: bundle.project, replaced: replacing })
      };
    } catch (error) {
      if (transaction) abortQuietly(transaction);
      await Promise.allSettled(
        completion ? [...pendingRequests, completion] : pendingRequests
      );
      return repositoryTransactionFailed(error);
    }
  }

  public async readPartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationPartAsset>> {
    const id = parseRepositoryId(assetId, "Part asset ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.partAssets,
        "readonly"
      );
      const completion = transactionDone(transaction);
      const row = await requestValue<unknown>(
        transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets).get(id.value)
      );
      await completion;
      if (row === undefined) return repositoryNotFound("partAsset", id.value);
      const partAsset = parseRepositoryValue(
        AnimationPartAssetSchema,
        row,
        "Stored part asset metadata is invalid."
      );
      return partAsset.success
        ? { status: "ok", value: partAsset.value }
        : partAsset.result;
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async writePartAsset(
    input: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult> {
    const partAsset = parseRepositoryValue(
      AnimationPartAssetSchema,
      input,
      "The part asset was not written because its metadata is invalid."
    );
    if (!partAsset.success) return partAsset.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    let transaction: IDBTransaction | undefined;
    let completion: Promise<void> | undefined;
    const pendingRequests: Promise<unknown>[] = [];
    try {
      transaction = database.value.transaction(
        [
          ANIMATION_DATABASE_STORES.partAssets,
          ANIMATION_DATABASE_STORES.imageBlobs
        ],
        "readwrite"
      );
      completion = transactionDone(transaction);
      const metadataWrite = requestValue(
        transaction
          .objectStore(ANIMATION_DATABASE_STORES.partAssets)
          .put(partAsset.value)
      );
      pendingRequests.push(metadataWrite);
      const blobRecord: StoredImageBlob = {
        blobId: partAsset.value.blobId,
        blob
      };
      const blobWrite = requestValue(
        transaction
          .objectStore(ANIMATION_DATABASE_STORES.imageBlobs)
          .put(blobRecord)
      );
      pendingRequests.push(blobWrite);
      await Promise.all([metadataWrite, blobWrite, completion]);
      return { status: "ok" };
    } catch (error) {
      if (transaction) abortQuietly(transaction);
      await Promise.allSettled(
        completion ? [...pendingRequests, completion] : pendingRequests
      );
      return repositoryTransactionFailed(error);
    }
  }

  public async writePartAssetToProject(
    input: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationPartImport>> {
    const command = parseRepositoryValue(
      PersistAnimationPartImportInputSchema,
      input,
      "The part import was not written because its metadata is invalid."
    );
    if (!command.success) return command.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    let transaction: IDBTransaction | undefined;
    let completion: Promise<void> | undefined;
    const pendingRequests: Promise<unknown>[] = [];
    try {
      transaction = database.value.transaction(
        [
          ANIMATION_DATABASE_STORES.projects,
          ANIMATION_DATABASE_STORES.partAssets,
          ANIMATION_DATABASE_STORES.imageBlobs
        ],
        "readwrite"
      );
      completion = transactionDone(transaction);
      const projects = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const parts = transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets);
      const blobs = transaction.objectStore(ANIMATION_DATABASE_STORES.imageBlobs);
      const [currentProjectRow, existingPartRow, existingBlobRow, replacedPartRow] = await Promise.all([
        requestValue<unknown>(projects.get(command.value.project.projectId)),
        requestValue<unknown>(parts.get(command.value.partAsset.assetId)),
        requestValue<unknown>(blobs.get(command.value.partAsset.blobId)),
        command.value.replacedAssetId
          ? requestValue<unknown>(parts.get(command.value.replacedAssetId))
          : Promise.resolve(undefined)
      ]);

      if (currentProjectRow === undefined) {
        await completion;
        return repositoryNotFound("project", command.value.project.projectId);
      }
      if (existingPartRow !== undefined) {
        await completion;
        return repositoryConflict("partAsset", command.value.partAsset.assetId);
      }
      if (existingBlobRow !== undefined) {
        await completion;
        return repositoryConflict("imageBlob", command.value.partAsset.blobId);
      }
      const currentProject = parseRepositoryValue(
        AnimationProjectSchema,
        currentProjectRow,
        "Stored project metadata is invalid; the part import was cancelled."
      );
      if (!currentProject.success) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return currentProject.result;
      }
      if (
        command.value.replacedAssetId !== undefined &&
        !currentProject.value.parts.some(
          ({ assetId }) => assetId === command.value.replacedAssetId
        )
      ) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return repositoryConflict("project", currentProject.value.projectId);
      }
      if (command.value.replacedAssetId !== undefined) {
        if (replacedPartRow === undefined) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return repositoryNotFound("partAsset", command.value.replacedAssetId);
        }
        const replacedPart = parseRepositoryValue(
          AnimationPartAssetSchema,
          replacedPartRow,
          "Stored replacement PartAsset metadata is invalid; the import was cancelled."
        );
        if (!replacedPart.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return replacedPart.result;
        }
        if (
          replacedPart.value.slot !== command.value.partAsset.slot ||
          replacedPart.value.direction !== command.value.partAsset.direction
        ) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return repositoryConflict("project", currentProject.value.projectId);
        }
      }
      const expectedPartIds = [
        ...currentProject.value.parts
          .map(({ assetId }) => assetId)
          .filter((assetId) => assetId !== command.value.replacedAssetId),
        command.value.partAsset.assetId
      ];
      if (
        command.value.project.parts.length !== expectedPartIds.length ||
        command.value.project.parts.some(
          ({ assetId }, index) => assetId !== expectedPartIds[index]
        )
      ) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return repositoryConflict("project", currentProject.value.projectId);
      }

      const projectWrite = requestValue(projects.put(command.value.project));
      pendingRequests.push(projectWrite);
      const partWrite = requestValue(parts.add(command.value.partAsset));
      pendingRequests.push(partWrite);
      const blobRecord: StoredImageBlob = {
        blobId: command.value.partAsset.blobId,
        blob
      };
      const blobWrite = requestValue(blobs.add(blobRecord));
      pendingRequests.push(blobWrite);
      await Promise.all([projectWrite, partWrite, blobWrite, completion]);
      return {
        status: "ok",
        value: Object.freeze({
          project: command.value.project,
          partAsset: command.value.partAsset,
          ...(command.value.replacedAssetId
            ? { replacedAssetId: command.value.replacedAssetId }
            : {})
        })
      };
    } catch (error) {
      if (transaction) abortQuietly(transaction);
      await Promise.allSettled(
        completion ? [...pendingRequests, completion] : pendingRequests
      );
      return repositoryTransactionFailed(error);
    }
  }

  public async writePartSetupToProject(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationPartSetup>> {
    const command = parseRepositoryValue(
      PersistAnimationPartSetupInputSchema,
      input,
      "The part setup was not written because its metadata is invalid."
    );
    if (!command.success) return command.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    let transaction: IDBTransaction | undefined;
    let completion: Promise<void> | undefined;
    const pendingRequests: Promise<unknown>[] = [];
    try {
      transaction = database.value.transaction(
        [
          ANIMATION_DATABASE_STORES.projects,
          ANIMATION_DATABASE_STORES.partAssets
        ],
        "readwrite"
      );
      completion = transactionDone(transaction);
      const projects = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
      const parts = transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets);
      const [currentProjectRow, currentPartRow] = await Promise.all([
        requestValue<unknown>(projects.get(command.value.project.projectId)),
        requestValue<unknown>(parts.get(command.value.partAsset.assetId))
      ]);
      if (currentProjectRow === undefined) {
        await completion;
        return repositoryNotFound("project", command.value.project.projectId);
      }
      if (currentPartRow === undefined) {
        await completion;
        return repositoryNotFound("partAsset", command.value.partAsset.assetId);
      }
      const currentProject = parseRepositoryValue(
        AnimationProjectSchema,
        currentProjectRow,
        "Stored project metadata is invalid; the part setup was cancelled."
      );
      const currentPart = parseRepositoryValue(
        AnimationPartAssetSchema,
        currentPartRow,
        "Stored PartAsset metadata is invalid; the part setup was cancelled."
      );
      if (!currentProject.success) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return currentProject.result;
      }
      if (!currentPart.success) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return currentPart.result;
      }
      const unchangedIdentity =
        currentPart.value.blobId === command.value.partAsset.blobId &&
        currentPart.value.slot === command.value.partAsset.slot &&
        currentPart.value.direction === command.value.partAsset.direction &&
        currentPart.value.createdAt === command.value.partAsset.createdAt &&
        JSON.stringify(currentPart.value.sourceSize) ===
          JSON.stringify(command.value.partAsset.sourceSize) &&
        JSON.stringify(currentPart.value.trimRect) ===
          JSON.stringify(command.value.partAsset.trimRect);
      const sameAssignments =
        currentProject.value.parts.length === command.value.project.parts.length &&
        currentProject.value.parts.every(
          ({ assetId }, index) =>
            assetId === command.value.project.parts[index]?.assetId
        );
      if (!unchangedIdentity || !sameAssignments) {
        abortQuietly(transaction);
        await completion.catch(() => undefined);
        return repositoryConflict("project", currentProject.value.projectId);
      }

      const projectWrite = requestValue(projects.put(command.value.project));
      const partWrite = requestValue(parts.put(command.value.partAsset));
      pendingRequests.push(projectWrite, partWrite);
      await Promise.all([projectWrite, partWrite, completion]);
      return {
        status: "ok",
        value: Object.freeze({
          project: command.value.project,
          partAsset: command.value.partAsset
        })
      };
    } catch (error) {
      if (transaction) abortQuietly(transaction);
      await Promise.allSettled(
        completion ? [...pendingRequests, completion] : pendingRequests
      );
      return repositoryTransactionFailed(error);
    }
  }

  public async deletePartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(assetId, "Part asset ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.partAssets,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const store = transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets);
      const existing = await requestValue<unknown>(store.get(id.value));
      if (existing === undefined) {
        await completion;
        return repositoryNotFound("partAsset", id.value);
      }
      await Promise.all([requestValue(store.delete(id.value)), completion]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  private async readBinary(
    idInput: unknown,
    kind: "imageBlob" | "preview"
  ): Promise<AnimationRepositoryReadResult<Blob>> {
    const label = kind === "imageBlob" ? "Image blob ID" : "Preview ID";
    const id = parseRepositoryId(idInput, label);
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;
    const storeName =
      kind === "imageBlob"
        ? ANIMATION_DATABASE_STORES.imageBlobs
        : ANIMATION_DATABASE_STORES.previews;
    const idKey = kind === "imageBlob" ? "blobId" : "previewId";

    try {
      const transaction = database.value.transaction(storeName, "readonly");
      const completion = transactionDone(transaction);
      const row = await requestValue<unknown>(
        transaction.objectStore(storeName).get(id.value)
      );
      await completion;
      if (row === undefined) return repositoryNotFound(kind, id.value);
      const stored = parseStoredBlob(row, idKey, id.value);
      return stored.success
        ? { status: "ok", value: stored.value }
        : stored.result;
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  private async writeBinary(
    idInput: unknown,
    blob: Blob,
    kind: "imageBlob" | "preview"
  ): Promise<AnimationRepositoryMutationResult> {
    const label = kind === "imageBlob" ? "Image blob ID" : "Preview ID";
    const id = parseRepositoryId(idInput, label);
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;
    const storeName =
      kind === "imageBlob"
        ? ANIMATION_DATABASE_STORES.imageBlobs
        : ANIMATION_DATABASE_STORES.previews;
    const row: StoredImageBlob | StoredPreview =
      kind === "imageBlob"
        ? { blobId: id.value, blob }
        : { previewId: id.value, blob };

    try {
      const transaction = database.value.transaction(storeName, "readwrite");
      const completion = transactionDone(transaction);
      await Promise.all([
        requestValue(transaction.objectStore(storeName).put(row)),
        completion
      ]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public readBlob(
    blobId: unknown
  ): Promise<AnimationRepositoryReadResult<Blob>> {
    return this.readBinary(blobId, "imageBlob");
  }

  public writeBlob(
    blobId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult> {
    return this.writeBinary(blobId, blob, "imageBlob");
  }

  public readPreview(
    previewId: unknown
  ): Promise<AnimationRepositoryReadResult<Blob>> {
    return this.readBinary(previewId, "preview");
  }

  public writePreview(
    previewId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult> {
    return this.writeBinary(previewId, blob, "preview");
  }

  public async listKits(): Promise<
    AnimationRepositoryQueryResult<readonly CharacterKit[]>
  > {
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.kits,
        "readonly"
      );
      const completion = transactionDone(transaction);
      const rows = await requestValue<unknown[]>(
        transaction.objectStore(ANIMATION_DATABASE_STORES.kits).getAll()
      );
      await completion;

      const kits: CharacterKit[] = [];
      for (const row of rows) {
        const kit = parseRepositoryValue(
          CharacterKitSchema,
          row,
          "Stored Character Kit metadata is invalid."
        );
        if (!kit.success) return kit.result;
        kits.push(kit.value);
      }
      return { status: "ok", value: sortCharacterKits(kits) };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async readKit(
    kitId: unknown
  ): Promise<AnimationRepositoryReadResult<CharacterKit>> {
    const id = parseRepositoryId(kitId, "Character Kit ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.kits,
        "readonly"
      );
      const completion = transactionDone(transaction);
      const row = await requestValue<unknown>(
        transaction.objectStore(ANIMATION_DATABASE_STORES.kits).get(id.value)
      );
      await completion;
      if (row === undefined) return repositoryNotFound("characterKit", id.value);
      const kit = parseRepositoryValue(
        CharacterKitSchema,
        row,
        "Stored Character Kit metadata is invalid."
      );
      return kit.success ? { status: "ok", value: kit.value } : kit.result;
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async writeKit(
    input: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const kit = parseRepositoryValue(
      CharacterKitSchema,
      input,
      "The Character Kit was not written because its metadata is invalid."
    );
    if (!kit.success) return kit.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.kits,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      await Promise.all([
        requestValue(
          transaction.objectStore(ANIMATION_DATABASE_STORES.kits).put(kit.value)
        ),
        completion
      ]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async deleteKit(
    kitId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(kitId, "Character Kit ID");
    if (!id.success) return id.result;
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        ANIMATION_DATABASE_STORES.kits,
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const store = transaction.objectStore(ANIMATION_DATABASE_STORES.kits);
      const existing = await requestValue<unknown>(store.get(id.value));
      if (existing === undefined) {
        await completion;
        return repositoryNotFound("characterKit", id.value);
      }
      await Promise.all([requestValue(store.delete(id.value)), completion]);
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async collectGarbage(): Promise<AnimationGarbageCollectionResult> {
    const database = await this.databaseOrUnavailable();
    if (database.status !== "ok") return database;

    try {
      const transaction = database.value.transaction(
        [
          ANIMATION_DATABASE_STORES.projects,
          ANIMATION_DATABASE_STORES.partAssets,
          ANIMATION_DATABASE_STORES.imageBlobs,
          ANIMATION_DATABASE_STORES.kits,
          ANIMATION_DATABASE_STORES.previews
        ],
        "readwrite"
      );
      const completion = transactionDone(transaction);
      const projectsStore = transaction.objectStore(
        ANIMATION_DATABASE_STORES.projects
      );
      const partsStore = transaction.objectStore(
        ANIMATION_DATABASE_STORES.partAssets
      );
      const imageBlobsStore = transaction.objectStore(
        ANIMATION_DATABASE_STORES.imageBlobs
      );
      const kitsStore = transaction.objectStore(ANIMATION_DATABASE_STORES.kits);
      const previewsStore = transaction.objectStore(
        ANIMATION_DATABASE_STORES.previews
      );
      const [projectRows, partRows, kitRows, imageBlobKeys, previewKeys] =
        await Promise.all([
          requestValue<unknown[]>(projectsStore.getAll()),
          requestValue<unknown[]>(partsStore.getAll()),
          requestValue<unknown[]>(kitsStore.getAll()),
          requestValue<IDBValidKey[]>(imageBlobsStore.getAllKeys()),
          requestValue<IDBValidKey[]>(previewsStore.getAllKeys())
        ]);

      const projects: AnimationProject[] = [];
      for (const row of projectRows) {
        const project = parseRepositoryValue(
          AnimationProjectSchema,
          row,
          "Stored project metadata is invalid; garbage collection was cancelled."
        );
        if (!project.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return project.result;
        }
        projects.push(project.value);
      }

      const partAssets: AnimationPartAsset[] = [];
      for (const row of partRows) {
        const partAsset = parseRepositoryValue(
          AnimationPartAssetSchema,
          row,
          "Stored part metadata is invalid; garbage collection was cancelled."
        );
        if (!partAsset.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return partAsset.result;
        }
        partAssets.push(partAsset.value);
      }

      const kits: CharacterKit[] = [];
      for (const row of kitRows) {
        const kit = parseRepositoryValue(
          CharacterKitSchema,
          row,
          "Stored Character Kit metadata is invalid; garbage collection was cancelled."
        );
        if (!kit.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return kit.result;
        }
        kits.push(kit.value);
      }

      const imageBlobIds: StableId[] = [];
      for (const key of imageBlobKeys) {
        const id = parseRepositoryId(key, "Stored image blob ID");
        if (!id.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return id.result;
        }
        imageBlobIds.push(id.value);
      }
      const previewIds: StableId[] = [];
      for (const key of previewKeys) {
        const id = parseRepositoryId(key, "Stored preview ID");
        if (!id.success) {
          abortQuietly(transaction);
          await completion.catch(() => undefined);
          return id.result;
        }
        previewIds.push(id.value);
      }

      const snapshot: AnimationBinaryReferenceSnapshot = {
        projects,
        partAssets,
        kits,
        imageBlobIds,
        previewIds
      };
      const analysis = analyzeAnimationBinaryReferences(snapshot);
      const deletes: Promise<unknown>[] = [];
      for (const blobId of analysis.unreferencedImageBlobIds) {
        deletes.push(requestValue(imageBlobsStore.delete(blobId)));
      }
      for (const previewId of analysis.unreferencedPreviewIds) {
        deletes.push(requestValue(previewsStore.delete(previewId)));
      }
      await Promise.all([...deletes, completion]);

      return {
        status: "ok",
        value: Object.freeze({
          removedImageBlobIds: analysis.unreferencedImageBlobIds,
          removedPreviewIds: analysis.unreferencedPreviewIds
        })
      };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }
}

export async function createBrowserAnimationRepository(
  indexedDbFactory: IDBFactory | null =
    typeof globalThis.indexedDB === "undefined" ? null : globalThis.indexedDB
): Promise<AnimationRepositoryFactoryResult> {
  if (!indexedDbFactory) {
    return {
      status: "unavailable",
      reason: "indexedDbUnavailable",
      message: "IndexedDB is unavailable in this browser."
    };
  }

  const repository = new IndexedDbAnimationRepository(indexedDbFactory);
  const initialized = await repository.initialize();
  return initialized.status === "ok"
    ? { status: "ok", repository }
    : initialized;
}
