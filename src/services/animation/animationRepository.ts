import { z } from "zod";
import {
  AnimationProjectBundleSchema,
  AnimationPartAssetSchema,
  AnimationNameSchema,
  AnimationProjectSchema,
  IsoDateTimeSchema,
  StableIdSchema,
  type AnimationPartAsset,
  type AnimationProjectBundle,
  type AnimationProject,
  type CharacterKit,
  type StableId
} from "../../schemas";

export type AnimationRepositoryEntity =
  | "project"
  | "partAsset"
  | "imageBlob"
  | "preview"
  | "characterKit";

export type AnimationBundleConflictResolution = "abort" | "replace";

export interface AnimationProjectBundleImageBlob {
  readonly blobId: StableId;
  readonly blob: Blob;
}

export interface PersistAnimationProjectBundleInput {
  readonly bundle: AnimationProjectBundle;
  readonly imageBlobs: readonly AnimationProjectBundleImageBlob[];
  readonly preview?: Readonly<{ previewId: StableId; blob: Blob }>;
  readonly conflictResolution: AnimationBundleConflictResolution;
}

export interface PersistedAnimationProjectBundle {
  readonly project: AnimationProject;
  readonly replaced: boolean;
}

export interface AnimationRepositoryValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type AnimationRepositoryInvalidResult = Readonly<{
  status: "invalid";
  reason: "schemaValidation";
  message: string;
  issues: readonly AnimationRepositoryValidationIssue[];
}>;

export type AnimationRepositoryNotFoundResult = Readonly<{
  status: "notFound";
  entity: AnimationRepositoryEntity;
  id: string;
  message: string;
}>;

export type AnimationRepositoryConflictResult = Readonly<{
  status: "conflict";
  entity: AnimationRepositoryEntity;
  id: string;
  message: string;
}>;

export type AnimationRepositoryUnavailableResult = Readonly<{
  status: "unavailable";
  reason: "indexedDbUnavailable" | "databaseOpen";
  message: string;
}>;

export type AnimationRepositoryFailedResult = Readonly<{
  status: "failed";
  reason: "transaction";
  message: string;
}>;

export type AnimationRepositoryReadResult<Value> =
  | Readonly<{ status: "ok"; value: Value }>
  | AnimationRepositoryInvalidResult
  | AnimationRepositoryNotFoundResult
  | AnimationRepositoryUnavailableResult
  | AnimationRepositoryFailedResult;

export type AnimationRepositoryQueryResult<Value> =
  | Readonly<{ status: "ok"; value: Value }>
  | AnimationRepositoryInvalidResult
  | AnimationRepositoryUnavailableResult
  | AnimationRepositoryFailedResult;

export type AnimationRepositoryMutationResult =
  | Readonly<{ status: "ok" }>
  | AnimationRepositoryInvalidResult
  | AnimationRepositoryNotFoundResult
  | AnimationRepositoryConflictResult
  | AnimationRepositoryUnavailableResult
  | AnimationRepositoryFailedResult;

export type AnimationRepositoryValueMutationResult<Value> =
  | Readonly<{ status: "ok"; value: Value }>
  | AnimationRepositoryInvalidResult
  | AnimationRepositoryNotFoundResult
  | AnimationRepositoryConflictResult
  | AnimationRepositoryUnavailableResult
  | AnimationRepositoryFailedResult;

export interface AnimationProjectSummary {
  readonly projectId: StableId;
  readonly name: string;
  readonly updatedAt: string;
  readonly rigTemplateId: AnimationProject["rigTemplateId"];
  readonly directionSourceMode: AnimationProject["directionSourceMode"];
  readonly partCount: number;
  readonly clipCount: number;
  readonly hasPreview: boolean;
}

export interface AnimationGarbageCollectionReport {
  readonly removedImageBlobIds: readonly StableId[];
  readonly removedPreviewIds: readonly StableId[];
}

export type AnimationGarbageCollectionResult =
  | Readonly<{ status: "ok"; value: AnimationGarbageCollectionReport }>
  | AnimationRepositoryInvalidResult
  | AnimationRepositoryUnavailableResult
  | AnimationRepositoryFailedResult;

export const DuplicateAnimationProjectInputSchema = z
  .strictObject({
    sourceProjectId: StableIdSchema,
    newProjectId: StableIdSchema,
    name: AnimationNameSchema,
    timestamp: IsoDateTimeSchema
  })
  .readonly();

export type DuplicateAnimationProjectInput = z.infer<
  typeof DuplicateAnimationProjectInputSchema
>;

export const PersistAnimationPartImportInputSchema = z
  .strictObject({
    project: AnimationProjectSchema,
    partAsset: AnimationPartAssetSchema,
    replacedAssetId: StableIdSchema.optional()
  })
  .superRefine((input, context) => {
    const importedReferences = input.project.parts.filter(
      ({ assetId }) => assetId === input.partAsset.assetId
    );
    if (importedReferences.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["project", "parts"],
        message: "The updated project must reference the imported part exactly once."
      });
    }
    if (
      input.replacedAssetId !== undefined &&
      input.project.parts.some(({ assetId }) => assetId === input.replacedAssetId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["project", "parts"],
        message: "The updated project must no longer reference the replaced part."
      });
    }
  })
  .readonly();

