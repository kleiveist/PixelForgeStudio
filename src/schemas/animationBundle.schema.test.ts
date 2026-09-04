import { describe, expect, it } from "vitest";
import {
  ANIMATION_FORMAT_VERSION,
  AnimationProjectBundleManifestSchema,
  AnimationProjectBundleSchema,
  MAX_ANIMATION_BUNDLE_FILES,
  parseAnimationProjectBundle,
  parseAnimationProjectBundleManifest
} from "./index";
import {
  createAnimationPartAssetInput,
  createAnimationProjectBundleInput,
  createAnimationProjectInput
} from "../test/animationSchemaFixtures";

describe("AnimationProjectBundleManifestSchema", () => {
  it("parses the stable .pfanim V1 manifest", () => {
    const imported: unknown = {
      application: "PixelForge Animation Studio",
      formatVersion: ANIMATION_FORMAT_VERSION,
      kind: "animationProjectBundle",
      exportedAt: "2026-09-04T12:00:00.000Z",
      projectFile: "project.json"
    };
    const parsed = parseAnimationProjectBundleManifest(imported);

    expect(parsed).toEqual(imported);
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it.each([
    ["application", { application: "PixelForge Prompt Studio" }],
    ["format version", { formatVersion: 2 }],
    ["kind", { kind: "exportBundle" }],
    ["project path", { projectFile: "../project.json" }]
  ])("rejects an invalid %s", (_label, override) => {
    expect(
      AnimationProjectBundleManifestSchema.safeParse({
        ...createAnimationProjectBundleInput().manifest,
        ...override
      }).success
    ).toBe(false);
  });

  it("rejects unknown manifest fields", () => {
    expect(
      AnimationProjectBundleManifestSchema.safeParse({
        ...createAnimationProjectBundleInput().manifest,
        schemaVersion: 1
      }).success
    ).toBe(false);
  });
});

describe("AnimationProjectBundleSchema", () => {
  it("parses and freezes a complete metadata/reference graph", () => {
    const imported: unknown = createAnimationProjectBundleInput();
    const parsed = parseAnimationProjectBundle(imported);

    expect(parsed.project.projectId).toBe("project_guard_walk_001");
    expect(parsed.partAssets.map(({ assetId }) => assetId)).toEqual([
      "part_head_south_001"
    ]);
    expect(parsed.blobIds).toEqual([
      "blob_head_south_001",
      "preview_guard_walk_001"
    ]);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.partAssets)).toBe(true);
    expect(Object.isFrozen(parsed.blobIds)).toBe(true);
  });

  it("rejects a project reference with no bundled PartAsset", () => {
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({
          project: createAnimationProjectInput({
            parts: [{ assetId: "part_missing_001" }]
          })
        })
      ).success
    ).toBe(false);
  });

  it("rejects missing image and preview blob references", () => {
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({
          blobIds: ["preview_guard_walk_001"]
        })
      ).success
    ).toBe(false);
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({
          blobIds: ["blob_head_south_001"]
        })
      ).success
    ).toBe(false);
  });

  it("rejects duplicate PartAsset and blob IDs", () => {
    const part = createAnimationPartAssetInput();
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({ partAssets: [part, part] })
      ).success
    ).toBe(false);
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({
          blobIds: [
            "blob_head_south_001",
            "preview_guard_walk_001",
            "blob_head_south_001"
          ]
        })
      ).success
    ).toBe(false);
  });

  it("rejects inline Blob/Base64 fields at the strict graph boundary", () => {
    expect(
      AnimationProjectBundleSchema.safeParse({
        ...createAnimationProjectBundleInput(),
        blobs: {
          blob_head_south_001: "data:image/png;base64,not-allowed"
        }
      }).success
    ).toBe(false);
  });

  it("enforces the represented bundle-file count boundary", () => {
    const maximumBlobCountWithOnePart = MAX_ANIMATION_BUNDLE_FILES - 3;
    const atLimit = Array.from(
      { length: maximumBlobCountWithOnePart },
      (_, index) => {
        if (index === 0) return "blob_head_south_001";
        if (index === 1) return "preview_guard_walk_001";
        return `blob_extra_${index}`;
      }
    );

    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({ blobIds: atLimit })
      ).success
    ).toBe(true);
    expect(
      AnimationProjectBundleSchema.safeParse(
        createAnimationProjectBundleInput({
          blobIds: [...atLimit, "blob_file_overflow"]
        })
      ).success
    ).toBe(false);
  });

  it("rejects newer nested project or PartAsset schemas", () => {
    expect(
      AnimationProjectBundleSchema.safeParse(
        {
          ...createAnimationProjectBundleInput(),
          project: { ...createAnimationProjectInput(), schemaVersion: 2 }
        }
      ).success
    ).toBe(false);
    expect(
      AnimationProjectBundleSchema.safeParse(
        {
          ...createAnimationProjectBundleInput(),
          partAssets: [
            { ...createAnimationPartAssetInput(), schemaVersion: 2 }
          ]
        }
      ).success
    ).toBe(false);
  });
});
