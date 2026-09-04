import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HUMANOID_80_FRAME_PROFILE } from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  type AnimationProject
} from "../../schemas";
import { MemoryAnimationRepository } from "../../services";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import {
  AnimationProjectProvider,
  useAnimationProject,
  type AnimationProjectContextValue,
  type CreateAnimationProjectDefinition
} from "./AnimationProjectProvider";

const NOW = "2026-09-04T15:00:00.000Z";
const DEFAULT_DEFINITION: CreateAnimationProjectDefinition = {
  name: "Neue Waldläuferin",
  frameProfile: HUMANOID_80_FRAME_PROFILE,
  directionSourceMode: "fiveAuthoredPlusMirror",
  walk: { enabled: true, frameCount: 8, fps: 10 }
};

let context: AnimationProjectContextValue;

function ContextObserver() {
  context = useAnimationProject();
  return (
    <output data-testid="animation-state">
      {JSON.stringify({
        list: context.projectListStatus,
        activeId: context.activeProjectId,
        activeName: context.activeProject?.name ?? null,
        load: context.activeLoadStatus,
        save: context.saveStatus,
        dirty: context.projectDirty,
        revision: context.activeProjectRevision,
        persistedRevision: context.persistedProjectRevision,
        rawError: context.rawProjectError?.message ?? null
      })}
    </output>
  );
}

function renderProvider(
  repository: MemoryAnimationRepository | null,
  overrides: Readonly<{
    now?: () => string;
    createProjectId?: () => string;
    createClipId?: () => string;
    createPartAssetId?: () => string;
    createImageBlobId?: () => string;
    autosaveDelayMs?: number;
  }> = {}
) {
  return render(
    <AnimationProjectProvider
      repository={repository}
      {...overrides}
    >
      <ContextObserver />
    </AnimationProjectProvider>
  );
}

async function expectListReady() {
  await waitFor(() => expect(context.projectListStatus).toBe("ready"));
}

