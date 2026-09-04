import { describe, expect, it } from "vitest";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectSummary } from "../../services";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import {
  INITIAL_ANIMATION_PROJECT_STATE,
  animationProjectReducer,
  selectAnimationProjectCanSave,
  selectAnimationProjectDirty
} from "./animationProjectState";

const project = parseAnimationProject(createAnimationProjectInput());
const summary = createAnimationProjectSummary(project);

describe("animationProjectReducer", () => {
  it("tracks sorted project-list loading independently from the active project", () => {
    const loading = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "projectListLoadStarted"
    });
    expect(loading.projectListStatus).toBe("loading");

    const loaded = animationProjectReducer(loading, {
      type: "projectListLoaded",
      summaries: [
        summary,
        {
          ...summary,
          projectId: parseAnimationProject(
            createAnimationProjectInput({ projectId: "project_newer_001" })
          ).projectId,
          name: "Neuer",
          updatedAt: "2026-09-04T13:00:00.000Z"
        }
      ]
    });

    expect(loaded.projectListStatus).toBe("ready");
    expect(loaded.projectSummaries.map(({ projectId }) => projectId)).toEqual([
      "project_newer_001",
      project.projectId
    ]);
    expect(loaded.activeProject).toBeNull();
  });

  it("hydrates an active project as clean without inventing a revision", () => {
    const loading = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "activeProjectLoadStarted",
      projectId: project.projectId
    });
    const loaded = animationProjectReducer(loading, {
      type: "activeProjectLoaded",
      project,
      summary
    });

    expect(loaded).toMatchObject({
      activeProject: project,
      activeLoadStatus: "ready",
      saveStatus: "saved",
      activeProjectRevision: 0,
      persistedProjectRevision: 0,
      rawProjectError: null
    });
    expect(selectAnimationProjectDirty(loaded)).toBe(false);
    expect(selectAnimationProjectCanSave(loaded)).toBe(false);
  });

  it("increments valid edits and keeps invalid raw errors outside the last valid project", () => {
    const loaded = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "activeProjectLoaded",
      project,
      summary
    });
    const editedProject = parseAnimationProject({
      ...project,
      name: "Geänderter Wächter",
      updatedAt: "2026-09-04T13:00:00.000Z"
    });
    const edited = animationProjectReducer(loaded, {
      type: "activeProjectEdited",
      project: editedProject,
      summary: createAnimationProjectSummary(editedProject)
    });
    const rejected = animationProjectReducer(edited, {
      type: "rawProjectRejected",
      error: {
        message: "Projektmetadaten sind ungültig.",
        issues: [{ path: "name", message: "Name is required." }]
      }
    });

    expect(rejected.activeProject).toBe(editedProject);
    expect(rejected.activeProjectRevision).toBe(1);
    expect(rejected.rawProjectError).toMatchObject({
      issues: [{ path: "name" }]
    });
    expect(selectAnimationProjectDirty(rejected)).toBe(true);
    expect(selectAnimationProjectCanSave(rejected)).toBe(false);

    const staleListHydration = animationProjectReducer(rejected, {
      type: "projectListLoaded",
      summaries: [summary]
    });
    expect(staleListHydration.projectSummaries[0]).toMatchObject({
      name: "Geänderter Wächter"
    });
  });

  it("tracks saving, stale saves and the latest successfully persisted revision", () => {
    const loaded = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "activeProjectLoaded",
      project,
      summary
    });
    const firstProject = parseAnimationProject({
      ...project,
      name: "Revision eins",
      updatedAt: "2026-09-04T13:00:00.000Z"
    });
    const firstEdit = animationProjectReducer(loaded, {
      type: "activeProjectEdited",
      project: firstProject,
      summary: createAnimationProjectSummary(firstProject)
    });
    const saving = animationProjectReducer(firstEdit, {
      type: "saveStarted",
      projectId: project.projectId,
      revision: 1
    });
    const secondProject = parseAnimationProject({
      ...firstProject,
      name: "Revision zwei",
      updatedAt: "2026-09-04T14:00:00.000Z"
    });
    const secondEdit = animationProjectReducer(saving, {
      type: "activeProjectEdited",
      project: secondProject,
      summary: createAnimationProjectSummary(secondProject)
    });
    const staleSaveCompleted = animationProjectReducer(secondEdit, {
      type: "saveSucceeded",
      projectId: project.projectId,
      revision: 1,
      project: firstProject,
      summary: createAnimationProjectSummary(firstProject)
    });

    expect(staleSaveCompleted).toMatchObject({
      activeProject: secondProject,
      activeProjectRevision: 2,
      persistedProjectRevision: 1,
      saveStatus: "dirty"
    });
    expect(staleSaveCompleted.projectSummaries[0]).toMatchObject({
      name: "Revision zwei"
    });

    const latestSaveCompleted = animationProjectReducer(staleSaveCompleted, {
      type: "saveSucceeded",
      projectId: project.projectId,
      revision: 2,
      project: secondProject,
      summary: createAnimationProjectSummary(secondProject)
    });
    expect(latestSaveCompleted.saveStatus).toBe("saved");
    expect(latestSaveCompleted.persistedProjectRevision).toBe(2);
    expect(selectAnimationProjectDirty(latestSaveCompleted)).toBe(false);
  });

  it("preserves the valid edited project after a write failure and clears it on deletion", () => {
    const loaded = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "activeProjectLoaded",
      project,
      summary
    });
    const editedProject = parseAnimationProject({
      ...project,
      name: "Ungespeichert",
      updatedAt: "2026-09-04T13:00:00.000Z"
    });
    const edited = animationProjectReducer(loaded, {
      type: "activeProjectEdited",
      project: editedProject,
      summary: createAnimationProjectSummary(editedProject)
    });
    const failed = animationProjectReducer(edited, {
      type: "saveFailed",
      projectId: project.projectId,
      revision: 1,
      message: "IndexedDB ist nicht verfügbar."
    });

    expect(failed.activeProject).toBe(editedProject);
    expect(failed.saveStatus).toBe("failed");
    expect(failed.saveError).toBe("IndexedDB ist nicht verfügbar.");
    expect(selectAnimationProjectDirty(failed)).toBe(true);

    const deleted = animationProjectReducer(failed, {
      type: "projectRemoved",
      projectId: project.projectId
    });
    expect(deleted).toMatchObject({
      activeProjectId: null,
      activeProject: null,
      activeLoadStatus: "idle",
      saveStatus: "idle"
    });
    expect(deleted.projectSummaries).toEqual([]);
  });

  it("represents an unknown route project without activating invalid data", () => {
    const missingId = parseAnimationProject(
      createAnimationProjectInput({ projectId: "project_missing_001" })
    ).projectId;
    const failed = animationProjectReducer(INITIAL_ANIMATION_PROJECT_STATE, {
      type: "activeProjectLoadFailed",
      projectId: missingId,
      status: "notFound",
      message: "Projekt nicht gefunden."
    });

    expect(failed).toMatchObject({
      activeProjectId: missingId,
      activeProject: null,
      activeLoadStatus: "notFound",
      activeLoadError: "Projekt nicht gefunden."
    });
  });
});
