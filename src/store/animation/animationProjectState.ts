import type { AnimationProject, StableId } from "../../schemas";
import { jsonValuesEqual } from "../../domain/json";
import type {
  AnimationProjectSummary,
  AnimationRepositoryValidationIssue
} from "../../services";

export type AnimationProjectListStatus =
  | "idle"
  | "loading"
  | "ready"
  | "invalid"
  | "unavailable"
  | "failed";

export type AnimationProjectLoadStatus =
  | "idle"
  | "loading"
  | "ready"
  | "notFound"
  | "invalid"
  | "unavailable"
  | "failed";

export type AnimationProjectSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "failed";

export interface AnimationProjectRawError {
  readonly message: string;
  readonly issues: readonly AnimationRepositoryValidationIssue[];
}

export interface AnimationProjectState {
  readonly projectSummaries: readonly AnimationProjectSummary[];
  readonly projectListStatus: AnimationProjectListStatus;
  readonly projectListError: string | null;
  readonly activeProjectId: StableId | null;
  readonly activeProject: AnimationProject | null;
  readonly activeLoadStatus: AnimationProjectLoadStatus;
  readonly activeLoadError: string | null;
  readonly saveStatus: AnimationProjectSaveStatus;
  readonly saveError: string | null;
  readonly activeProjectRevision: number;
  readonly persistedProjectRevision: number;
  readonly savingRevision: number | null;
  readonly rawProjectError: AnimationProjectRawError | null;
  /** Metadata-only snapshots; binary assets live exclusively in the repository. */
  readonly historyPast: readonly AnimationProject[];
  readonly historyFuture: readonly AnimationProject[];
  readonly persistedProject: AnimationProject | null;
}

export const ANIMATION_PROJECT_HISTORY_LIMIT = 100;

export type AnimationProjectAction =
  | Readonly<{ type: "projectListLoadStarted" }>
  | Readonly<{
      type: "projectListLoaded";
      summaries: readonly AnimationProjectSummary[];
    }>
  | Readonly<{
      type: "projectListLoadFailed";
      status: Exclude<AnimationProjectListStatus, "idle" | "loading" | "ready">;
      message: string;
    }>
  | Readonly<{ type: "activeProjectLoadStarted"; projectId: StableId }>
  | Readonly<{
      type: "activeProjectLoaded";
      project: AnimationProject;
      summary: AnimationProjectSummary;
    }>
  | Readonly<{
      type: "activeProjectLoadFailed";
      projectId: StableId;
      status: Exclude<AnimationProjectLoadStatus, "idle" | "loading" | "ready">;
      message: string;
    }>
  | Readonly<{
      type: "activeProjectEdited";
      project: AnimationProject;
      summary: AnimationProjectSummary;
    }>
  | Readonly<{
      type: "activeProjectPersistedEdit";
      project: AnimationProject;
      summary: AnimationProjectSummary;
    }>
  | Readonly<{ type: "activeProjectUndo" }>
  | Readonly<{ type: "activeProjectRedo" }>
  | Readonly<{
      type: "rawProjectRejected";
      error: AnimationProjectRawError;
    }>
  | Readonly<{ type: "rawProjectErrorCleared" }>
  | Readonly<{
      type: "saveStarted";
      projectId: StableId;
      revision: number;
    }>
  | Readonly<{
      type: "saveSucceeded";
      projectId: StableId;
      revision: number;
      project: AnimationProject;
      summary: AnimationProjectSummary;
    }>
  | Readonly<{
      type: "saveFailed";
      projectId: StableId;
      revision: number;
      message: string;
    }>
  | Readonly<{ type: "projectSummaryUpserted"; summary: AnimationProjectSummary }>
  | Readonly<{ type: "projectRemoved"; projectId: StableId }>
  | Readonly<{ type: "activeProjectCleared" }>;

export const INITIAL_ANIMATION_PROJECT_STATE: AnimationProjectState =
  Object.freeze({
    projectSummaries: Object.freeze([]),
    projectListStatus: "idle",
    projectListError: null,
    activeProjectId: null,
    activeProject: null,
    activeLoadStatus: "idle",
    activeLoadError: null,
    saveStatus: "idle",
    saveError: null,
    activeProjectRevision: 0,
    persistedProjectRevision: 0,
    savingRevision: null,
    rawProjectError: null,
    historyPast: Object.freeze([]),
    historyFuture: Object.freeze([]),
    persistedProject: null
  });