async function seedProject(
  repository: MemoryAnimationRepository,
  overrides: Parameters<typeof createAnimationProjectInput>[0] = {}
): Promise<AnimationProject> {
  const project = parseAnimationProject(createAnimationProjectInput(overrides));
  expect(await repository.createProject(project)).toEqual({ status: "ok" });
  return project;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AnimationProjectProvider", () => {
  it("hydrates the summary list and opens a project without writing", async () => {
    const repository = new MemoryAnimationRepository();
    const project = await seedProject(repository);
    const writeProject = vi.spyOn(repository, "writeProject");
    renderProvider(repository);

    await expectListReady();
    expect(context.projectSummaries).toHaveLength(1);
    await act(async () => {
      expect(await context.openProject(project.projectId)).toMatchObject({
        status: "ok",
        value: { projectId: project.projectId }
      });
    });

    expect(context).toMatchObject({
      activeProject: project,
      activeLoadStatus: "ready",
      saveStatus: "saved",
      projectDirty: false,
      activeProjectRevision: 0,
      persistedProjectRevision: 0
    });
    expect(writeProject).not.toHaveBeenCalled();
  });

  it("creates a schema-valid default project through injected ID and time factories", async () => {
    const repository = new MemoryAnimationRepository();
    renderProvider(repository, {
      now: () => NOW,
      createProjectId: () => "project_created_001",
      createClipId: () => "clip_created_walk_001"
    });
    await expectListReady();

    await act(async () => {
      expect(await context.createProject(DEFAULT_DEFINITION)).toMatchObject({
        status: "ok",
        value: { projectId: "project_created_001" }
      });
    });

    const stored = await repository.readProject("project_created_001");
    expect(stored).toEqual({
      status: "ok",
      value: {
        schemaVersion: 1,
        kind: "animationProject",
        projectId: "project_created_001",
        name: "Neue Waldläuferin",
        createdAt: NOW,
        updatedAt: NOW,
        rigTemplateId: "humanoid-80-v1",
        frameProfile: {
          frameSize: { width: 128, height: 128 },
          characterHeight: 80,
          footAnchor: { x: 64, y: 112 }
        },
        directionSourceMode: "fiveAuthoredPlusMirror",
        parts: [],
        clips: [
          {
            clipId: "clip_created_walk_001",
            templateId: "walk-humanoid-8-v1",
            action: "walk",
            frameCount: 8,
            fps: 10,
            loop: true
          }
        ],
        overrides: []
      }
    });
    expect(context.projectDirty).toBe(false);
  });

  it("debounces valid edits and never replaces the active model with invalid raw input", async () => {
    const repository = new MemoryAnimationRepository();
    const project = await seedProject(repository);
    renderProvider(repository);
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });
    const writeProject = vi.spyOn(repository, "writeProject");
    vi.useFakeTimers();

    const edited = parseAnimationProject({
      ...project,
      name: "Autosave-Revision",
      updatedAt: NOW
    });
    act(() => {
      expect(context.updateActiveProject(edited)).toMatchObject({ status: "ok" });
    });
    expect(context.projectDirty).toBe(true);
    expect(context.activeProjectRevision).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(299);
      await Promise.resolve();
    });
    expect(writeProject).not.toHaveBeenCalled();

    act(() => {
      expect(
        context.updateActiveProject({ ...edited, name: "" })
      ).toMatchObject({ status: "invalid" });
    });
    expect(context.activeProject?.name).toBe("Autosave-Revision");
    expect(context.rawProjectError).not.toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(1_000);
      await Promise.resolve();
    });
    expect(writeProject).not.toHaveBeenCalled();

    act(() => {
      context.clearRawProjectError();
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeProject).toHaveBeenCalledTimes(1);
    expect(context.saveStatus).toBe("saved");
    expect(context.projectDirty).toBe(false);
  });

  it("flushes the latest valid revision before opening another project", async () => {
    const repository = new MemoryAnimationRepository();
    const first = await seedProject(repository, {
      projectId: "project_switch_first_001",
      name: "Erstes Projekt"
    });
    const second = await seedProject(repository, {
      projectId: "project_switch_second_001",
      name: "Zweites Projekt"
    });
    renderProvider(repository, { autosaveDelayMs: 60_000 });
    await expectListReady();
    await act(async () => {
      await context.openProject(first.projectId);
    });
    const writeProject = vi.spyOn(repository, "writeProject");

    const edited = parseAnimationProject({
      ...first,
      name: "Vor Wechsel gespeichert",
      updatedAt: NOW
    });
    act(() => {
      context.updateActiveProject(edited);
    });
    await act(async () => {
      expect(await context.openProject(second.projectId)).toMatchObject({
        status: "ok",
        value: { projectId: second.projectId }
      });
    });

    expect(writeProject).toHaveBeenCalledTimes(1);
    expect(writeProject).toHaveBeenCalledWith(edited);
    expect(context.activeProject?.projectId).toBe(second.projectId);
    expect(await repository.readProject(first.projectId)).toMatchObject({
      status: "ok",
      value: { name: "Vor Wechsel gespeichert" }
    });
  });

  it("retains the last valid in-memory revision and exposes a concrete write failure", async () => {
    const repository = new MemoryAnimationRepository();
    const project = await seedProject(repository);
    renderProvider(repository);
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });
    vi.spyOn(repository, "writeProject").mockResolvedValueOnce({
      status: "failed",
      reason: "transaction",
      message: "Quota überschritten."
    });
    vi.useFakeTimers();

    const edited = parseAnimationProject({
      ...project,
      name: "Bleibt im Speicher",
      updatedAt: NOW
    });
    act(() => {
      context.updateActiveProject(edited);
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(context.activeProject).toEqual(edited);
    expect(context.saveStatus).toBe("failed");
    expect(context.saveError).toBe("Quota überschritten.");
    expect(context.projectDirty).toBe(true);
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { name: project.name }
    });
  });

  it("installs the unload warning only while changes are unsaved", async () => {
    const repository = new MemoryAnimationRepository();
    const project = await seedProject(repository);
    renderProvider(repository, { autosaveDelayMs: 60_000 });
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });

    const cleanEvent = new Event("beforeunload", {
      bubbles: false,
      cancelable: true
    });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);

    act(() => {
      context.updateActiveProject(
        parseAnimationProject({ ...project, name: "Ungesichert", updatedAt: NOW })
      );
    });
    const dirtyEvent = new Event("beforeunload", {
      bubbles: false,
      cancelable: true
    });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    await act(async () => {
      await context.saveActiveProject();
    });
    const savedEvent = new Event("beforeunload", {
      bubbles: false,
      cancelable: true
    });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
  });

  it("reports unavailable storage without throwing during hydration", async () => {
    renderProvider(null);
    await waitFor(() => expect(context.projectListStatus).toBe("unavailable"));
    expect(context.projectListError).toBe(
      "Der lokale Animationsspeicher ist nicht verfügbar."
    );
    expect(context.projectSummaries).toEqual([]);
  });

  it("updates a bounded project-wide part layer delta without duplicating the order", async () => {
    const repository = new MemoryAnimationRepository();
    const project = await seedProject(repository, {
      parts: [{ assetId: "part_layer_delta_001" }]
    });
    const assetId = project.parts[0]!.assetId;
    renderProvider(repository, { now: () => NOW, autosaveDelayMs: 60_000 });
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });

    act(() => {
      expect(
        context.updatePartLayerOffset(assetId, 3)
      ).toMatchObject({ status: "ok" });
    });
    expect(context.activeProject?.parts).toEqual([
      { assetId: "part_layer_delta_001", layerOffset: 3 }
    ]);
    expect(context.activeProject?.updatedAt).toBe(NOW);
    expect(context.projectDirty).toBe(true);

    act(() => {
      expect(
        context.updatePartLayerOffset(assetId, 9)
      ).toMatchObject({ status: "invalid" });
    });
    expect(context.activeProject?.parts[0]?.layerOffset).toBe(3);
  });

  it("loads assigned PartAssets and atomically imports an anchor-pending source", async () => {
    const repository = new MemoryAnimationRepository();
    const existing = parseAnimationPartAsset(createAnimationPartAssetInput());
    await repository.writePartAsset(existing, new Blob(["old"], { type: "image/png" }));
    const project = await seedProject(repository, {
      parts: [{ assetId: existing.assetId }]
    });
    renderProvider(repository, {
      now: () => NOW,
      createPartAssetId: () => "part_head_south_import_001",
      createImageBlobId: () => "blob_head_south_import_001"
    });
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });

    await act(async () => {
      expect(
        await context.loadPartAssets([existing.assetId, "part_missing_001" as typeof existing.assetId])
      ).toMatchObject({
        status: "ok",
        value: {
          assets: [{ assetId: existing.assetId }],
          missingAssetIds: ["part_missing_001"]
        }
      });
    });

    const originalBlob = new Blob(["new"], { type: "image/png" });
    await act(async () => {
      expect(
        await context.importPartAsset({
          originalBlob,
          label: "Neuer Kopf Süd",
          slot: "head",
          direction: "south",
          sourceSize: { width: 32, height: 40 },
          trimRect: { x: 2, y: 3, width: 28, height: 36 },
          replacedAssetId: existing.assetId
        })
      ).toMatchObject({
        status: "ok",
        value: {
          partAsset: {
            assetId: "part_head_south_import_001",
            anchorStatus: "anchorsPending"
          },
          replacedAssetId: existing.assetId
        }
      });
    });

    expect(context.activeProject?.parts).toEqual([
      { assetId: "part_head_south_import_001" }
    ]);
    expect(context.activeProject?.updatedAt).toBe(NOW);
    expect(context.projectDirty).toBe(false);
    expect(context.saveStatus).toBe("saved");
    expect(await repository.readBlob("blob_head_south_import_001")).toEqual({
      status: "ok",
      value: originalBlob
    });
    expect(await repository.readPartAsset(existing.assetId)).toMatchObject({ status: "ok" });
  });

  it("does not mutate provider state when the import transaction fails", async () => {
    const repository = new MemoryAnimationRepository({
      beforeCommit(operation) {
        if (operation === "writePartAssetToProject") throw new Error("Import write failed");
      }
    });
    const project = await seedProject(repository, { parts: [] });
    renderProvider(repository, {
      now: () => NOW,
      createPartAssetId: () => "part_failed_import_001",
      createImageBlobId: () => "blob_failed_import_001"
    });
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });

    await act(async () => {
      expect(
        await context.importPartAsset({
          originalBlob: new Blob(["failed"], { type: "image/png" }),
          label: "Fehlgeschlagener Kopf",
          slot: "head",
          direction: "south",
          sourceSize: { width: 4, height: 4 },
          trimRect: { x: 0, y: 0, width: 4, height: 4 }
        })
      ).toMatchObject({ status: "failed", message: "Import write failed" });
    });

    expect(context.activeProject).toEqual(project);
    expect(context.projectDirty).toBe(false);
    expect(await repository.readPartAsset("part_failed_import_001")).toMatchObject({ status: "notFound" });
    expect(await repository.readBlob("blob_failed_import_001")).toMatchObject({ status: "notFound" });
  });

  it("loads the immutable source and resumes atomic anchor plus delta setup", async () => {
    const repository = new MemoryAnimationRepository();
    const draft = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        slot: "arm.left.upper",
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const sourceBlob = new Blob(["source"], { type: "image/png" });
    await repository.writePartAsset(draft, sourceBlob);
    const project = await seedProject(repository, {
      parts: [{ assetId: draft.assetId, layerOffset: -2 }]
    });
    renderProvider(repository, { now: () => NOW });
    await expectListReady();
    await act(async () => {
      await context.openProject(project.projectId);
    });

    await act(async () => {
      expect(await context.loadPartImageBlob(draft.blobId)).toEqual({
        status: "ok",
        value: sourceBlob
      });
      expect(
        await context.configurePartAsset({
          assetId: draft.assetId,
          anchors: { proximal: { x: 8, y: 8 } },
          transformDelta: {
            offsetX: 2,
            offsetY: -1,
            rotationDelta: 0.1,
            scaleMultiplier: 1.1
          }
        })
      ).toMatchObject({
        status: "ok",
        value: { partAsset: { anchorStatus: "invalidAnchors" } }
      });
    });
    expect(context.activeProject?.parts[0]?.transformDelta).toEqual({
      offsetX: 2,
      offsetY: -1,
      rotationDelta: 0.1,
      scaleMultiplier: 1.1
    });
    expect(context.activeProject?.parts[0]?.layerOffset).toBe(-2);

    await act(async () => {
      expect(
        await context.configurePartAsset({
          assetId: draft.assetId,
          anchors: {
            proximal: { x: 8, y: 8 },
            distal: { x: 10, y: 30 }
          },
          transformDelta: {
            offsetX: 2,
            offsetY: -1,
            rotationDelta: 0.1,
            scaleMultiplier: 1.1
          }
        })
      ).toMatchObject({
        status: "ok",
        value: { partAsset: { anchorStatus: "ready" } }
      });
    });
    expect(await repository.readPartAsset(draft.assetId)).toMatchObject({
      status: "ok",
      value: {
        anchorStatus: "ready",
        anchors: {
          proximal: { x: 8, y: 8 },
          distal: { x: 10, y: 30 }
        }
      }
    });
    expect(await repository.readBlob(draft.blobId)).toEqual({
      status: "ok",
      value: sourceBlob
    });
  });
});
