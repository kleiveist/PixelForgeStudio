import { describe, expect, it } from "vitest";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  parseCharacterKit
} from "../../schemas";
import {
  ANIMATION_FIXTURE_TIMESTAMP,
  createAnimationPartAssetInput,
  createAnimationProjectInput,
  createCharacterKitInput
} from "../../test/animationSchemaFixtures";
import { analyzeAnimationBinaryReferences } from "./animationReferenceAnalysis";
import { MemoryAnimationRepository } from "./memoryAnimationRepository";

const LATER_TIMESTAMP = "2026-09-04T13:00:00.000Z";

function pngBlob(content: string): Blob {
  return new Blob([content], { type: "image/png" });
}

describe("MemoryAnimationRepository", () => {
  it("supports complete project CRUD with structured not-found and conflict results", async () => {
    const repository = new MemoryAnimationRepository();
    const project = createAnimationProjectInput();

    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "notFound",
      entity: "project"
    });
    expect(await repository.createProject(project)).toEqual({ status: "ok" });
    expect(await repository.createProject(project)).toMatchObject({
      status: "conflict",
      entity: "project"
    });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { name: project.name }
    });

    const updated = {
      ...project,
      name: "Waldwächter Walk – überarbeitet",
      updatedAt: LATER_TIMESTAMP
    };
    expect(await repository.writeProject(updated)).toEqual({ status: "ok" });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { name: updated.name, updatedAt: LATER_TIMESTAMP }
    });

    expect(await repository.deleteProject(project.projectId)).toEqual({
      status: "ok"
    });
    expect(await repository.deleteProject(project.projectId)).toMatchObject({
      status: "notFound",
      entity: "project"
    });
  });

  it("writes and reads part metadata plus its image blob as one operation", async () => {
    const repository = new MemoryAnimationRepository();
    const part = createAnimationPartAssetInput();
    const blob = pngBlob("part pixels");

    expect(await repository.writePartAsset(part, blob)).toEqual({ status: "ok" });
    expect(await repository.readPartAsset(part.assetId)).toMatchObject({
      status: "ok",
      value: { assetId: part.assetId, blobId: part.blobId }
    });
    expect(await repository.readBlob(part.blobId)).toEqual({
      status: "ok",
      value: blob
    });

    expect(await repository.deletePartAsset(part.assetId)).toEqual({ status: "ok" });
    expect(await repository.readPartAsset(part.assetId)).toMatchObject({
      status: "notFound"
    });
    expect(await repository.readBlob(part.blobId)).toEqual({
      status: "ok",
      value: blob
    });
  });

  it("supports preview and Character Kit CRUD without placing binaries in metadata", async () => {
    const repository = new MemoryAnimationRepository();
    const kit = createCharacterKitInput();
    const preview = pngBlob("preview pixels");

    expect(await repository.writePreview(kit.previewBlobId, preview)).toEqual({
      status: "ok"
    });
    expect(await repository.writeKit(kit)).toEqual({ status: "ok" });
    expect(await repository.readPreview(kit.previewBlobId)).toEqual({
      status: "ok",
      value: preview
    });
    expect(await repository.readKit(kit.kitId)).toMatchObject({
      status: "ok",
      value: { name: kit.name, previewBlobId: kit.previewBlobId }
    });
    expect(await repository.listKits()).toMatchObject({
      status: "ok",
      value: [{ kitId: kit.kitId }]
    });
    expect(await repository.deleteKit(kit.kitId)).toEqual({ status: "ok" });
    expect(await repository.readPreview(kit.previewBlobId)).toEqual({
      status: "ok",
      value: preview
    });
  });

  it("validates project metadata before writing and preserves the previous value", async () => {
    const repository = new MemoryAnimationRepository();
    const validProject = createAnimationProjectInput();
    await repository.createProject(validProject);

    const invalidResult = await repository.writeProject({
      ...validProject,
      name: ""
    });
    expect(invalidResult).toMatchObject({
      status: "invalid",
      reason: "schemaValidation"
    });
    expect(await repository.readProject(validProject.projectId)).toMatchObject({
      status: "ok",
      value: { name: validProject.name }
    });
  });

  it("leaves both old part metadata and blob intact when a transaction fails", async () => {
    let failPartCommit = false;
    const repository = new MemoryAnimationRepository({
      beforeCommit(operation) {
        if (operation === "writePartAsset" && failPartCommit) {
          throw new Error("simulated transaction failure");
        }
      }
    });
    const originalPart = createAnimationPartAssetInput();
    const originalBlob = pngBlob("original pixels");
    await repository.writePartAsset(originalPart, originalBlob);

    failPartCommit = true;
    const failed = await repository.writePartAsset(
      createAnimationPartAssetInput({
        label: "Should not persist",
        updatedAt: LATER_TIMESTAMP
      }),
      pngBlob("replacement pixels")
    );

    expect(failed).toMatchObject({
      status: "failed",
      reason: "transaction"
    });
    expect(await repository.readPartAsset(originalPart.assetId)).toMatchObject({
      status: "ok",
      value: { label: originalPart.label, updatedAt: ANIMATION_FIXTURE_TIMESTAMP }
    });
    expect(await repository.readBlob(originalPart.blobId)).toEqual({
      status: "ok",
      value: originalBlob
    });
  });

  it("atomically assigns an imported part while preserving the replaced source", async () => {
    let failImport = false;
    const repository = new MemoryAnimationRepository({
      beforeCommit(operation) {
        if (operation === "writePartAssetToProject" && failImport) {
          throw new Error("simulated import failure");
        }
      }
    });
    const oldPart = createAnimationPartAssetInput();
    const oldBlob = pngBlob("old pixels");
    const project = createAnimationProjectInput({
      parts: [{ assetId: oldPart.assetId }]
    });
    await repository.writePartAsset(oldPart, oldBlob);
    await repository.createProject(project);

    const importedPart = createAnimationPartAssetInput({
      assetId: "part_head_south_imported_001",
      blobId: "blob_head_south_imported_001",
      label: "Neuer Kopf Süd",
      anchorStatus: "anchorsPending",
      anchors: undefined,
      updatedAt: LATER_TIMESTAMP,
      createdAt: LATER_TIMESTAMP
    });
    const updatedProject = {
      ...project,
      parts: [{ assetId: importedPart.assetId }],
      updatedAt: LATER_TIMESTAMP
    };

    failImport = true;
    expect(
      await repository.writePartAssetToProject(
        { project: updatedProject, partAsset: importedPart, replacedAssetId: oldPart.assetId },
        pngBlob("failed pixels")
      )
    ).toMatchObject({ status: "failed" });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { parts: [{ assetId: oldPart.assetId }] }
    });
    expect(await repository.readPartAsset(importedPart.assetId)).toMatchObject({ status: "notFound" });
    expect(await repository.readBlob(importedPart.blobId)).toMatchObject({ status: "notFound" });

    failImport = false;
    expect(
      await repository.writePartAssetToProject(
        { project: updatedProject, partAsset: importedPart, replacedAssetId: oldPart.assetId },
        pngBlob("new pixels")
      )
    ).toMatchObject({
      status: "ok",
      value: { partAsset: { anchorStatus: "anchorsPending" }, replacedAssetId: oldPart.assetId }
    });
    expect(await repository.readProject(project.projectId)).toMatchObject({
      status: "ok",
      value: { parts: [{ assetId: importedPart.assetId }], updatedAt: LATER_TIMESTAMP }
    });
    expect(await repository.readPartAsset(oldPart.assetId)).toMatchObject({ status: "ok" });
    expect(await repository.readBlob(oldPart.blobId)).toEqual({ status: "ok", value: oldBlob });
  });

  it("duplicates only project metadata and retains immutable shared references", async () => {
    const repository = new MemoryAnimationRepository();
    const source = createAnimationProjectInput();
    const part = createAnimationPartAssetInput();
    const blob = pngBlob("shared pixels");
    const preview = pngBlob("shared preview");
    await repository.writePartAsset(part, blob);
    await repository.writePreview(source.previewBlobId, preview);
    await repository.createProject(source);

    const duplicated = await repository.duplicateProject({
      sourceProjectId: source.projectId,
      newProjectId: "project_guard_walk_copy_001",
      name: "Waldwächter Walk Kopie",
      timestamp: LATER_TIMESTAMP
    });
    expect(duplicated).toMatchObject({
      status: "ok",
      value: {
        projectId: "project_guard_walk_copy_001",
        parts: source.parts,
        previewBlobId: source.previewBlobId
      }
    });

    expect(await repository.deleteProject(source.projectId)).toEqual({
      status: "ok"
    });
    expect(await repository.readBlob(part.blobId)).toEqual({
      status: "ok",
      value: blob
    });
    expect(await repository.readPreview(source.previewBlobId)).toEqual({
      status: "ok",
      value: preview
    });
  });

  it("returns narrow project summaries ordered by updatedAt and stable ID", async () => {
    const repository = new MemoryAnimationRepository();
    await repository.createProject(
      createAnimationProjectInput({
        projectId: "project_zeta_001",
        name: "Zeta",
        updatedAt: ANIMATION_FIXTURE_TIMESTAMP
      })
    );
    await repository.createProject(
      createAnimationProjectInput({
        projectId: "project_alpha_001",
        name: "Alpha",
        updatedAt: LATER_TIMESTAMP,
        parts: [],
        clips: [],
        overrides: [],
        previewBlobId: undefined
      })
    );
    await repository.createProject(
      createAnimationProjectInput({
        projectId: "project_beta_001",
        name: "Beta",
        updatedAt: LATER_TIMESTAMP
      })
    );

    const result = await repository.listProjectSummaries();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value.map((summary) => summary.projectId)).toEqual([
      "project_alpha_001",
      "project_beta_001",
      "project_zeta_001"
    ]);
    expect(result.value[0]).toEqual({
      projectId: "project_alpha_001",
      name: "Alpha",
      updatedAt: LATER_TIMESTAMP,
      rigTemplateId: "humanoid-80-v1",
      directionSourceMode: "fiveAuthoredPlusMirror",
      partCount: 0,
      clipCount: 0,
      hasPreview: false
    });
    expect(result.value[0]).not.toHaveProperty("parts");
    expect(result.value[0]).not.toHaveProperty("overrides");
  });

  it("garbage-collects only binary records with no metadata reference", async () => {
    const repository = new MemoryAnimationRepository();
    const part = createAnimationPartAssetInput();
    const project = createAnimationProjectInput();
    const kit = createCharacterKitInput();
    const referencedBlob = pngBlob("referenced part");
    const referencedPreview = pngBlob("referenced preview");
    await repository.writePartAsset(part, referencedBlob);
    await repository.writeBlob("blob_orphan_001", pngBlob("orphan"));
    await repository.writePreview(project.previewBlobId, referencedPreview);
    await repository.writePreview("preview_orphan_001", pngBlob("orphan preview"));
    await repository.createProject(project);
    await repository.writeKit(kit);

    expect(await repository.collectGarbage()).toEqual({
      status: "ok",
      value: {
        removedImageBlobIds: ["blob_orphan_001"],
        removedPreviewIds: ["preview_orphan_001"]
      }
    });
    expect(await repository.readBlob(part.blobId)).toEqual({
      status: "ok",
      value: referencedBlob
    });
    expect(await repository.readPreview(project.previewBlobId)).toEqual({
      status: "ok",
      value: referencedPreview
    });
    expect(await repository.readBlob("blob_orphan_001")).toMatchObject({
      status: "notFound"
    });
  });
});

