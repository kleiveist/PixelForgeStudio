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
  PersistAnimationPartImportInputSchema,
  sortAnimationProjects,
  sortAnimationProjectSummaries,
  sortCharacterKits,
  type AnimationGarbageCollectionResult,
  type AnimationRepository,
  type AnimationRepositoryFailedResult,
  type AnimationRepositoryMutationResult,
  type AnimationRepositoryQueryResult,
  type AnimationRepositoryReadResult,
  type AnimationRepositoryValueMutationResult,
  type AnimationProjectSummary,
  type PersistedAnimationPartImport
} from "./animationRepository";
import {
  createDuplicatedProject,
  parseDuplicateProjectInput,
  parseRepositoryId,
  parseRepositoryValue,
  repositoryConflict,
  repositoryNotFound,
  repositoryTransactionFailed
} from "./repositorySupport";

export type MemoryAnimationRepositoryOperation =
  | "createProject"
  | "writeProject"
  | "deleteProject"
  | "duplicateProject"
  | "writePartAsset"
  | "writePartAssetToProject"
  | "deletePartAsset"
  | "writeBlob"
  | "writePreview"
  | "writeKit"
  | "deleteKit"
  | "collectGarbage";

export interface MemoryAnimationRepositoryOptions {
  readonly beforeCommit?: (
    operation: MemoryAnimationRepositoryOperation
  ) => void | Promise<void>;
}

export class MemoryAnimationRepository implements AnimationRepository {
  private projects = new Map<StableId, AnimationProject>();
  private partAssets = new Map<StableId, AnimationPartAsset>();
  private imageBlobs = new Map<StableId, Blob>();
  private previews = new Map<StableId, Blob>();
  private kits = new Map<StableId, CharacterKit>();

  public constructor(
    private readonly options: MemoryAnimationRepositoryOptions = {}
  ) {}

  private async commit(
    operation: MemoryAnimationRepositoryOperation,
    apply: () => void
  ): Promise<
    Readonly<{ status: "ok" }> | AnimationRepositoryFailedResult
  > {
    try {
      const pendingCommit = this.options.beforeCommit?.(operation);
      if (pendingCommit) await pendingCommit;
      apply();
      return { status: "ok" };
    } catch (error) {
      return repositoryTransactionFailed(error);
    }
  }

