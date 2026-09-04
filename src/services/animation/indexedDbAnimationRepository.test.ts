import { IDBFactory as FakeIDBFactory } from "fake-indexeddb";
import { Blob as NodeBlob } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  ANIMATION_FIXTURE_TIMESTAMP,
  createAnimationPartAssetInput,
  createAnimationProjectInput,
  createCharacterKitInput
} from "../../test/animationSchemaFixtures";
import {
  ANIMATION_DATABASE_INDEXES,
  ANIMATION_DATABASE_NAME,
  ANIMATION_DATABASE_STORES,
  ANIMATION_DATABASE_VERSION,
  IndexedDbAnimationRepository,
  createBrowserAnimationRepository
} from "./indexedDbAnimationRepository";

const LATER_TIMESTAMP = "2026-09-04T13:00:00.000Z";

function createFactory(): IDBFactory {
  return new FakeIDBFactory();
}

function pngBlob(content: string): Blob {
  return new NodeBlob([content], { type: "image/png" }) as Blob;
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(
      ANIMATION_DATABASE_NAME,
      ANIMATION_DATABASE_VERSION
    );
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionFinished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

describe("createBrowserAnimationRepository", () => {
  it("returns unavailable instead of throwing when IndexedDB is missing", async () => {
    await expect(createBrowserAnimationRepository(null)).resolves.toEqual({
      status: "unavailable",
      reason: "indexedDbUnavailable",
      message: "IndexedDB is unavailable in this browser."
    });
  });

  it("encapsulates database-open errors as unavailable results", async () => {
    const throwingFactory = {
      open() {
        throw new Error("open denied");
      }
    } as unknown as IDBFactory;

    await expect(createBrowserAnimationRepository(throwingFactory)).resolves.toEqual({
      status: "unavailable",
      reason: "databaseOpen",
      message: "open denied"
    });
  });
});

describe("IndexedDbAnimationRepository", () => {
  it("creates the additive version-1 stores, key paths and indexes", async () => {
    const factory = createFactory();
    const repository = new IndexedDbAnimationRepository(factory);
    expect(await repository.initialize()).toEqual({ status: "ok" });

    const database = await openDatabase(factory);
    expect(database.name).toBe("pixelforge-studio");
    expect(database.version).toBe(1);
    expect([...database.objectStoreNames]).toHaveLength(5);
    expect([...database.objectStoreNames]).toEqual(
      expect.arrayContaining(Object.values(ANIMATION_DATABASE_STORES))
    );

    const transaction = database.transaction(
      Object.values(ANIMATION_DATABASE_STORES),
      "readonly"
    );
    const projects = transaction.objectStore(ANIMATION_DATABASE_STORES.projects);
    const parts = transaction.objectStore(ANIMATION_DATABASE_STORES.partAssets);
    const imageBlobs = transaction.objectStore(
      ANIMATION_DATABASE_STORES.imageBlobs
    );
    const kits = transaction.objectStore(ANIMATION_DATABASE_STORES.kits);
    const previews = transaction.objectStore(ANIMATION_DATABASE_STORES.previews);

    expect(projects.keyPath).toBe("projectId");
    expect(parts.keyPath).toBe("assetId");
    expect(imageBlobs.keyPath).toBe("blobId");
    expect(kits.keyPath).toBe("kitId");
    expect(previews.keyPath).toBe("previewId");
    expect(projects.indexNames.contains(ANIMATION_DATABASE_INDEXES.projectUpdatedAt)).toBe(
      true
    );
    expect(parts.indexNames.contains(ANIMATION_DATABASE_INDEXES.partSlot)).toBe(
      true
    );
    expect(
      parts.indexNames.contains(ANIMATION_DATABASE_INDEXES.partDirection)
    ).toBe(true);
    expect(kits.indexNames.contains(ANIMATION_DATABASE_INDEXES.kitUpdatedAt)).toBe(
      true
    );

    database.close();
    await repository.close();
  });

  it("validates project metadata and supports create, read, write, duplicate, list and delete", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const project = createAnimationProjectInput();

    expect(
      await repository.createProject({ ...project, directionSourceMode: "invalid" })
    ).toMatchObject({ status: "invalid", reason: "schemaValidation" });
    expect(await repository.listProjects()).toEqual({ status: "ok", value: [] });

    expect(await repository.createProject(project)).toEqual({ status: "ok" });
    expect(await repository.createProject(project)).toMatchObject({
      status: "conflict",
      entity: "project"
    });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { name: project.name }
    });

    const updatedProject = {
      ...project,
      name: "IndexedDB Waldwächter",
      updatedAt: LATER_TIMESTAMP
    };
    expect(await repository.writeProject(updatedProject)).toEqual({ status: "ok" });
    const duplicate = await repository.duplicateProject({
      sourceProjectId: project.projectId,
      newProjectId: "project_indexeddb_copy_001",
      name: "IndexedDB Waldwächter Kopie",
      timestamp: "2026-09-04T14:00:00.000Z"
    });
    expect(duplicate).toMatchObject({
      status: "ok",
      value: {
        projectId: "project_indexeddb_copy_001",
        parts: project.parts,
        previewBlobId: project.previewBlobId
      }
    });

    const summaries = await repository.listProjectSummaries();
    expect(summaries.status).toBe("ok");
    if (summaries.status === "ok") {
      expect(summaries.value.map(({ projectId }) => projectId)).toEqual([
        "project_indexeddb_copy_001",
        project.projectId
      ]);
      expect(summaries.value[0]).not.toHaveProperty("parts");
    }

    expect(await repository.deleteProject(project.projectId)).toEqual({
      status: "ok"
    });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "notFound"
    });
    await repository.close();
  });

  it("commits part metadata and its Blob atomically and rolls back a failed replacement", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const originalPart = createAnimationPartAssetInput();
    const originalBlob = pngBlob("original part pixels");

    expect(await repository.writePartAsset(originalPart, originalBlob)).toEqual({
      status: "ok"
    });
    expect(await repository.readPartAsset(originalPart.assetId)).toMatchObject({
      status: "ok",
      value: { label: originalPart.label }
    });
    expect(await repository.readBlob(originalPart.blobId)).toMatchObject({
      status: "ok",
      value: { size: originalBlob.size, type: "image/png" }
    });

    const failed = await repository.writePartAsset(
      createAnimationPartAssetInput({
        label: "Must roll back",
        updatedAt: LATER_TIMESTAMP
      }),
      (() => undefined) as unknown as Blob
    );
    expect(failed).toMatchObject({ status: "failed", reason: "transaction" });
    expect(await repository.readPartAsset(originalPart.assetId)).toMatchObject({
      status: "ok",
      value: {
        label: originalPart.label,
        updatedAt: ANIMATION_FIXTURE_TIMESTAMP
      }
    });
    expect(await repository.readBlob(originalPart.blobId)).toMatchObject({
      status: "ok",
      value: { size: originalBlob.size, type: "image/png" }
    });
    await repository.close();
  });

  it("atomically writes an imported PartAsset, original Blob and replacement assignment", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const oldPart = createAnimationPartAssetInput();
    const oldBlob = pngBlob("old pixels");
    const project = createAnimationProjectInput({ parts: [{ assetId: oldPart.assetId }] });
    await repository.writePartAsset(oldPart, oldBlob);
    await repository.createProject(project);

    const importedPart = createAnimationPartAssetInput({
      assetId: "part_head_south_imported_001",
      blobId: "blob_head_south_imported_001",
      label: "Neuer Kopf Süd",
      anchorStatus: "anchorsPending",
      anchors: undefined,
      createdAt: LATER_TIMESTAMP,
      updatedAt: LATER_TIMESTAMP
    });
    const updatedProject = {
      ...project,
      parts: [{ assetId: importedPart.assetId }],
      updatedAt: LATER_TIMESTAMP
    };

    const failed = await repository.writePartAssetToProject(
      { project: updatedProject, partAsset: importedPart, replacedAssetId: oldPart.assetId },
      (() => undefined) as unknown as Blob
    );
    expect(failed).toMatchObject({ status: "failed", reason: "transaction" });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { parts: [{ assetId: oldPart.assetId }] }
    });
    expect(await repository.readPartAsset(importedPart.assetId)).toMatchObject({ status: "notFound" });
    expect(await repository.readBlob(importedPart.blobId)).toMatchObject({ status: "notFound" });

    expect(
      await repository.writePartAssetToProject(
        { project: updatedProject, partAsset: importedPart, replacedAssetId: oldPart.assetId },
        pngBlob("new pixels")
      )
    ).toMatchObject({ status: "ok", value: { replacedAssetId: oldPart.assetId } });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { parts: [{ assetId: importedPart.assetId }] }
    });
    expect(await repository.readPartAsset(oldPart.assetId)).toMatchObject({ status: "ok" });
    expect(await repository.readBlob(oldPart.blobId)).toMatchObject({
      status: "ok",
      value: { size: oldBlob.size }
    });
    await repository.close();
  });

  it("persists configured anchors and project delta without rewriting the source blob", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const draft = createAnimationPartAssetInput({
      anchorStatus: "anchorsPending",
      anchors: undefined
    });
    const project = createAnimationProjectInput({ parts: [{ assetId: draft.assetId }] });
    const blob = pngBlob("immutable source pixels");
    await repository.writePartAsset(draft, blob);
    await repository.createProject(project);

    const configured = {
      ...draft,
      anchorStatus: "ready" as const,
      anchors: { proximal: { x: 16, y: 30 } },
      updatedAt: LATER_TIMESTAMP
    };
    const updatedProject = {
      ...project,
      parts: [
        {
          assetId: draft.assetId,
          transformDelta: {
            offsetX: 1,
            offsetY: 2,
            rotationDelta: 0.2,
            scaleMultiplier: 0.9
          }
        }
      ],
      updatedAt: LATER_TIMESTAMP
    };
    expect(
      await repository.writePartSetupToProject({
        project: updatedProject,
        partAsset: configured
      })
    ).toMatchObject({ status: "ok" });
    expect(await repository.readPartAsset(draft.assetId)).toMatchObject({
      status: "ok",
      value: { anchorStatus: "ready", anchors: configured.anchors }
    });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { parts: [{ transformDelta: updatedProject.parts[0]?.transformDelta }] }
    });
    expect(await repository.readBlob(draft.blobId)).toMatchObject({
      status: "ok",
      value: { size: blob.size, type: "image/png" }
    });
    await repository.close();
  });

  it("keeps shared binaries on project deletion and removes only explicit garbage", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const part = createAnimationPartAssetInput();
    const project = createAnimationProjectInput();
    const kit = createCharacterKitInput();
    const partBlob = pngBlob("shared part pixels");
    const previewBlob = pngBlob("shared preview pixels");

    await repository.writePartAsset(part, partBlob);
    await repository.writeBlob("blob_orphan_indexeddb_001", pngBlob("orphan"));
    await repository.writePreview(project.previewBlobId, previewBlob);
    await repository.writePreview(
      "preview_orphan_indexeddb_001",
      pngBlob("orphan preview")
    );
    await repository.createProject(project);
    await repository.writeKit(kit);

    expect(await repository.deleteProject(project.projectId)).toEqual({
      status: "ok"
    });
    expect(await repository.readBlob(part.blobId)).toMatchObject({ status: "ok" });
    expect(await repository.readPreview(project.previewBlobId)).toMatchObject({
      status: "ok"
    });

    expect(await repository.collectGarbage()).toEqual({
      status: "ok",
      value: {
        removedImageBlobIds: ["blob_orphan_indexeddb_001"],
        removedPreviewIds: ["preview_orphan_indexeddb_001"]
      }
    });
    expect(await repository.readBlob(part.blobId)).toMatchObject({ status: "ok" });
    expect(await repository.readPreview(project.previewBlobId)).toMatchObject({
      status: "ok"
    });
    await repository.close();
  });

  it("supports Character Kit and standalone preview reads and writes", async () => {
    const repository = new IndexedDbAnimationRepository(createFactory());
    const olderKit = createCharacterKitInput({
      kitId: "kit_older_001",
      name: "Older Kit",
      updatedAt: ANIMATION_FIXTURE_TIMESTAMP
    });
    const newerKit = createCharacterKitInput({
      kitId: "kit_newer_001",
      name: "Newer Kit",
      updatedAt: LATER_TIMESTAMP
    });
    const preview = pngBlob("kit preview");

    expect(await repository.writeKit(olderKit)).toEqual({ status: "ok" });
    expect(await repository.writeKit(newerKit)).toEqual({ status: "ok" });
    expect(await repository.writePreview(newerKit.previewBlobId, preview)).toEqual({
      status: "ok"
    });
    expect(await repository.readPreview(newerKit.previewBlobId)).toMatchObject({
      status: "ok",
      value: { size: preview.size }
    });
    const kits = await repository.listKits();
    expect(kits.status).toBe("ok");
    if (kits.status === "ok") {
      expect(kits.value.map(({ kitId }) => kitId)).toEqual([
        newerKit.kitId,
        olderKit.kitId
      ]);
    }
    expect(await repository.deleteKit(newerKit.kitId)).toEqual({ status: "ok" });
    expect(await repository.readKit(newerKit.kitId)).toMatchObject({
      status: "notFound"
    });
    expect(await repository.readPreview(newerKit.previewBlobId)).toMatchObject({
      status: "ok"
    });
    await repository.close();
  });

  it("fails garbage collection closed when stored metadata is schema-invalid", async () => {
    const factory = createFactory();
    const repository = new IndexedDbAnimationRepository(factory);
    expect(await repository.initialize()).toEqual({ status: "ok" });
    const database = await openDatabase(factory);
    const transaction = database.transaction(
      [
        ANIMATION_DATABASE_STORES.projects,
        ANIMATION_DATABASE_STORES.imageBlobs
      ],
      "readwrite"
    );
    const completion = transactionFinished(transaction);
    transaction.objectStore(ANIMATION_DATABASE_STORES.projects).put({
      ...createAnimationProjectInput({ projectId: "project_corrupt_001" }),
      name: ""
    });
    transaction.objectStore(ANIMATION_DATABASE_STORES.imageBlobs).put({
      blobId: "blob_must_survive_failed_gc_001",
      blob: pngBlob("must survive")
    });
    await completion;
    database.close();

    expect(await repository.collectGarbage()).toMatchObject({
      status: "invalid",
      reason: "schemaValidation"
    });
    expect(
      await repository.readBlob("blob_must_survive_failed_gc_001")
    ).toMatchObject({ status: "ok" });
    await repository.close();
  });
});
