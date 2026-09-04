import { z } from "zod";
import {
  AnimationNameSchema,
  IsoDateTimeSchema,
  StableIdSchema,
  type AnimationPartAsset,
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

  readPartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationPartAsset>>;
  writePartAsset(
    input: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult>;
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