export type PersistAnimationPartImportInput = z.infer<
  typeof PersistAnimationPartImportInputSchema
>;

export interface PersistedAnimationPartImport {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
  readonly replacedAssetId?: StableId;
}

export const PersistAnimationPartSetupInputSchema = z
  .strictObject({
    project: AnimationProjectSchema,
    partAsset: AnimationPartAssetSchema
  })
  .superRefine((input, context) => {
    if (
      input.project.parts.filter(
        ({ assetId }) => assetId === input.partAsset.assetId
      ).length !== 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["project", "parts"],
        message: "The updated project must reference the configured part exactly once."
      });
    }
    if (input.partAsset.anchorStatus === "anchorsPending") {
      context.addIssue({
        code: "custom",
        path: ["partAsset", "anchorStatus"],
        message: "A configured part must contain saved source anchors."
      });
    }
  })
  .readonly();

export type PersistAnimationPartSetupInput = z.infer<
  typeof PersistAnimationPartSetupInputSchema
>;

export interface PersistedAnimationPartSetup {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
}

export interface AnimationRepository {
  listProjects(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProject[]>
  >;
  listProjectSummaries(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProjectSummary[]>
  >;
  readProject(
    projectId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationProject>>;
  createProject(input: unknown): Promise<AnimationRepositoryMutationResult>;
  writeProject(input: unknown): Promise<AnimationRepositoryMutationResult>;
  deleteProject(projectId: unknown): Promise<AnimationRepositoryMutationResult>;
  duplicateProject(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<AnimationProject>>;
  importProjectBundle(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationProjectBundle>>;

  readPartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationPartAsset>>;
  writePartAsset(
    input: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult>;
  writePartAssetToProject(
    input: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationPartImport>>;
  writePartSetupToProject(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationPartSetup>>;
  deletePartAsset(assetId: unknown): Promise<AnimationRepositoryMutationResult>;

  readBlob(blobId: unknown): Promise<AnimationRepositoryReadResult<Blob>>;
  writeBlob(
    blobId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult>;
  readPreview(previewId: unknown): Promise<AnimationRepositoryReadResult<Blob>>;
  writePreview(
    previewId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult>;

  listKits(): Promise<AnimationRepositoryQueryResult<readonly CharacterKit[]>>;
  readKit(
    kitId: unknown
  ): Promise<AnimationRepositoryReadResult<CharacterKit>>;
  writeKit(input: unknown): Promise<AnimationRepositoryMutationResult>;
  deleteKit(kitId: unknown): Promise<AnimationRepositoryMutationResult>;

  collectGarbage(): Promise<AnimationGarbageCollectionResult>;
}

function isBlob(value: unknown): value is Blob {
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Blob>;
  return (
    typeof candidate.size === "number" &&
    typeof candidate.type === "string" &&
    typeof candidate.arrayBuffer === "function"
  );
}

export function parseAnimationProjectBundleImport(input: unknown):
  | Readonly<{ success: true; value: PersistAnimationProjectBundleInput }>
  | Readonly<{ success: false; result: AnimationRepositoryInvalidResult }> {
  if (typeof input !== "object" || input === null) {
    return {
      success: false,
      result: {
        status: "invalid",
        reason: "schemaValidation",
        message: "Das Projektbundle ist unvollständig.",
        issues: [{ path: "", message: "Bundle import must be an object." }]
      }
    };
  }
  const candidate = input as Record<string, unknown>;
  const parsedBundle = AnimationProjectBundleSchema.safeParse(candidate.bundle);
  if (!parsedBundle.success) {
    return {
      success: false,
      result: {
        status: "invalid",
        reason: "schemaValidation",
        message: "Die Bundle-Metadaten sind ungültig.",
        issues: parsedBundle.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message
        }))
      }
    };
  }
  if (
    candidate.conflictResolution !== "abort" &&
    candidate.conflictResolution !== "replace"
  ) {
    return {
      success: false,
      result: {
        status: "invalid",
        reason: "schemaValidation",
        message: "Die Konfliktentscheidung ist ungültig.",
        issues: [{ path: "conflictResolution", message: "Use abort or replace." }]
      }
    };
  }
  if (!Array.isArray(candidate.imageBlobs)) {
    return {
      success: false,
      result: {
        status: "invalid",
        reason: "schemaValidation",
        message: "Die Originalbilder des Bundles fehlen.",
        issues: [{ path: "imageBlobs", message: "Image blobs must be an array." }]
      }
    };
  }

  const expectedImageIds = new Set(
    parsedBundle.data.partAssets.map(({ blobId }) => blobId)
  );
  const seenImageIds = new Set<StableId>();
  const imageBlobs: AnimationProjectBundleImageBlob[] = [];
  for (let index = 0; index < candidate.imageBlobs.length; index += 1) {
    const entry = candidate.imageBlobs[index];
    if (typeof entry !== "object" || entry === null) {
      return invalidBundleBinary(index, "Binary entry must be an object.");
    }
    const record = entry as Record<string, unknown>;
    const id = StableIdSchema.safeParse(record.blobId);
    if (!id.success || !isBlob(record.blob)) {
      return invalidBundleBinary(index, "Binary entry requires a valid ID and Blob.");
    }
    if (!expectedImageIds.has(id.data) || seenImageIds.has(id.data)) {
      return invalidBundleBinary(
        index,
        "Binary entry is duplicate or not referenced by the project parts."
      );
    }
    seenImageIds.add(id.data);
    imageBlobs.push({ blobId: id.data, blob: record.blob });
  }
  if (
    seenImageIds.size !== expectedImageIds.size ||
    [...expectedImageIds].some((id) => !seenImageIds.has(id))
  ) {
    return invalidBundleBinary(-1, "A referenced original image Blob is missing.");
  }

  const expectedPreviewId = parsedBundle.data.project.previewBlobId;
  let preview: PersistAnimationProjectBundleInput["preview"];
  if (candidate.preview !== undefined) {
    const entry = candidate.preview;
    if (typeof entry !== "object" || entry === null) {
      return invalidBundlePreview("Preview entry must be an object.");
    }
    const record = entry as Record<string, unknown>;
    const id = StableIdSchema.safeParse(record.previewId);
    if (
      !id.success ||
      !isBlob(record.blob) ||
      id.data !== expectedPreviewId
    ) {
      return invalidBundlePreview("Preview ID/Blob does not match the project graph.");
    }
    preview = { previewId: id.data, blob: record.blob };
  }
  if (Boolean(expectedPreviewId) !== Boolean(preview)) {
    return invalidBundlePreview("The referenced project preview is missing.");
  }

  const expectedAllBlobIds = new Set([
    ...expectedImageIds,
    ...(expectedPreviewId ? [expectedPreviewId] : [])
  ]);
  if (
    parsedBundle.data.blobIds.length !== expectedAllBlobIds.size ||
    parsedBundle.data.blobIds.some((id) => !expectedAllBlobIds.has(id))
  ) {
    return invalidBundleBinary(-1, "Bundle blobIds must exactly match referenced binaries.");
  }
  return {
    success: true,
    value: Object.freeze({
      bundle: parsedBundle.data,
      imageBlobs: Object.freeze(imageBlobs),
      ...(preview ? { preview: Object.freeze(preview) } : {}),
      conflictResolution: candidate.conflictResolution
    })
  };
}

function invalidBundleBinary(
  index: number,
  message: string
): Readonly<{ success: false; result: AnimationRepositoryInvalidResult }> {
  return {
    success: false,
    result: {
      status: "invalid",
      reason: "schemaValidation",
      message: "Die Bundle-Bilddaten sind ungültig.",
      issues: [{ path: index < 0 ? "imageBlobs" : `imageBlobs.${index}`, message }]
    }
  };
}

function invalidBundlePreview(
  message: string
): Readonly<{ success: false; result: AnimationRepositoryInvalidResult }> {
  return {
    success: false,
    result: {
      status: "invalid",
      reason: "schemaValidation",
      message: "Die Bundle-Vorschau ist ungültig.",
      issues: [{ path: "preview", message }]
    }
  };
}

export type AnimationRepositoryFactoryResult =
  | Readonly<{ status: "ok"; repository: AnimationRepository }>
  | AnimationRepositoryUnavailableResult;

export function createAnimationProjectSummary(
  project: AnimationProject
): AnimationProjectSummary {
  return Object.freeze({
    projectId: project.projectId,
    name: project.name,
    updatedAt: project.updatedAt,
    rigTemplateId: project.rigTemplateId,
    directionSourceMode: project.directionSourceMode,
    partCount: project.parts.length,
    clipCount: project.clips.length,
    hasPreview: project.previewBlobId !== undefined
  });
}

export function sortAnimationProjects(
  projects: readonly AnimationProject[]
): readonly AnimationProject[] {
  return Object.freeze(
    [...projects].sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.projectId.localeCompare(right.projectId)
    )
  );
}

export function sortAnimationProjectSummaries(
  summaries: readonly AnimationProjectSummary[]
): readonly AnimationProjectSummary[] {
  return Object.freeze(
    [...summaries].sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.projectId.localeCompare(right.projectId)
    )
  );
}

export function sortCharacterKits(
  kits: readonly CharacterKit[]
): readonly CharacterKit[] {
  return Object.freeze(
    [...kits].sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.kitId.localeCompare(right.kitId)
    )
  );
}