  public async listProjects(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProject[]>
  > {
    return { status: "ok", value: sortAnimationProjects([...this.projects.values()]) };
  }

  public async listProjectSummaries(): Promise<
    AnimationRepositoryQueryResult<readonly AnimationProjectSummary[]>
  > {
    const summaries = [...this.projects.values()].map(createAnimationProjectSummary);
    return { status: "ok", value: sortAnimationProjectSummaries(summaries) };
  }

  public async readProject(
    projectId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationProject>> {
    const id = parseRepositoryId(projectId, "Project ID");
    if (!id.success) return id.result;
    const project = this.projects.get(id.value);
    return project
      ? { status: "ok", value: project }
      : repositoryNotFound("project", id.value);
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
    if (this.projects.has(project.value.projectId)) {
      return repositoryConflict("project", project.value.projectId);
    }

    const nextProjects = new Map(this.projects);
    nextProjects.set(project.value.projectId, project.value);
    return this.commit("createProject", () => {
      this.projects = nextProjects;
    });
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
    if (!this.projects.has(project.value.projectId)) {
      return repositoryNotFound("project", project.value.projectId);
    }

    const nextProjects = new Map(this.projects);
    nextProjects.set(project.value.projectId, project.value);
    return this.commit("writeProject", () => {
      this.projects = nextProjects;
    });
  }

  public async deleteProject(
    projectId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(projectId, "Project ID");
    if (!id.success) return id.result;
    if (!this.projects.has(id.value)) return repositoryNotFound("project", id.value);

    const nextProjects = new Map(this.projects);
    nextProjects.delete(id.value);
    return this.commit("deleteProject", () => {
      this.projects = nextProjects;
    });
  }

  public async duplicateProject(
    input: unknown
  ): Promise<AnimationRepositoryValueMutationResult<AnimationProject>> {
    const command = parseDuplicateProjectInput(input);
    if (!command.success) return command.result;
    const source = this.projects.get(command.value.sourceProjectId);
    if (!source) return repositoryNotFound("project", command.value.sourceProjectId);
    if (this.projects.has(command.value.newProjectId)) {
      return repositoryConflict("project", command.value.newProjectId);
    }

    const duplicate = createDuplicatedProject(source, command.value);
    if (!duplicate.success) return duplicate.result;
    const nextProjects = new Map(this.projects);
    nextProjects.set(duplicate.value.projectId, duplicate.value);
    const committed = await this.commit("duplicateProject", () => {
      this.projects = nextProjects;
    });
    return committed.status === "ok"
      ? { status: "ok", value: duplicate.value }
      : committed;
  }

  public async readPartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryReadResult<AnimationPartAsset>> {
    const id = parseRepositoryId(assetId, "Part asset ID");
    if (!id.success) return id.result;
    const partAsset = this.partAssets.get(id.value);
    return partAsset
      ? { status: "ok", value: partAsset }
      : repositoryNotFound("partAsset", id.value);
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

    const nextPartAssets = new Map(this.partAssets);
    const nextImageBlobs = new Map(this.imageBlobs);
    nextPartAssets.set(partAsset.value.assetId, partAsset.value);
    nextImageBlobs.set(partAsset.value.blobId, blob);
    return this.commit("writePartAsset", () => {
      this.partAssets = nextPartAssets;
      this.imageBlobs = nextImageBlobs;
    });
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
    const currentProject = this.projects.get(command.value.project.projectId);
    if (!currentProject) {
      return repositoryNotFound("project", command.value.project.projectId);
    }
    if (this.partAssets.has(command.value.partAsset.assetId)) {
      return repositoryConflict("partAsset", command.value.partAsset.assetId);
    }
    if (this.imageBlobs.has(command.value.partAsset.blobId)) {
      return repositoryConflict("imageBlob", command.value.partAsset.blobId);
    }
    const expectedPartIds = [
      ...currentProject.parts
        .map(({ assetId }) => assetId)
        .filter((assetId) => assetId !== command.value.replacedAssetId),
      command.value.partAsset.assetId
    ];
    if (
      command.value.replacedAssetId !== undefined &&
      !currentProject.parts.some(
        ({ assetId }) => assetId === command.value.replacedAssetId
      )
    ) {
      return repositoryConflict("project", currentProject.projectId);
    }
    if (command.value.replacedAssetId !== undefined) {
      const replacedPart = this.partAssets.get(command.value.replacedAssetId);
      if (!replacedPart) {
        return repositoryNotFound("partAsset", command.value.replacedAssetId);
      }
      if (
        replacedPart.slot !== command.value.partAsset.slot ||
        replacedPart.direction !== command.value.partAsset.direction
      ) {
        return repositoryConflict("project", currentProject.projectId);
      }
    }
    if (
      command.value.project.parts.length !== expectedPartIds.length ||
      command.value.project.parts.some(
        ({ assetId }, index) => assetId !== expectedPartIds[index]
      )
    ) {
      return repositoryConflict("project", currentProject.projectId);
    }

    const nextProjects = new Map(this.projects);
    const nextPartAssets = new Map(this.partAssets);
    const nextImageBlobs = new Map(this.imageBlobs);
    nextProjects.set(command.value.project.projectId, command.value.project);
    nextPartAssets.set(command.value.partAsset.assetId, command.value.partAsset);
    nextImageBlobs.set(command.value.partAsset.blobId, blob);
    const committed = await this.commit("writePartAssetToProject", () => {
      this.projects = nextProjects;
      this.partAssets = nextPartAssets;
      this.imageBlobs = nextImageBlobs;
    });
    return committed.status === "ok"
      ? {
          status: "ok",
          value: Object.freeze({
            project: command.value.project,
            partAsset: command.value.partAsset,
            ...(command.value.replacedAssetId
              ? { replacedAssetId: command.value.replacedAssetId }
              : {})
          })
        }
      : committed;
  }

  public async deletePartAsset(
    assetId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(assetId, "Part asset ID");
    if (!id.success) return id.result;
    if (!this.partAssets.has(id.value)) {
      return repositoryNotFound("partAsset", id.value);
    }

    const nextPartAssets = new Map(this.partAssets);
    nextPartAssets.delete(id.value);
    return this.commit("deletePartAsset", () => {
      this.partAssets = nextPartAssets;
    });
  }

  public async readBlob(
    blobId: unknown
  ): Promise<AnimationRepositoryReadResult<Blob>> {
    const id = parseRepositoryId(blobId, "Image blob ID");
    if (!id.success) return id.result;
    const blob = this.imageBlobs.get(id.value);
    return blob
      ? { status: "ok", value: blob }
      : repositoryNotFound("imageBlob", id.value);
  }

  public async writeBlob(
    blobId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(blobId, "Image blob ID");
    if (!id.success) return id.result;
    const nextImageBlobs = new Map(this.imageBlobs);
    nextImageBlobs.set(id.value, blob);
    return this.commit("writeBlob", () => {
      this.imageBlobs = nextImageBlobs;
    });
  }

  public async readPreview(
    previewId: unknown
  ): Promise<AnimationRepositoryReadResult<Blob>> {
    const id = parseRepositoryId(previewId, "Preview ID");
    if (!id.success) return id.result;
    const preview = this.previews.get(id.value);
    return preview
      ? { status: "ok", value: preview }
      : repositoryNotFound("preview", id.value);
  }

  public async writePreview(
    previewId: unknown,
    blob: Blob
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(previewId, "Preview ID");
    if (!id.success) return id.result;
    const nextPreviews = new Map(this.previews);
    nextPreviews.set(id.value, blob);
    return this.commit("writePreview", () => {
      this.previews = nextPreviews;
    });
  }

  public async listKits(): Promise<
    AnimationRepositoryQueryResult<readonly CharacterKit[]>
  > {
    return { status: "ok", value: sortCharacterKits([...this.kits.values()]) };
  }

  public async readKit(
    kitId: unknown
  ): Promise<AnimationRepositoryReadResult<CharacterKit>> {
    const id = parseRepositoryId(kitId, "Character Kit ID");
    if (!id.success) return id.result;
    const kit = this.kits.get(id.value);
    return kit
      ? { status: "ok", value: kit }
      : repositoryNotFound("characterKit", id.value);
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
    const nextKits = new Map(this.kits);
    nextKits.set(kit.value.kitId, kit.value);
    return this.commit("writeKit", () => {
      this.kits = nextKits;
    });
  }

  public async deleteKit(
    kitId: unknown
  ): Promise<AnimationRepositoryMutationResult> {
    const id = parseRepositoryId(kitId, "Character Kit ID");
    if (!id.success) return id.result;
    if (!this.kits.has(id.value)) {
      return repositoryNotFound("characterKit", id.value);
    }

    const nextKits = new Map(this.kits);
    nextKits.delete(id.value);
    return this.commit("deleteKit", () => {
      this.kits = nextKits;
    });
  }

  public async collectGarbage(): Promise<AnimationGarbageCollectionResult> {
    const snapshot: AnimationBinaryReferenceSnapshot = {
      projects: [...this.projects.values()],
      partAssets: [...this.partAssets.values()],
      kits: [...this.kits.values()],
      imageBlobIds: [...this.imageBlobs.keys()],
      previewIds: [...this.previews.keys()]
    };
    const analysis = analyzeAnimationBinaryReferences(snapshot);
    const nextImageBlobs = new Map(this.imageBlobs);
    const nextPreviews = new Map(this.previews);
    for (const blobId of analysis.unreferencedImageBlobIds) {
      nextImageBlobs.delete(blobId);
    }
    for (const previewId of analysis.unreferencedPreviewIds) {
      nextPreviews.delete(previewId);
    }

    const committed = await this.commit("collectGarbage", () => {
      this.imageBlobs = nextImageBlobs;
      this.previews = nextPreviews;
    });
    return committed.status === "ok"
      ? {
          status: "ok",
          value: Object.freeze({
            removedImageBlobIds: analysis.unreferencedImageBlobIds,
            removedPreviewIds: analysis.unreferencedPreviewIds
          })
        }
      : committed;
  }
}

export function createMemoryAnimationRepository(
  options: MemoryAnimationRepositoryOptions = {}
): AnimationRepository {
  return new MemoryAnimationRepository(options);
}
