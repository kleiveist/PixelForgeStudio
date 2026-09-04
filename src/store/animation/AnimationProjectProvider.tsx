import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode
} from "react";
import { jsonValuesEqual } from "../../domain/json";
import {
  findSlotBinding,
  HUMANOID_80_RIG_TEMPLATE_ID,
  getBuiltInRigTemplate,
  isRequiredPartSlot,
  validateSourceAnchors,
  type Direction,
  type DirectionSourceMode,
  type FrameProfile,
  type PartSlot,
  type Rect,
  type Size,
  type SourceAnchors,
  type TransformDelta
} from "../../domain/animation";
import {
  AnimationPartAssetSchema,
  AnimationProjectSchema,
  StableIdSchema,
  type AnimationPartAsset,
  type AnimationProject,
  type StableId
} from "../../schemas";
import {
  createBrowserImageDecoder,
  createAnimationProjectSummary,
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

export interface ConfiguredAnimationPart {
  readonly project: AnimationProject;
  readonly partAsset: AnimationPartAsset;
}

export interface AnimationProjectContextValue extends AnimationProjectState {
  readonly imageDecoder: ImageDecoder;
  readonly projectDirty: boolean;
  readonly canSaveProject: boolean;
  readonly refreshProjects: () => Promise<void>;
  readonly createProject: (
    definition: CreateAnimationProjectDefinition
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly openProject: (
    projectId: StableId
  ) => Promise<AnimationProjectCommandResult<AnimationProject>>;
  readonly updateActiveProject: (
    input: unknown
  ) => AnimationProjectCommandResult<AnimationProject>;
  readonly saveActiveProject: () => Promise<
    AnimationProjectCommandResult<AnimationProject>
  >;
  readonly loadPartAssets: (
    assetIds: readonly StableId[]
  ) => Promise<AnimationProjectCommandResult<AnimationPartAssetResolution>>;
  readonly importPartAsset: (
    definition: ImportAnimationPartDefinition
  ) => Promise<AnimationProjectCommandResult<ImportedAnimationPart>>;
  readonly loadPartImageBlob: (
    blobId: StableId
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
  readonly imageDecoder?: ImageDecoder;
  readonly autosaveDelayMs?: number;
}

const AnimationProjectContext =
  createContext<AnimationProjectContextValue | null>(null);

let fallbackIdSequence = 0;

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function randomAnimationId(prefix: "project" | "clip" | "part" | "blob"): string {
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
  imageDecoder = createBrowserImageDecoder(),
  autosaveDelayMs = ANIMATION_AUTOSAVE_DELAY_MS
}: AnimationProjectProviderProps) {
  const [state, dispatch] = useReducer(
    animationProjectReducer,
    INITIAL_ANIMATION_PROJECT_STATE
  );
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

  useEffect(() => {
    void refreshProjects();
    return () => {
      listRequestRevisionRef.current += 1;
    };
  }, [refreshProjects]);

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
          type: "activeProjectLoaded",
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
                  assetId: assignment.assetId,
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
          type: "activeProjectLoaded",
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
      refreshProjects,
      createProject,
      openProject,
      updateActiveProject,
      saveActiveProject,
      loadPartAssets,
      importPartAsset,
      loadPartImageBlob,
      configurePartAsset,
      renameProject,
      duplicateProject,
      deleteProject,
      clearRawProjectError
    }),
    [
      clearRawProjectError,
      createProject,
      deleteProject,
      duplicateProject,
      imageDecoder,
      openProject,
      importPartAsset,
      configurePartAsset,
      loadPartImageBlob,
      loadPartAssets,
      projectDirty,
      refreshProjects,
      renameProject,
      saveActiveProject,
      state,
      updateActiveProject
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
