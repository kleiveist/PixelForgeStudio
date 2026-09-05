import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";
import { jsonValuesEqual } from "../../domain/json";
import {
  applyCharacterKitToProject,
  createRigCompatibilityKey,
  equipCharacterPart,
  findSlotBinding,
  HUMANOID_80_RIG_TEMPLATE_ID,
  getBuiltInRigTemplate,
  isRequiredPartSlot,
  removeCharacterPart,
  removeFrameOverride as removeFrameOverrideFromList,
  resetDirectionOverrides,
  summarizeCharacterKitCoverage,
  upsertFrameOverride,
  validateSourceAnchors,
  type Direction,
  type CharacterKitApplicationAssessment,
  type FrameOverrideAddress,
  type DirectionSourceMode,
  type FrameProfile,
  type MirrorPolicy,
  type LayerGroup,
  type JointId,
  type PartSlot,
  type Rect,
  type Size,
  type SourceAnchors,
  type TransformDelta
} from "../../domain/animation";
import {
  AnimationPartAssetSchema,
  AnimationProjectSchema,
  CharacterKitSchema,
  DirectionFrameOverrideSchema,
  StableIdSchema,
  type AnimationPartAsset,
  type AnimationProject,
  type CharacterKit,
  type DirectionFrameOverride,
  type StableId
} from "../../schemas";
import {
  createBrowserImageDecoder,
  createAnimationProjectSummary,
  importPfanimArchive,
  sortCharacterKits,
  type AnimationBundleConflictResolution,
  type AnimationRepository,
  type AnimationRepositoryValidationIssue,
  type ImageDecoder
} from "../../services";
import {
  INITIAL_ANIMATION_PROJECT_STATE,
  animationProjectReducer,
  selectAnimationProjectCanSave,
  selectAnimationProjectDirty,
  type AnimationProjectAction,
  type AnimationProjectState
} from "./animationProjectState";

export const ANIMATION_AUTOSAVE_DELAY_MS = 300;

export interface CreateAnimationProjectDefinition {
  readonly name: string;
  readonly frameProfile: FrameProfile;
  readonly directionSourceMode: DirectionSourceMode;
  readonly walk: Readonly<{
    enabled: boolean;
    frameCount: number;
    fps: number;
  }>;
}

export type AnimationProjectCommandFailureStatus =
  | "invalid"
  | "notFound"
  | "conflict"
  | "unavailable"
  | "failed";

export type AnimationProjectCommandFailure = Readonly<{
  status: AnimationProjectCommandFailureStatus;
  message: string;
  issues?: readonly AnimationRepositoryValidationIssue[];
}>;

export type AnimationProjectCommandResult<Value> =
  | Readonly<{ status: "ok"; value: Value }>
  | AnimationProjectCommandFailure;

export interface DeletedAnimationProject {
  readonly projectId: StableId;
  readonly wasActive: boolean;
}

export interface AnimationPartAssetResolution {
  readonly assets: readonly AnimationPartAsset[];
  readonly missingAssetIds: readonly StableId[];
}

export interface ImportAnimationPartDefinition {
  readonly originalBlob: Blob;
  readonly label: string;
  readonly slot: PartSlot;
  readonly direction: Direction;
  readonly sourceSize: Size;
  readonly trimRect: Rect;
  readonly attachmentJointId?: JointId;
  readonly replacedAssetId?: StableId;
}

export interface ImportedAnimationPart {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
  readonly replacedAssetId?: StableId;
}

export interface ConfigureAnimationPartDefinition {
  readonly assetId: StableId;
  readonly anchors: SourceAnchors;
  readonly transformDelta: TransformDelta;
}

export interface ConfirmDirectionMirrorReviewDefinition {
  readonly assetId: StableId;
  readonly sourceUpdatedAt: string;
  readonly targetDirection: Direction;
}

export interface ConfiguredAnimationPart {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
}

export type CharacterKitListStatus =
  | "loading"
  | "ready"
  | "unavailable"
  | "failed";

export interface SaveCharacterKitDefinition {
  readonly name: string;
  readonly description: string;
}

export interface AppliedCharacterKit {
  readonly project: AnimationProject;
  readonly kit: CharacterKit;
  readonly removedOverrideSlots: number;
}

export type ApplyCharacterKitCommandResult =
  | Readonly<{ status: "ok"; value: AppliedCharacterKit }>
  | Readonly<{
      status: "conflict";
      reason: "incompatible" | "missingAssets" | "overrideConflict";
      message: string;
      assessment: CharacterKitApplicationAssessment;
    }>
  | AnimationProjectCommandFailure;

export interface EquippedCharacterPart {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
  readonly replacedAssetIds: readonly StableId[];
  readonly defaultLayerGroup: LayerGroup;
}

