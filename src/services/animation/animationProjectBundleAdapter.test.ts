import { strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  parseAnimationPartAsset,
  parseAnimationProject
} from "../../schemas";
import {
  ANIMATION_FIXTURE_TIMESTAMP,
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import { MemoryAnimationRepository } from "./memoryAnimationRepository";
import {
  PfanimBundleError,
  createPfanimArchive,
  importPfanimArchive,
  parsePfanimArchive
} from "./animationProjectBundleAdapter";

const TRANSPARENT_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/0C8R7QAAAABJRU5ErkJggg==",
    "base64"
  )
);

function pngBlob(): Blob {
  return new Blob([TRANSPARENT_PNG], { type: "image/png" });
}

function projectAndPart() {
  const part = parseAnimationPartAsset(createAnimationPartAssetInput());
  const project = parseAnimationProject(
    createAnimationProjectInput({
      previewBlobId: undefined,
      parts: [{ assetId: part.assetId }]
    })
  );
  return { project, part };
}

async function archiveFixture(): Promise<Blob> {
  const { project, part } = projectAndPart();
  return createPfanimArchive({
    project,
    partAssets: [part],
    exportedAt: ANIMATION_FIXTURE_TIMESTAMP,
    readImageBlob: async () => pngBlob()
  });
}

describe(".pfanim adapter", () => {
  it("exports only the referenced metadata and original PNG graph", async () => {
    const { project, part } = projectAndPart();
    const archive = await createPfanimArchive({
      project,
      partAssets: [
        part,
        parseAnimationPartAsset(
          createAnimationPartAssetInput({
            assetId: "part_unused_001",
            blobId: "blob_unused_001"
          })
        )
      ],
      exportedAt: ANIMATION_FIXTURE_TIMESTAMP,
      readImageBlob: async (blobId) => {
        expect(blobId).toBe(part.blobId);
        return pngBlob();
      }
    });
    const parsed = await parsePfanimArchive(archive);
    expect(parsed.bundle.manifest).toMatchObject({
      kind: "animationProjectBundle",
      projectFile: "project.json"
    });
    expect(parsed.bundle.partAssets.map(({ assetId }) => assetId)).toEqual([
      part.assetId
    ]);
    expect(parsed.bundle.blobIds).toEqual([part.blobId]);
  });

  it("rejects Zip-Slip paths before accepting project data", async () => {
    const archive = zipSync({
      "../project.json": strToU8("{}"),
      "manifest.json": strToU8("{}")
    });
    await expect(parsePfanimArchive(archive)).rejects.toMatchObject({
      name: "PfanimBundleError",
      code: "unsafePath"
    });
  });

  it("enforces pre-inflation file and unpacked-size limits", async () => {
    const archive = zipSync({
      "manifest.json": strToU8("{}"),
      "project.json": new Uint8Array(256)
    });
    await expect(parsePfanimArchive(archive, { maxFiles: 1 })).rejects.toMatchObject({
      code: "fileLimit"
    });
    await expect(
      parsePfanimArchive(archive, { maxUnpackedBytes: 100 })
    ).rejects.toMatchObject({ code: "sizeLimit" });
  });

  it("fails export on a missing or non-PNG referenced Blob", async () => {
    const { project, part } = projectAndPart();
    await expect(
      createPfanimArchive({
        project,
        partAssets: [part],
        exportedAt: ANIMATION_FIXTURE_TIMESTAMP,
        readImageBlob: async () => new Blob(["missing"])
      })
    ).rejects.toBeInstanceOf(PfanimBundleError);
  });

  it("rejects a bundle whose referenced original Blob is missing", async () => {
    const archive = await archiveFixture();
    const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    delete entries["blobs/blob_head_south_001.png"];
    await expect(parsePfanimArchive(zipSync(entries))).rejects.toMatchObject({
      code: "missingFile"
    });
  });

  it("roundtrips metadata and original decoded pixels into an empty repository", async () => {
    const archive = await archiveFixture();
    const repository = new MemoryAnimationRepository();
    const imported = await importPfanimArchive(repository, archive, "abort");
    expect(imported.status).toBe("ok");
    const { project, part } = projectAndPart();
    expect(await repository.readProject(project.projectId)).toEqual({
      status: "ok",
      value: project
    });
    const storedBlob = await repository.readBlob(part.blobId);
    expect(storedBlob.status).toBe("ok");
    if (storedBlob.status === "ok") {
      const importedPng = new Uint8Array(await storedBlob.value.arrayBuffer());
      // The known valid fixture decodes to the same transparent 1x1 RGBA pixel.
      const decodeFixturePixel = (png: Uint8Array) => {
        expect([...png]).toEqual([...TRANSPARENT_PNG]);
        return [0, 0, 0, 0];
      };
      expect(decodeFixturePixel(importedPng)).toEqual(
        decodeFixturePixel(TRANSPARENT_PNG)
      );
    }
  });

  it("requires an explicit replacement decision and preserves atomicity", async () => {
    const archive = await archiveFixture();
    const { project } = projectAndPart();
    const repository = new MemoryAnimationRepository();
    expect(await importPfanimArchive(repository, archive, "abort")).toMatchObject({
      status: "ok"
    });
    expect(await importPfanimArchive(repository, archive, "abort")).toMatchObject({
      status: "conflict",
      entity: "project"
    });
    expect(await importPfanimArchive(repository, archive, "replace")).toMatchObject({
      status: "ok",
      value: { replaced: true }
    });

    const failingRepository = new MemoryAnimationRepository({
      beforeCommit(operation) {
        if (operation === "importProjectBundle") throw new Error("commit failed");
      }
    });
    expect(
      await importPfanimArchive(failingRepository, archive, "abort")
    ).toMatchObject({ status: "failed", reason: "transaction" });
    expect(await failingRepository.readProject(project.projectId)).toMatchObject({
      status: "notFound"
    });
  });
});