describe("analyzeAnimationBinaryReferences", () => {
  it("is pure and keeps shared PartAsset and project/kit preview references", () => {
    const project = parseAnimationProject(createAnimationProjectInput());
    const part = parseAnimationPartAsset(createAnimationPartAssetInput());
    const kit = parseCharacterKit(createCharacterKitInput());
    const imageBlobIds = [
      part.blobId,
      parseAnimationPartAsset(
        createAnimationPartAssetInput({
          assetId: "part_orphan_001",
          blobId: "blob_orphan_001"
        })
      ).blobId
    ] as const;
    const previewIds = [
      project.previewBlobId,
      parseAnimationProject(
        createAnimationProjectInput({
          projectId: "project_orphan_preview_holder",
          previewBlobId: "preview_orphan_001"
        })
      ).previewBlobId
    ].filter((id): id is NonNullable<typeof id> => id !== undefined);
    const snapshot = {
      projects: [project],
      partAssets: [part],
      kits: [kit],
      imageBlobIds,
      previewIds
    };

    const result = analyzeAnimationBinaryReferences(snapshot);
    expect(result).toEqual({
      referencedImageBlobIds: [part.blobId],
      unreferencedImageBlobIds: ["blob_orphan_001"],
      referencedPreviewIds: [project.previewBlobId],
      unreferencedPreviewIds: ["preview_orphan_001"]
    });
    expect(snapshot.imageBlobIds).toEqual(imageBlobIds);
    expect(snapshot.previewIds).toEqual(previewIds);
  });
});