export interface AnimationProjectContextValue extends AnimationProjectState {
  readonly imageDecoder: ImageDecoder;
  readonly projectDirty: boolean;
  readonly canSaveProject: boolean;
  readonly canUndoProject: boolean;
  readonly canRedoProject: boolean;
  readonly characterKits: readonly CharacterKit[];
  readonly characterKitListStatus: CharacterKitListStatus;
  readonly characterKitListError: string | null;
  readonly refreshProjects: () => Promise<void>;
  readonly refreshCharacterKits: () => Promise<void>;
  readonly createProject: (
    definition: CreateAnimationProjectDefinition
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly openProject: (
    projectId: StableId
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly importProjectBundleArchive: (
    archive: Blob,
    conflictResolution?: AnimationBundleConflictResolution
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly updateActiveProject: (
    input: unknown
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly setActiveFrameOverride: (
    input: unknown
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly removeActiveFrameOverride: (
    address: FrameOverrideAddress
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly resetActiveDirectionOverrides: (
    clipId: StableId,
    direction: Direction
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly undoActiveProject: () => boolean;
  readonly redoActiveProject: () => boolean;
  readonly updatePartLayerOffset: (
    assetId: StableId,
    layerOffset: number
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly updateProjectMirrorPolicy: (
    mirrorPolicy: MirrorPolicy
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly updatePartMirrorPolicy: (
    assetId: StableId,
    mirrorPolicy: MirrorPolicy
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly confirmDirectionMirrorReview: (
    definition: ConfirmDirectionMirrorReviewDefinition
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly saveActiveProject: () => Promise<
    AnimationProjectCommandResult<AnimationProject>
  >;
  readonly loadPartAssets: (
    assetIds: readonly StableId[]
  ) => Promise<AnimationProjectCommandResult<AnimationPartAssetResolution>>;
  readonly loadReusablePartAssets: () => Promise<
    AnimationProjectCommandResult<AnimationPartAssetResolution>
  >;
  readonly importPartAsset: (
    definition: ImportAnimationPartDefinition
  ) => Promise<AnimationProjectCommandResult<ImportedAnimationPart>>;
  readonly loadPartImageBlob: (
    blobId: StableId
  ) => Promise<AnimationProjectCommandResult<Blob>>;
  readonly loadCharacterKitPreview: (
    previewId: StableId
  ) => Promise<AnimationProjectCommandResult<Blob>>;
  readonly configurePartAsset: (
    definition: ConfigureAnimationPartDefinition
  ) => Promise<AnimationProjectCommandResult<ConfiguredAnimationPart>>;
  readonly renameProject: (
    projectId: StableId,
    name: string
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly duplicateProject: (
    projectId: StableId
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly deleteProject: (
    projectId: StableId
  ) => Promise<AnimationProjectCommandResult<DeletedAnimationProject>>;
  readonly saveActiveProjectAsKit: (
    definition: SaveCharacterKitDefinition
  ) => Promise<AnimationProjectCommandResult<CharacterKit>>;
  readonly loadCharacterKit: (
    kitId: StableId
  ) => Promise<AnimationProjectCommandResult<CharacterKit>>;
  readonly duplicateCharacterKit: (
    kitId: StableId
  ) => Promise<AnimationProjectCommandResult<CharacterKit>>;
  readonly renameCharacterKit: (
    kitId: StableId,
    name: string
  ) => Promise<AnimationProjectCommandResult<CharacterKit>>;
  readonly deleteCharacterKit: (
    kitId: StableId
  ) => Promise<AnimationProjectCommandResult<StableId>>;
  readonly applyCharacterKit: (
    kitId: StableId,
    overrideResolution?: "abort" | "removeInvalidPartDeltas"
  ) => Promise<ApplyCharacterKitCommandResult>;
  readonly equipPartAsset: (
    assetId: StableId
  ) => Promise<AnimationProjectCommandResult<EquippedCharacterPart>>;
  readonly removeEquippedPartAsset: (
    assetId: StableId
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly clearRawProjectError: () => void;
}

export interface AnimationProjectProviderProps {
  readonly children: ReactNode;
  readonly repository: AnimationRepository | null;
  readonly unavailableMessage?: string;
  readonly now?: () => string;
  readonly createProjectId?: () => string;
  readonly createClipId?: () => string;
  readonly createPartAssetId?: () => string;
  readonly createImageBlobId?: () => string;
  readonly createKitId?: () => string;
  readonly imageDecoder?: ImageDecoder;
  readonly autosaveDelayMs?: number;
}

const AnimationProjectContext =
  createContext<AnimationProjectContextValue | null>(null);

let fallbackIdSequence = 0;

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function randomAnimationId(
  prefix: "project" | "clip" | "part" | "blob" | "kit"
): string {
  try {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `${prefix}_${globalThis.crypto.randomUUID()}`;
    }
  } catch {
    // The schema validation below checks the deterministic local fallback.
  }

  fallbackIdSequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${fallbackIdSequence.toString(36)}`;
}

function createDefaultProjectId(): string {
  return randomAnimationId("project");
}

function createDefaultClipId(): string {
  return randomAnimationId("clip");
}

function createDefaultPartAssetId(): string {
  return randomAnimationId("part");
}

function createDefaultImageBlobId(): string {
  return randomAnimationId("blob");
}

function createDefaultKitId(): string {
  return randomAnimationId("kit");
}

function validationIssues(
  issues: readonly Readonly<{
    path: PropertyKey[];
    message: string;
  }>[]
): readonly AnimationRepositoryValidationIssue[] {
  return Object.freeze(
    issues.map((issue) =>
      Object.freeze({
        path: issue.path.map(String).join("."),
        message: issue.message
      })
    )
  );
}

function invalidCommand(
  message: string,
  issues: readonly AnimationRepositoryValidationIssue[] = []
): AnimationProjectCommandFailure {
  return { status: "invalid", message, issues };
}

function unavailableCommand(
  message: string
): AnimationProjectCommandFailure {
  return { status: "unavailable", message };
}

function failedCommand(error: unknown): AnimationProjectCommandFailure {
  return {
    status: "failed",
    message:
      error instanceof Error
        ? error.message
        : "Die Animationsprojekt-Aktion ist unerwartet fehlgeschlagen."
  };
}

function repositoryFailure(
  result: Readonly<{
    status: AnimationProjectCommandFailureStatus;
    message: string;
    issues?: readonly AnimationRepositoryValidationIssue[];
  }>
): AnimationProjectCommandFailure {
  return result.status === "invalid"
    ? {
        status: "invalid",
        message: result.message,
        issues: result.issues ?? []
      }
    : { status: result.status, message: result.message };
}

function listFailureStatus(
  status: AnimationProjectCommandFailureStatus
): "invalid" | "unavailable" | "failed" {
  if (status === "invalid" || status === "unavailable") return status;
  return "failed";
}

function loadFailureStatus(
  status: AnimationProjectCommandFailureStatus
): "notFound" | "invalid" | "unavailable" | "failed" {
  if (
    status === "notFound" ||
    status === "invalid" ||
    status === "unavailable"
  ) {
    return status;
  }
  return "failed";
}

function duplicateName(name: string): string {
  const suffix = " Kopie";
  return `${name.slice(0, Math.max(1, 120 - suffix.length)).trimEnd()}${suffix}`;
}

export function AnimationProjectProvider({
  children,
  repository,
  unavailableMessage = "Der lokale Animationsspeicher ist nicht verfügbar.",
  now = currentIsoTimestamp,
  createProjectId = createDefaultProjectId,
  createClipId = createDefaultClipId,
  createPartAssetId = createDefaultPartAssetId,
  createImageBlobId = createDefaultImageBlobId,
  createKitId = createDefaultKitId,
  imageDecoder = createBrowserImageDecoder(),
  autosaveDelayMs = ANIMATION_AUTOSAVE_DELAY_MS
}: AnimationProjectProviderProps) {
  const [state, dispatch] = useReducer(
    animationProjectReducer,
    INITIAL_ANIMATION_PROJECT_STATE
  );
  const [characterKitState, setCharacterKitState] = useState<Readonly<{
    kits: readonly CharacterKit[];
    status: CharacterKitListStatus;
    error: string | null;
  }>>({ kits: [], status: "loading", error: null });
  const stateRef = useRef(state);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const listRequestRevisionRef = useRef(0);
  const projectRequestRevisionRef = useRef(0);

  stateRef.current = state;

  const dispatchState = useCallback((action: AnimationProjectAction) => {
    stateRef.current = animationProjectReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current === null) return;
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const refreshProjects = useCallback(async () => {
    const requestRevision = ++listRequestRevisionRef.current;
    dispatchState({ type: "projectListLoadStarted" });
    if (!repository) {
      dispatchState({
        type: "projectListLoadFailed",
        status: "unavailable",
        message: unavailableMessage
      });
      return;
    }

    try {
      const result = await repository.listProjectSummaries();
      if (requestRevision !== listRequestRevisionRef.current) return;
      if (result.status === "ok") {
        dispatchState({
          type: "projectListLoaded",
          summaries: result.value
        });
        return;
      }
      dispatchState({
        type: "projectListLoadFailed",
        status: listFailureStatus(result.status),
        message: result.message
      });
    } catch (error) {
      if (requestRevision !== listRequestRevisionRef.current) return;
      dispatchState({
        type: "projectListLoadFailed",
        status: "failed",
        message: failedCommand(error).message
      });
    }
  }, [dispatchState, repository, unavailableMessage]);

  const refreshCharacterKits = useCallback(async () => {
    setCharacterKitState((current) => ({
      kits: current.kits,
      status: "loading",
      error: null
    }));
    if (!repository) {
      setCharacterKitState({
        kits: [],
        status: "unavailable",
        error: unavailableMessage
      });
      return;
    }
    try {
      const result = await repository.listKits();
      if (result.status === "ok") {
        setCharacterKitState({ kits: result.value, status: "ready", error: null });
      } else {
        setCharacterKitState({
          kits: [],
          status: result.status === "unavailable" ? "unavailable" : "failed",
          error: result.message
        });
      }
    } catch (error) {
      setCharacterKitState({
        kits: [],
        status: "failed",
        error: failedCommand(error).message
      });
    }
  }, [repository, unavailableMessage]);

  useEffect(() => {
    void refreshProjects();
    void refreshCharacterKits();
    return () => {
      listRequestRevisionRef.current += 1;
    };
  }, [refreshCharacterKits, refreshProjects]);

  const persistSnapshot = useCallback(
    (
      project: AnimationProject,
      revision: number
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      if (!repository) return Promise.resolve(unavailableCommand(unavailableMessage));

      let resolveOperation:
        | ((result: AnimationProjectCommandResult<AnimationProject>) => void)
        | undefined;
      const resultPromise = new Promise<
        AnimationProjectCommandResult<AnimationProject>
      >((resolve) => {
        resolveOperation = resolve;
      });

      const execute = async () => {
        dispatchState({
          type: "saveStarted",
          projectId: project.projectId,
          revision
        });
        try {
          const result = await repository.writeProject(project);
          if (result.status === "ok") {
            listRequestRevisionRef.current += 1;
            dispatchState({
              type: "saveSucceeded",
              projectId: project.projectId,
              revision,
              project,
              summary: createAnimationProjectSummary(project)
            });
            resolveOperation?.({ status: "ok", value: project });
          } else {
            dispatchState({
              type: "saveFailed",
              projectId: project.projectId,
              revision,
              message: result.message
            });
            resolveOperation?.(repositoryFailure(result));
          }
        } catch (error) {
          const failure = failedCommand(error);
          dispatchState({
            type: "saveFailed",
            projectId: project.projectId,
            revision,
            message: failure.message
          });
          resolveOperation?.(failure);
        }
      };

      const queued = saveQueueRef.current.then(execute, execute);
      saveQueueRef.current = queued.then(
        () => undefined,
        () => undefined
      );
      return resultPromise;
    },
    [dispatchState, repository, unavailableMessage]
  );

  const saveActiveProject = useCallback(async (): Promise<
    AnimationProjectCommandResult<AnimationProject>
  > => {
    clearAutosaveTimer();
    const current = stateRef.current;
    if (!current.activeProject) {
      return {
        status: "notFound",
        message: "Es ist kein Animationsprojekt zum Speichern geöffnet."
      };
    }
    if (current.rawProjectError) {
      return invalidCommand(
        current.rawProjectError.message,
        current.rawProjectError.issues
      );
    }
    if (!selectAnimationProjectDirty(current)) {
      await saveQueueRef.current;
      return { status: "ok", value: current.activeProject };
    }
    return persistSnapshot(
      current.activeProject,
      current.activeProjectRevision
    );
  }, [clearAutosaveTimer, persistSnapshot]);

  const openProject = useCallback(
    async (
      projectId: StableId
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      const parsedId = StableIdSchema.safeParse(projectId);
      if (!parsedId.success) {
        return invalidCommand("Die Projekt-ID ist ungültig.");
      }
      const current = stateRef.current;
      if (
        current.activeProject?.projectId === parsedId.data &&
        current.activeLoadStatus === "ready"
      ) {
        return { status: "ok", value: current.activeProject };
      }

      if (current.activeProject && selectAnimationProjectDirty(current)) {
        const flush = await saveActiveProject();
        if (flush.status !== "ok") return flush;
      } else {
        await saveQueueRef.current;
      }

      const requestRevision = ++projectRequestRevisionRef.current;
      dispatchState({
        type: "activeProjectLoadStarted",
        projectId: parsedId.data
      });
      if (!repository) {
        dispatchState({
          type: "activeProjectLoadFailed",
          projectId: parsedId.data,
          status: "unavailable",
          message: unavailableMessage
        });
        return unavailableCommand(unavailableMessage);
      }

      try {
        const result = await repository.readProject(parsedId.data);
        if (requestRevision !== projectRequestRevisionRef.current) {
          return {
            status: "failed",
            message: "Eine neuere Projektöffnung hat diese Anfrage ersetzt."
          };
        }
        if (result.status === "ok") {
          dispatchState({
            type: "activeProjectLoaded",
            project: result.value,
            summary: createAnimationProjectSummary(result.value)
          });
          return { status: "ok", value: result.value };
        }
        dispatchState({
          type: "activeProjectLoadFailed",
          projectId: parsedId.data,
          status: loadFailureStatus(result.status),
          message: result.message
        });
        return repositoryFailure(result);
      } catch (error) {
        const failure = failedCommand(error);
        dispatchState({
          type: "activeProjectLoadFailed",
          projectId: parsedId.data,
          status: "failed",
          message: failure.message
        });
        return failure;
      }
    },
    [
      dispatchState,
      repository,
      saveActiveProject,
      unavailableMessage
    ]
  );

  const createProject = useCallback(
    async (
      definition: CreateAnimationProjectDefinition
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      if (!repository) return unavailableCommand(unavailableMessage);

      let projectId: string;
      let clipId: string;
      let timestamp: string;
      try {
        projectId = createProjectId();
        clipId = createClipId();
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }

      const parsedProject = AnimationProjectSchema.safeParse({
        schemaVersion: 1,
        kind: "animationProject",
        projectId,
        name: definition.name,
        createdAt: timestamp,
        updatedAt: timestamp,
        rigTemplateId: HUMANOID_80_RIG_TEMPLATE_ID,
        frameProfile: definition.frameProfile,
        directionSourceMode: definition.directionSourceMode,
        parts: [],
        clips: definition.walk.enabled
          ? [
              {
                clipId,
                templateId: "walk-humanoid-8-v1",
                action: "walk",
                frameCount: definition.walk.frameCount,
                fps: definition.walk.fps,
                loop: true
              }
            ]
          : [],
        overrides: []
      });
      if (!parsedProject.success) {
        return invalidCommand(
          "Das Animationsprojekt konnte wegen ungültiger Startwerte nicht angelegt werden.",
          validationIssues(parsedProject.error.issues)
        );
      }

      try {
        const result = await repository.createProject(parsedProject.data);
        if (result.status !== "ok") return repositoryFailure(result);
        listRequestRevisionRef.current += 1;
        projectRequestRevisionRef.current += 1;
        dispatchState({
          type: "activeProjectLoaded",
          project: parsedProject.data,
          summary: createAnimationProjectSummary(parsedProject.data)
        });
        return { status: "ok", value: parsedProject.data };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      createClipId,
      createProjectId,
      dispatchState,
      now,
      repository,
      unavailableMessage
    ]
  );

  const importProjectBundleArchive = useCallback(
    async (
      archive: Blob,
      conflictResolution: AnimationBundleConflictResolution = "abort"
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      if (stateRef.current.activeProject && selectAnimationProjectDirty(stateRef.current)) {
        const flush = await saveActiveProject();
        if (flush.status !== "ok") return flush;
      } else {
        await saveQueueRef.current;
      }
      try {
        const result = await importPfanimArchive(
          repository,
          archive,
          conflictResolution
        );
        if (result.status !== "ok") return repositoryFailure(result);
        listRequestRevisionRef.current += 1;
        projectRequestRevisionRef.current += 1;
        dispatchState({
          type: "activeProjectLoaded",
          project: result.value.project,
          summary: createAnimationProjectSummary(result.value.project)
        });
        return { status: "ok", value: result.value.project };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [dispatchState, repository, saveActiveProject, unavailableMessage]
  );

  const updateActiveProject = useCallback(
    (input: unknown): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current;
      if (!current.activeProject) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      const parsed = AnimationProjectSchema.safeParse(input);
      if (!parsed.success || parsed.data.projectId !== current.activeProjectId) {
        const issues = parsed.success
          ? [
              {
                path: "projectId",
                message: "Die aktive Projekt-ID darf nicht verändert werden."
              }
            ]
          : validationIssues(parsed.error.issues);
        const failure = invalidCommand(
          "Die Rohänderung ist ungültig und wurde nicht in das aktive Projekt übernommen.",
          issues
        );
        dispatchState({
          type: "rawProjectRejected",
          error: { message: failure.message, issues }
        });
        return failure;
      }

      if (jsonValuesEqual(parsed.data, current.activeProject)) {
        dispatchState({ type: "rawProjectErrorCleared" });
        return { status: "ok", value: current.activeProject };
      }
      dispatchState({
        type: "activeProjectEdited",
        project: parsed.data,
        summary: createAnimationProjectSummary(parsed.data)
      });
      return { status: "ok", value: parsed.data };
    },
    [dispatchState]
  );

  const commitOverrideList = useCallback(
    (
      overrides: readonly DirectionFrameOverride[]
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      if (jsonValuesEqual(overrides, current.overrides)) {
        return { status: "ok", value: current };
      }
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject({ ...current, overrides, updatedAt: timestamp });
    },
    [now, updateActiveProject]
  );

  const setActiveFrameOverride = useCallback(
    (input: unknown): AnimationProjectCommandResult<AnimationProject> => {
      const parsed = DirectionFrameOverrideSchema.safeParse(input);
      if (!parsed.success) {
        return invalidCommand(
          "Die Framekorrektur ist ungültig und wurde nicht übernommen.",
          validationIssues(parsed.error.issues)
        );
      }
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      return commitOverrideList(
        upsertFrameOverride(current.overrides, parsed.data)
      );
    },
    [commitOverrideList]
  );

  const removeActiveFrameOverride = useCallback(
    (
      address: FrameOverrideAddress
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      return commitOverrideList(
        removeFrameOverrideFromList(current.overrides, address)
      );
    },
    [commitOverrideList]
  );

  const resetActiveDirectionOverrides = useCallback(
    (
      clipId: StableId,
      direction: Direction
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      return commitOverrideList(
        resetDirectionOverrides(current.overrides, clipId, direction)
      );
    },
    [commitOverrideList]
  );

  const undoActiveProject = useCallback((): boolean => {
    const current = stateRef.current;
    if (current.historyPast.length === 0 || !current.activeProject) return false;
    clearAutosaveTimer();
    dispatchState({ type: "activeProjectUndo" });
    return true;
  }, [clearAutosaveTimer, dispatchState]);

  const redoActiveProject = useCallback((): boolean => {
    const current = stateRef.current;
    if (current.historyFuture.length === 0 || !current.activeProject) return false;
    clearAutosaveTimer();
    dispatchState({ type: "activeProjectRedo" });
    return true;
  }, [clearAutosaveTimer, dispatchState]);

  const updatePartLayerOffset = useCallback(
    (
      assetId: StableId,
      layerOffset: number
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      if (!current.parts.some((assignment) => assignment.assetId === assetId)) {
        return {
          status: "notFound",
          message: "Der ausgewählte Part ist diesem Projekt nicht mehr zugewiesen."
        };
      }

      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject({
        ...current,
        parts: current.parts.map((assignment) =>
          assignment.assetId === assetId
            ? { ...assignment, layerOffset }
            : assignment
        ),
        updatedAt: timestamp
      });
    },
    [now, updateActiveProject]
  );

  const updateProjectMirrorPolicy = useCallback(
    (
      mirrorPolicy: MirrorPolicy
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject({
        ...current,
        mirrorPolicy,
        updatedAt: timestamp
      });
    },
    [now, updateActiveProject]
  );

  const updatePartMirrorPolicy = useCallback(
    (
      assetId: StableId,
      mirrorPolicy: MirrorPolicy
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      if (!current.parts.some((assignment) => assignment.assetId === assetId)) {
        return {
          status: "notFound",
          message: "Der ausgewählte Part ist diesem Projekt nicht mehr zugewiesen."
        };
      }
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject({
        ...current,
        parts: current.parts.map((assignment) =>
          assignment.assetId === assetId
            ? { ...assignment, mirrorPolicy }
            : assignment
        ),
        mirrorReviews: current.mirrorReviews.filter(
          (review) => review.assetId !== assetId
        ),
        updatedAt: timestamp
      });
    },
    [now, updateActiveProject]
  );

  const confirmDirectionMirrorReview = useCallback(
    (
      definition: ConfirmDirectionMirrorReviewDefinition
    ): AnimationProjectCommandResult<AnimationProject> => {
      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt zum Bearbeiten geöffnet."
        };
      }
      if (!current.parts.some(({ assetId }) => assetId === definition.assetId)) {
        return {
          status: "notFound",
          message: "Die zu prüfende Spiegelquelle ist dem Projekt nicht mehr zugewiesen."
        };
      }
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject({
        ...current,
        mirrorReviews: [
          ...current.mirrorReviews.filter(
            (review) =>
              review.assetId !== definition.assetId ||
              review.targetDirection !== definition.targetDirection
          ),
          {
            assetId: definition.assetId,
            sourceUpdatedAt: definition.sourceUpdatedAt,
            targetDirection: definition.targetDirection,
            confirmedAt: timestamp
          }
        ],
        updatedAt: timestamp
      });
    },
    [now, updateActiveProject]
  );

  const loadPartAssets = useCallback(
    async (
      assetIds: readonly StableId[]
    ): Promise<AnimationProjectCommandResult<AnimationPartAssetResolution>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      try {
        const reads = await Promise.all(
          assetIds.map((assetId) => repository.readPartAsset(assetId))
        );
        const assets: AnimationPartAsset[] = [];
        const missingAssetIds: StableId[] = [];
        for (const [index, read] of reads.entries()) {
          const assetId = assetIds[index];
          if (!assetId) continue;
          if (read.status === "ok") {
            assets.push(read.value);
          } else if (read.status === "notFound") {
            missingAssetIds.push(assetId);
          } else {
            return repositoryFailure(read);
          }
        }
        return {
          status: "ok",
          value: Object.freeze({
            assets: Object.freeze(assets),
            missingAssetIds: Object.freeze(missingAssetIds)
          })
        };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [repository, unavailableMessage]
  );

  const loadReusablePartAssets = useCallback(async (): Promise<
    AnimationProjectCommandResult<AnimationPartAssetResolution>
  > => {
    const assetIds = Object.freeze([
      ...new Set(
        characterKitState.kits.flatMap((kit) => kit.partAssetIds)
      )
    ]) as readonly StableId[];
    return loadPartAssets(assetIds);
  }, [characterKitState.kits, loadPartAssets]);

  const importPartAsset = useCallback(
    async (
      definition: ImportAnimationPartDefinition
    ): Promise<AnimationProjectCommandResult<ImportedAnimationPart>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const beforeImport = stateRef.current;
      if (!beforeImport.activeProject) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt für den Part-Import geöffnet."
        };
      }
      if (selectAnimationProjectDirty(beforeImport)) {
        const saved = await saveActiveProject();
        if (saved.status !== "ok") return saved;
      } else {
        await saveQueueRef.current;
      }

      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Das Animationsprojekt wurde während des Imports geschlossen."
        };
      }

      let timestamp: string;
      let assetId: string;
      let blobId: string;
      try {
        timestamp = now();
        assetId = createPartAssetId();
        blobId = createImageBlobId();
      } catch (error) {
        return failedCommand(error);
      }
      const parsedPart = AnimationPartAssetSchema.safeParse({
        schemaVersion: 1,
        kind: "animationPartAsset",
        assetId,
        blobId,
        label: definition.label,
        slot: definition.slot,
        direction: definition.direction,
        sourceSize: definition.sourceSize,
        trimRect: definition.trimRect,
        anchorStatus: "anchorsPending",
        mirrorPolicy: "inherit",
        ...(definition.attachmentJointId
          ? { attachmentJointId: definition.attachmentJointId }
          : {}),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      if (!parsedPart.success) {
        return invalidCommand(
          "Die Part-Metadaten sind ungültig und wurden nicht gespeichert.",
          validationIssues(parsedPart.error.issues)
        );
      }
      const parsedProject = AnimationProjectSchema.safeParse({
        ...current,
        parts: [
          ...current.parts.filter(
            ({ assetId: currentAssetId }) =>
              currentAssetId !== definition.replacedAssetId
          ),
          { assetId: parsedPart.data.assetId }
        ],
        updatedAt: timestamp
      });
      if (!parsedProject.success) {
        return invalidCommand(
          "Das Projekt kann diesen Part nicht aufnehmen.",
          validationIssues(parsedProject.error.issues)
        );
      }

      try {
        const result = await repository.writePartAssetToProject(
          {
            project: parsedProject.data,
            partAsset: parsedPart.data,
            ...(definition.replacedAssetId
              ? { replacedAssetId: definition.replacedAssetId }
              : {})
          },
          definition.originalBlob
        );
        if (result.status !== "ok") return repositoryFailure(result);
        clearAutosaveTimer();
        listRequestRevisionRef.current += 1;
        projectRequestRevisionRef.current += 1;
        dispatchState({
          type: "activeProjectPersistedEdit",
          project: result.value.project,
          summary: createAnimationProjectSummary(result.value.project)
        });
        return {
          status: "ok",
          value: Object.freeze({
            project: result.value.project,
            partAsset: result.value.partAsset,
            ...(result.value.replacedAssetId
              ? { replacedAssetId: result.value.replacedAssetId }
              : {})
          })
        };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      clearAutosaveTimer,
      createImageBlobId,
      createPartAssetId,
      dispatchState,
      now,
      repository,
      saveActiveProject,
      unavailableMessage
    ]
  );

  const loadPartImageBlob = useCallback(
    async (blobId: StableId): Promise<AnimationProjectCommandResult<Blob>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      try {
        const result = await repository.readBlob(blobId);
        return result.status === "ok"
          ? { status: "ok", value: result.value }
          : repositoryFailure(result);
      } catch (error) {
        return failedCommand(error);
      }
    },
    [repository, unavailableMessage]
  );

  const loadCharacterKitPreview = useCallback(
    async (previewId: StableId): Promise<AnimationProjectCommandResult<Blob>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      try {
        const result = await repository.readPreview(previewId);
        return result.status === "ok"
          ? { status: "ok", value: result.value }
          : repositoryFailure(result);
      } catch (error) {
        return failedCommand(error);
      }
    },
    [repository, unavailableMessage]
  );

  const configurePartAsset = useCallback(
    async (
      definition: ConfigureAnimationPartDefinition
    ): Promise<AnimationProjectCommandResult<ConfiguredAnimationPart>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const beforeSetup = stateRef.current;
      if (!beforeSetup.activeProject) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt für die Ankerbearbeitung geöffnet."
        };
      }
      if (selectAnimationProjectDirty(beforeSetup)) {
        const saved = await saveActiveProject();
        if (saved.status !== "ok") return saved;
      } else {
        await saveQueueRef.current;
      }

      const current = stateRef.current.activeProject;
      if (!current) {
        return {
          status: "notFound",
          message: "Das Animationsprojekt wurde während der Ankerbearbeitung geschlossen."
        };
      }
      if (!current.parts.some(({ assetId }) => assetId === definition.assetId)) {
        return {
          status: "notFound",
          message: "Der ausgewählte Part ist diesem Projekt nicht mehr zugewiesen."
        };
      }

      try {
        const source = await repository.readPartAsset(definition.assetId);
        if (source.status !== "ok") return repositoryFailure(source);
        const template = getBuiltInRigTemplate(current.rigTemplateId);
        const binding =
          template && isRequiredPartSlot(source.value.slot)
            ? findSlotBinding(template, source.value.slot)
            : null;
        const anchorsValid = binding
          ? validateSourceAnchors(
              binding,
              definition.anchors,
              source.value.sourceSize
            ).valid
          : true;
        const timestamp = now();
        const parsedPart = AnimationPartAssetSchema.safeParse({
          ...source.value,
          anchors: definition.anchors,
          anchorStatus: anchorsValid ? "ready" : "invalidAnchors",
          updatedAt: timestamp
        });
        if (!parsedPart.success) {
          return invalidCommand(
            "Die Ankerdaten sind ungültig und wurden nicht gespeichert.",
            validationIssues(parsedPart.error.issues)
          );
        }
        const parsedProject = AnimationProjectSchema.safeParse({
          ...current,
          parts: current.parts.map((assignment) =>
            assignment.assetId === definition.assetId
              ? {
                  ...assignment,
                  transformDelta: definition.transformDelta
                }
              : assignment
          ),
          updatedAt: timestamp
        });
        if (!parsedProject.success) {
          return invalidCommand(
            "Die projektweite Partkorrektur liegt außerhalb des erlaubten Bereichs.",
            validationIssues(parsedProject.error.issues)
          );
        }
        const result = await repository.writePartSetupToProject({
          project: parsedProject.data,
          partAsset: parsedPart.data
        });
        if (result.status !== "ok") return repositoryFailure(result);
        clearAutosaveTimer();
        listRequestRevisionRef.current += 1;
        projectRequestRevisionRef.current += 1;
        dispatchState({
          type: "activeProjectPersistedEdit",
          project: result.value.project,
          summary: createAnimationProjectSummary(result.value.project)
        });
        return {
          status: "ok",
          value: Object.freeze({
            project: result.value.project,
            partAsset: result.value.partAsset
          })
        };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      clearAutosaveTimer,
      dispatchState,
      now,
      repository,
      saveActiveProject,
      unavailableMessage
    ]
  );

  const renameProject = useCallback(
    async (
      projectId: StableId,
      name: string
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      if (!repository) return unavailableCommand(unavailableMessage);

      let sourceProject =
        stateRef.current.activeProject?.projectId === projectId
          ? stateRef.current.activeProject
          : null;
      if (!sourceProject) {
        try {
          const read = await repository.readProject(projectId);
          if (read.status !== "ok") return repositoryFailure(read);
          sourceProject = read.value;
        } catch (error) {
          return failedCommand(error);
        }
      }

      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      const parsed = AnimationProjectSchema.safeParse({
        ...sourceProject,
        name,
        updatedAt: timestamp
      });
      if (!parsed.success) {
        return invalidCommand(
          "Der Projektname ist ungültig und wurde nicht gespeichert.",
          validationIssues(parsed.error.issues)
        );
      }

      if (stateRef.current.activeProjectId === projectId) {
        const updated = updateActiveProject(parsed.data);
        if (updated.status !== "ok") return updated;
        clearAutosaveTimer();
        return persistSnapshot(
          parsed.data,
          stateRef.current.activeProjectRevision
        );
      }

      try {
        const write = await repository.writeProject(parsed.data);
        if (write.status !== "ok") return repositoryFailure(write);
        listRequestRevisionRef.current += 1;
        dispatchState({
          type: "projectSummaryUpserted",
          summary: createAnimationProjectSummary(parsed.data)
        });
        return { status: "ok", value: parsed.data };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      clearAutosaveTimer,
      dispatchState,
      now,
      persistSnapshot,
      repository,
      unavailableMessage,
      updateActiveProject
    ]
  );

  const duplicateProject = useCallback(
    async (
      projectId: StableId
    ): Promise<AnimationProjectCommandResult<AnimationProject>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      if (
        stateRef.current.activeProjectId === projectId &&
        selectAnimationProjectDirty(stateRef.current)
      ) {
        const flush = await saveActiveProject();
        if (flush.status !== "ok") return flush;
      }

      let source =
        stateRef.current.activeProject?.projectId === projectId
          ? stateRef.current.activeProject
          : null;
      if (!source) {
        try {
          const read = await repository.readProject(projectId);
          if (read.status !== "ok") return repositoryFailure(read);
          source = read.value;
        } catch (error) {
          return failedCommand(error);
        }
      }

      let newProjectId: string;
      let timestamp: string;
      try {
        newProjectId = createProjectId();
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      try {
        const result = await repository.duplicateProject({
          sourceProjectId: projectId,
          newProjectId,
          name: duplicateName(source.name),
          timestamp
        });
        if (result.status !== "ok") return repositoryFailure(result);
        listRequestRevisionRef.current += 1;
        dispatchState({
          type: "projectSummaryUpserted",
          summary: createAnimationProjectSummary(result.value)
        });
        return { status: "ok", value: result.value };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      createProjectId,
      dispatchState,
      now,
      repository,
      saveActiveProject,
      unavailableMessage
    ]
  );

  const deleteProject = useCallback(
    async (
      projectId: StableId
    ): Promise<AnimationProjectCommandResult<DeletedAnimationProject>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const wasActive = stateRef.current.activeProjectId === projectId;
      if (wasActive) clearAutosaveTimer();
      await saveQueueRef.current;

      try {
        const result = await repository.deleteProject(projectId);
        if (result.status !== "ok") return repositoryFailure(result);
        listRequestRevisionRef.current += 1;
        if (wasActive) projectRequestRevisionRef.current += 1;
        dispatchState({ type: "projectRemoved", projectId });
        return { status: "ok", value: { projectId, wasActive } };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [clearAutosaveTimer, dispatchState, repository, unavailableMessage]
  );

  const upsertCharacterKitState = useCallback((kit: CharacterKit) => {
    setCharacterKitState((current) => ({
      kits: sortCharacterKits([
        ...current.kits.filter((candidate) => candidate.kitId !== kit.kitId),
        kit
      ]),
      status: "ready",
      error: null
    }));
  }, []);

  const loadCharacterKit = useCallback(
    async (
      kitId: StableId
    ): Promise<AnimationProjectCommandResult<CharacterKit>> => {
      const parsedId = StableIdSchema.safeParse(kitId);
      if (!parsedId.success) return invalidCommand("Die Character-Kit-ID ist ungültig.");
      if (!repository) return unavailableCommand(unavailableMessage);
      try {
        const result = await repository.readKit(parsedId.data);
        return result.status === "ok"
          ? { status: "ok", value: result.value }
          : repositoryFailure(result);
      } catch (error) {
        return failedCommand(error);
      }
    },
    [repository, unavailableMessage]
  );

  const saveActiveProjectAsKit = useCallback(
    async (
      definition: SaveCharacterKitDefinition
    ): Promise<AnimationProjectCommandResult<CharacterKit>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const project = stateRef.current.activeProject;
      if (!project) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt für ein Character Kit geöffnet."
        };
      }
      const template = getBuiltInRigTemplate(project.rigTemplateId);
      if (!template) return invalidCommand("Die Projekt-Rig-Vorlage ist nicht verfügbar.");
      const sources = await loadPartAssets(
        project.parts.map((assignment) => assignment.assetId)
      );
      if (sources.status !== "ok") return sources;
      if (sources.value.missingAssetIds.length > 0) {
        return invalidCommand(
          `Das Kit kann wegen fehlender PartAssets nicht gespeichert werden: ${sources.value.missingAssetIds.join(", ")}.`
        );
      }
      let timestamp: string;
      let kitId: string;
      try {
        timestamp = now();
        kitId = createKitId();
      } catch (error) {
        return failedCommand(error);
      }
      const parsed = CharacterKitSchema.safeParse({
        schemaVersion: 1,
        kind: "characterKit",
        kitId,
        name: definition.name,
        description: definition.description,
        rigTemplateId: project.rigTemplateId,
        rigCompatibilityKey: createRigCompatibilityKey(
          template,
          project.frameProfile
        ),
        directionSourceMode: project.directionSourceMode,
        mirrorPolicy: project.mirrorPolicy,
        coverage: summarizeCharacterKitCoverage({
          mode: project.directionSourceMode,
          assets: sources.value.assets,
          projectMirrorPolicy: project.mirrorPolicy,
          reviews: project.mirrorReviews
        }),
        partAssetIds: project.parts.map((assignment) => assignment.assetId),
        ...(project.previewBlobId ? { previewBlobId: project.previewBlobId } : {}),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      if (!parsed.success) {
        return invalidCommand(
          "Das Character Kit enthält ungültige Metadaten.",
          validationIssues(parsed.error.issues)
        );
      }
      try {
        const existing = await repository.readKit(parsed.data.kitId);
        if (existing.status === "ok") {
          return {
            status: "conflict",
            message: `Die Character-Kit-ID ${parsed.data.kitId} ist bereits vergeben.`
          };
        }
        if (existing.status !== "notFound") return repositoryFailure(existing);
        const result = await repository.writeKit(parsed.data);
        if (result.status !== "ok") return repositoryFailure(result);
        upsertCharacterKitState(parsed.data);
        return { status: "ok", value: parsed.data };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      createKitId,
      loadPartAssets,
      now,
      repository,
      unavailableMessage,
      upsertCharacterKitState
    ]
  );

  const duplicateCharacterKit = useCallback(
    async (
      kitId: StableId
    ): Promise<AnimationProjectCommandResult<CharacterKit>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const source = await loadCharacterKit(kitId);
      if (source.status !== "ok") return source;
      let timestamp: string;
      let newKitId: string;
      try {
        timestamp = now();
        newKitId = createKitId();
      } catch (error) {
        return failedCommand(error);
      }
      const parsed = CharacterKitSchema.safeParse({
        ...source.value,
        kitId: newKitId,
        name: duplicateName(source.value.name),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      if (!parsed.success) {
        return invalidCommand(
          "Die Character-Kit-Kopie ist ungültig.",
          validationIssues(parsed.error.issues)
        );
      }
      try {
        const existing = await repository.readKit(parsed.data.kitId);
        if (existing.status === "ok") {
          return {
            status: "conflict",
            message: `Die Character-Kit-ID ${parsed.data.kitId} ist bereits vergeben.`
          };
        }
        if (existing.status !== "notFound") return repositoryFailure(existing);
        const result = await repository.writeKit(parsed.data);
        if (result.status !== "ok") return repositoryFailure(result);
        upsertCharacterKitState(parsed.data);
        return { status: "ok", value: parsed.data };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [
      createKitId,
      loadCharacterKit,
      now,
      repository,
      unavailableMessage,
      upsertCharacterKitState
    ]
  );

  const renameCharacterKit = useCallback(
    async (
      kitId: StableId,
      name: string
    ): Promise<AnimationProjectCommandResult<CharacterKit>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const source = await loadCharacterKit(kitId);
      if (source.status !== "ok") return source;
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      const parsed = CharacterKitSchema.safeParse({
        ...source.value,
        name,
        updatedAt: timestamp
      });
      if (!parsed.success) {
        return invalidCommand(
          "Der Character-Kit-Name ist ungültig.",
          validationIssues(parsed.error.issues)
        );
      }
      try {
        const result = await repository.writeKit(parsed.data);
        if (result.status !== "ok") return repositoryFailure(result);
        upsertCharacterKitState(parsed.data);
        return { status: "ok", value: parsed.data };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [loadCharacterKit, now, repository, unavailableMessage, upsertCharacterKitState]
  );

  const deleteCharacterKit = useCallback(
    async (
      kitId: StableId
    ): Promise<AnimationProjectCommandResult<StableId>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      try {
        const result = await repository.deleteKit(kitId);
        if (result.status !== "ok") return repositoryFailure(result);
        setCharacterKitState((current) => ({
          kits: Object.freeze(
            current.kits.filter((candidate) => candidate.kitId !== kitId)
          ),
          status: "ready",
          error: null
        }));
        // Binary garbage collection is intentionally not coupled to kit deletion.
        return { status: "ok", value: kitId };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [repository, unavailableMessage]
  );

  const applyCharacterKit = useCallback(
    async (
      kitId: StableId,
      overrideResolution: "abort" | "removeInvalidPartDeltas" = "abort"
    ): Promise<ApplyCharacterKitCommandResult> => {
      const project = stateRef.current.activeProject;
      if (!project) {
        return {
          status: "notFound",
          message: "Öffne zuerst ein Animationsprojekt, um ein Kit anzuwenden."
        };
      }
      const kitResult = await loadCharacterKit(kitId);
      if (kitResult.status !== "ok") return kitResult;
      const sources = await loadPartAssets(kitResult.value.partAssetIds);
      if (sources.status !== "ok") return sources;
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      const application = applyCharacterKitToProject({
        kit: kitResult.value,
        project,
        template: getBuiltInRigTemplate(project.rigTemplateId),
        assets: sources.value.assets,
        timestamp,
        overrideResolution
      });
      if (application.status !== "ok") {
        const reason = application.status;
        const message =
          reason === "incompatible"
            ? application.assessment.compatibility.issues
                .map((issue) => issue.message)
                .join(" ")
            : reason === "missingAssets"
              ? `PartAsset-Referenzen fehlen: ${application.assessment.missingAssetIds.join(", ")}.`
              : `${application.assessment.overrideConflicts.length} Framekorrektur${application.assessment.overrideConflicts.length === 1 ? " ist" : "en sind"} mit dem Kit unvereinbar.`;
        return {
          status: "conflict",
          reason,
          message,
          assessment: application.assessment
        };
      }
      const parsed = AnimationProjectSchema.safeParse(application.project);
      if (!parsed.success) {
        return invalidCommand(
          "Das angewendete Character Kit erzeugt ungültige Projektmetadaten.",
          validationIssues(parsed.error.issues)
        );
      }
      const updated = updateActiveProject(parsed.data);
      if (updated.status !== "ok") return updated;
      return {
        status: "ok",
        value: Object.freeze({
          project: updated.value,
          kit: kitResult.value,
          removedOverrideSlots: application.removedOverrideSlots
        })
      };
    },
    [loadCharacterKit, loadPartAssets, now, updateActiveProject]
  );

  const equipPartAsset = useCallback(
    async (
      assetId: StableId
    ): Promise<AnimationProjectCommandResult<EquippedCharacterPart>> => {
      if (!repository) return unavailableCommand(unavailableMessage);
      const project = stateRef.current.activeProject;
      if (!project) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt für die Ausrüstung geöffnet."
        };
      }
      try {
        const candidate = await repository.readPartAsset(assetId);
        if (candidate.status !== "ok") return repositoryFailure(candidate);
        const assigned = await loadPartAssets(
          project.parts.map((assignment) => assignment.assetId)
        );
        if (assigned.status !== "ok") return assigned;
        if (assigned.value.missingAssetIds.length > 0) {
          return invalidCommand(
            "Ausrüstung wurde abgebrochen, weil bestehende Part-Referenzen fehlen."
          );
        }
        const equipped = equipCharacterPart({
          project,
          asset: candidate.value,
          assignedAssets: assigned.value.assets,
          timestamp: now()
        });
        if (equipped.status !== "ok") return invalidCommand(equipped.message);
        const parsed = AnimationProjectSchema.safeParse(equipped.project);
        if (!parsed.success) {
          return invalidCommand(
            "Das Ausrüstungsteil kann diesem Projekt nicht zugewiesen werden.",
            validationIssues(parsed.error.issues)
          );
        }
        const updated = updateActiveProject(parsed.data);
        if (updated.status !== "ok") return updated;
        return {
          status: "ok",
          value: Object.freeze({
            project: updated.value,
            partAsset: candidate.value,
            replacedAssetIds: equipped.replacedAssetIds as readonly StableId[],
            defaultLayerGroup: equipped.defaultLayerGroup
          })
        };
      } catch (error) {
        return failedCommand(error);
      }
    },
    [loadPartAssets, now, repository, unavailableMessage, updateActiveProject]
  );

  const removeEquippedPartAsset = useCallback(
    (assetId: StableId): AnimationProjectCommandResult<AnimationProject> => {
      const project = stateRef.current.activeProject;
      if (!project) {
        return {
          status: "notFound",
          message: "Es ist kein Animationsprojekt für die Ausrüstung geöffnet."
        };
      }
      if (!project.parts.some((assignment) => assignment.assetId === assetId)) {
        return {
          status: "notFound",
          message: "Das Ausrüstungsteil ist dem Projekt nicht zugewiesen."
        };
      }
      let timestamp: string;
      try {
        timestamp = now();
      } catch (error) {
        return failedCommand(error);
      }
      return updateActiveProject(
        removeCharacterPart(project, assetId, timestamp)
      );
    },
    [now, updateActiveProject]
  );

  const clearRawProjectError = useCallback(() => {
    dispatchState({ type: "rawProjectErrorCleared" });
  }, [dispatchState]);

  useEffect(() => {
    if (
      state.saveStatus !== "dirty" ||
      !selectAnimationProjectCanSave(state) ||
      !state.activeProject
    ) {
      return undefined;
    }

    const project = state.activeProject;
    const revision = state.activeProjectRevision;
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      const current = stateRef.current;
      if (
        current.activeProjectId !== project.projectId ||
        current.activeProjectRevision !== revision ||
        current.rawProjectError !== null
      ) {
        return;
      }
      void persistSnapshot(project, revision);
    }, autosaveDelayMs);

    return clearAutosaveTimer;
  }, [
    autosaveDelayMs,
    clearAutosaveTimer,
    persistSnapshot,
    state
  ]);

  const projectDirty = selectAnimationProjectDirty(state);
  useEffect(() => {
    if (!projectDirty || typeof window === "undefined") return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [projectDirty]);

  useEffect(
    () => () => {
      clearAutosaveTimer();
      listRequestRevisionRef.current += 1;
      projectRequestRevisionRef.current += 1;
    },
    [clearAutosaveTimer]
  );

  const value = useMemo<AnimationProjectContextValue>(
    () => ({
      ...state,
      imageDecoder,
      projectDirty,
      canSaveProject: selectAnimationProjectCanSave(state),
      canUndoProject: state.historyPast.length > 0,
      canRedoProject: state.historyFuture.length > 0,
      characterKits: characterKitState.kits,
      characterKitListStatus: characterKitState.status,
      characterKitListError: characterKitState.error,
      refreshProjects,
      refreshCharacterKits,
      createProject,
      openProject,
      importProjectBundleArchive,
      updateActiveProject,
      setActiveFrameOverride,
      removeActiveFrameOverride,
      resetActiveDirectionOverrides,
      undoActiveProject,
      redoActiveProject,
      updatePartLayerOffset,
      updateProjectMirrorPolicy,
      updatePartMirrorPolicy,
      confirmDirectionMirrorReview,
      saveActiveProject,
      loadPartAssets,
      loadReusablePartAssets,
      importPartAsset,
      loadPartImageBlob,
      loadCharacterKitPreview,
      configurePartAsset,
      renameProject,
      duplicateProject,
      deleteProject,
      saveActiveProjectAsKit,
      loadCharacterKit,
      duplicateCharacterKit,
      renameCharacterKit,
      deleteCharacterKit,
      applyCharacterKit,
      equipPartAsset,
      removeEquippedPartAsset,
      clearRawProjectError
    }),
    [
      clearRawProjectError,
      applyCharacterKit,
      characterKitState,
      createProject,
      deleteCharacterKit,
      deleteProject,
      duplicateCharacterKit,
      duplicateProject,
      equipPartAsset,
      imageDecoder,
      importProjectBundleArchive,
      openProject,
      importPartAsset,
      configurePartAsset,
      loadCharacterKit,
      loadCharacterKitPreview,
      loadPartImageBlob,
      loadPartAssets,
      loadReusablePartAssets,
      projectDirty,
      refreshCharacterKits,
      refreshProjects,
      removeEquippedPartAsset,
      renameCharacterKit,
      renameProject,
      saveActiveProjectAsKit,
      saveActiveProject,
      state,
      updateActiveProject,
      setActiveFrameOverride,
      removeActiveFrameOverride,
      resetActiveDirectionOverrides,
      undoActiveProject,
      redoActiveProject,
      updatePartLayerOffset,
      updateProjectMirrorPolicy,
      updatePartMirrorPolicy,
      confirmDirectionMirrorReview
    ]
  );

  return (
    <AnimationProjectContext.Provider value={value}>
      {children}
    </AnimationProjectContext.Provider>
  );
}

export function useAnimationProject(): AnimationProjectContextValue {
  const context = useContext(AnimationProjectContext);
  if (!context) {
    throw new Error(
      "useAnimationProject must be used within AnimationProjectProvider."
    );
  }
  return context;
}