function sortSummaries(
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

function upsertSummary(
  summaries: readonly AnimationProjectSummary[],
  summary: AnimationProjectSummary
): readonly AnimationProjectSummary[] {
  return sortSummaries([
    ...summaries.filter(({ projectId }) => projectId !== summary.projectId),
    summary
  ]);
}

function clearActiveProject(
  state: AnimationProjectState
): AnimationProjectState {
  return {
    ...state,
    activeProjectId: null,
    activeProject: null,
    activeLoadStatus: "idle",
    activeLoadError: null,
    saveStatus: "idle",
    saveError: null,
    activeProjectRevision: 0,
    persistedProjectRevision: 0,
    savingRevision: null,
    rawProjectError: null,
    historyPast: Object.freeze([]),
    historyFuture: Object.freeze([]),
    persistedProject: null
  };
}

export function selectAnimationProjectDirty(
  state: AnimationProjectState
): boolean {
  return (
    state.activeProject !== null &&
    (state.rawProjectError !== null ||
      state.persistedProject === null ||
      !jsonValuesEqual(state.activeProject, state.persistedProject))
  );
}

export function selectAnimationProjectCanSave(
  state: AnimationProjectState
): boolean {
  return (
    state.activeProject !== null &&
    state.rawProjectError === null &&
    selectAnimationProjectDirty(state) &&
    state.saveStatus !== "saving"
  );
}

export function animationProjectReducer(
  state: AnimationProjectState,
  action: AnimationProjectAction
): AnimationProjectState {
  switch (action.type) {
    case "projectListLoadStarted":
      return {
        ...state,
        projectListStatus: "loading",
        projectListError: null
      };
    case "projectListLoaded": {
      const activeSummary = state.activeProjectId
        ? state.projectSummaries.find(
            ({ projectId }) => projectId === state.activeProjectId
          )
        : undefined;
      return {
        ...state,
        projectSummaries: activeSummary
          ? upsertSummary(action.summaries, activeSummary)
          : sortSummaries(action.summaries),
        projectListStatus: "ready",
        projectListError: null
      };
    }
    case "projectListLoadFailed":
      return {
        ...state,
        projectListStatus: action.status,
        projectListError: action.message
      };
    case "activeProjectLoadStarted":
      return {
        ...state,
        activeProjectId: action.projectId,
        activeProject: null,
        activeLoadStatus: "loading",
        activeLoadError: null,
        saveStatus: "idle",
        saveError: null,
        activeProjectRevision: 0,
        persistedProjectRevision: 0,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze([]),
        historyFuture: Object.freeze([]),
        persistedProject: null
      };
    case "activeProjectLoaded":
      return {
        ...state,
        projectSummaries: upsertSummary(state.projectSummaries, action.summary),
        projectListStatus: "ready",
        projectListError: null,
        activeProjectId: action.project.projectId,
        activeProject: action.project,
        activeLoadStatus: "ready",
        activeLoadError: null,
        saveStatus: "saved",
        saveError: null,
        activeProjectRevision: 0,
        persistedProjectRevision: 0,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze([]),
        historyFuture: Object.freeze([]),
        persistedProject: action.project
      };
    case "activeProjectLoadFailed":
      return {
        ...state,
        activeProjectId: action.projectId,
        activeProject: null,
        activeLoadStatus: action.status,
        activeLoadError: action.message,
        saveStatus: "idle",
        saveError: null,
        activeProjectRevision: 0,
        persistedProjectRevision: 0,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze([]),
        historyFuture: Object.freeze([]),
        persistedProject: null
      };
    case "activeProjectEdited":
      if (state.activeProjectId !== action.project.projectId) return state;
      return {
        ...state,
        projectSummaries: upsertSummary(state.projectSummaries, action.summary),
        activeProject: action.project,
        activeLoadStatus: "ready",
        saveStatus:
          state.persistedProject &&
          jsonValuesEqual(action.project, state.persistedProject)
            ? "saved"
            : "dirty",
        saveError: null,
        activeProjectRevision: state.activeProjectRevision + 1,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze(
          [
            ...state.historyPast,
            ...(state.activeProject ? [state.activeProject] : [])
          ].slice(-ANIMATION_PROJECT_HISTORY_LIMIT)
        ),
        historyFuture: Object.freeze([])
      };
    case "activeProjectPersistedEdit":
      if (state.activeProjectId !== action.project.projectId) return state;
      return {
        ...state,
        projectSummaries: upsertSummary(state.projectSummaries, action.summary),
        activeProject: action.project,
        activeLoadStatus: "ready",
        saveStatus: "saved",
        saveError: null,
        activeProjectRevision: state.activeProjectRevision + 1,
        persistedProjectRevision: state.activeProjectRevision + 1,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze(
          [
            ...state.historyPast,
            ...(state.activeProject ? [state.activeProject] : [])
          ].slice(-ANIMATION_PROJECT_HISTORY_LIMIT)
        ),
        historyFuture: Object.freeze([]),
        persistedProject: action.project
      };
    case "activeProjectUndo": {
      const previous = state.historyPast.at(-1);
      if (!state.activeProject || !previous) return state;
      const dirty =
        state.persistedProject === null ||
        !jsonValuesEqual(previous, state.persistedProject);
      return {
        ...state,
        projectSummaries: upsertSummary(state.projectSummaries, {
          projectId: previous.projectId,
          name: previous.name,
          updatedAt: previous.updatedAt,
          rigTemplateId: previous.rigTemplateId,
          directionSourceMode: previous.directionSourceMode,
          partCount: previous.parts.length,
          clipCount: previous.clips.length,
          hasPreview: previous.previewBlobId !== undefined
        }),
        activeProject: previous,
        saveStatus: dirty ? "dirty" : "saved",
        saveError: null,
        activeProjectRevision: state.activeProjectRevision + 1,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze(state.historyPast.slice(0, -1)),
        historyFuture: Object.freeze([state.activeProject, ...state.historyFuture])
      };
    }
    case "activeProjectRedo": {
      const next = state.historyFuture[0];
      if (!state.activeProject || !next) return state;
      const dirty =
        state.persistedProject === null ||
        !jsonValuesEqual(next, state.persistedProject);
      return {
        ...state,
        projectSummaries: upsertSummary(state.projectSummaries, {
          projectId: next.projectId,
          name: next.name,
          updatedAt: next.updatedAt,
          rigTemplateId: next.rigTemplateId,
          directionSourceMode: next.directionSourceMode,
          partCount: next.parts.length,
          clipCount: next.clips.length,
          hasPreview: next.previewBlobId !== undefined
        }),
        activeProject: next,
        saveStatus: dirty ? "dirty" : "saved",
        saveError: null,
        activeProjectRevision: state.activeProjectRevision + 1,
        savingRevision: null,
        rawProjectError: null,
        historyPast: Object.freeze(
          [...state.historyPast, state.activeProject].slice(
            -ANIMATION_PROJECT_HISTORY_LIMIT
          )
        ),
        historyFuture: Object.freeze(state.historyFuture.slice(1))
      };
    }
    case "rawProjectRejected":
      if (!state.activeProject) return state;
      return {
        ...state,
        saveStatus: "dirty",
        saveError: null,
        rawProjectError: action.error
      };
    case "rawProjectErrorCleared":
      if (!state.rawProjectError) return state;
      return {
        ...state,
        saveStatus:
          state.persistedProject !== null &&
          state.activeProject !== null &&
          jsonValuesEqual(state.activeProject, state.persistedProject)
            ? "saved"
            : "dirty",
        rawProjectError: null
      };
    case "saveStarted":
      if (state.activeProjectId !== action.projectId) return state;
      return {
        ...state,
        saveStatus: "saving",
        saveError: null,
        savingRevision: action.revision
      };
    case "saveSucceeded": {
      if (state.activeProjectId !== action.projectId) return state;
      const currentRevisionWasSaved =
        state.activeProjectRevision === action.revision;
      return {
        ...state,
        projectSummaries: upsertSummary(
          state.projectSummaries,
          currentRevisionWasSaved
            ? action.summary
            : state.activeProject
              ? {
                  ...action.summary,
                  name: state.activeProject.name,
                  updatedAt: state.activeProject.updatedAt,
                  partCount: state.activeProject.parts.length,
                  clipCount: state.activeProject.clips.length,
                  hasPreview: state.activeProject.previewBlobId !== undefined
                }
              : action.summary
        ),
        projectListStatus: "ready",
        projectListError: null,
        persistedProjectRevision: Math.max(
          state.persistedProjectRevision,
          action.revision
        ),
        persistedProject: action.project,
        saveStatus:
          state.activeProject !== null &&
          jsonValuesEqual(state.activeProject, action.project) &&
          state.rawProjectError === null
            ? "saved"
            : "dirty",
        saveError: null,
        savingRevision: null
      };
    }
    case "saveFailed":
      if (state.activeProjectId !== action.projectId) return state;
      return {
        ...state,
        saveStatus: "failed",
        saveError: action.message,
        savingRevision: null
      };
    case "projectSummaryUpserted":
      return {
        ...state,
        projectSummaries: upsertSummary(
          state.projectSummaries,
          action.summary
        ),
        projectListStatus: "ready",
        projectListError: null
      };
    case "projectRemoved": {
      const nextState = {
        ...state,
        projectSummaries: state.projectSummaries.filter(
          ({ projectId }) => projectId !== action.projectId
        ),
        projectListStatus: "ready" as const,
        projectListError: null
      };
      return state.activeProjectId === action.projectId
        ? clearActiveProject(nextState)
        : nextState;
    }
    case "activeProjectCleared":
      return clearActiveProject(state);
  }
}
