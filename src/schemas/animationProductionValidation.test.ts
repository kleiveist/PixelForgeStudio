import { describe, expect, it } from "vitest";
import {
  DIRECTION_IDS,
  REQUIRED_PART_SLOT_IDS,
  type Direction,
  type DirectionSourceMode,
  type RequiredPartSlot
} from "../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  validateAnimationProjectProductionSources,
  type AnimationPartAsset
} from "./index";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../test/animationSchemaFixtures";

function requiredAssetsForDirections(
  directions: readonly Direction[]
): readonly AnimationPartAsset[] {
  return directions.flatMap((direction, directionIndex) =>
    REQUIRED_PART_SLOT_IDS.map((slot, slotIndex) =>
      parseAnimationPartAsset(
        createAnimationPartAssetInput({
          assetId: `part_${directionIndex}_${slotIndex}`,
          blobId: `blob_${directionIndex}_${slotIndex}`,
          label: `${slot} ${direction}`,
          slot,
          direction,
          anchors: {
            proximal: { x: 8, y: 6 },
            distal: { x: 10, y: 30 }
          }
        })
      )
    )
  );
}

function projectForAssets(
  mode: DirectionSourceMode,
  assets: readonly AnimationPartAsset[]
) {
  return parseAnimationProject(
    createAnimationProjectInput({
      directionSourceMode: mode,
      parts: assets.map(({ assetId }) => ({ assetId })),
      clips: [],
      overrides: []
    })
  );
}

describe("animation production source validation", () => {
  it.each([
    ["singleDirectionPrototype", 15],
    ["fiveAuthoredPlusMirror", 75],
    ["eightAuthored", 120]
  ] as const)(
    "keeps an empty %s draft schema-valid but reports %i missing sources",
    (mode, issueCount) => {
      const project = projectForAssets(mode, []);
      const issues = validateAnimationProjectProductionSources(project, []);

      expect(issues).toHaveLength(issueCount);
      expect(
        issues.every((issue) => issue.code === "missingRequiredSource")
      ).toBe(true);
      expect(Object.isFrozen(issues)).toBe(true);
    }
  );

  it("accepts a complete single-direction required part set", () => {
    const assets = requiredAssetsForDirections(["south"]);
    const issues = validateAnimationProjectProductionSources(
      projectForAssets("singleDirectionPrototype", assets),
      assets
    );

    expect(issues).toEqual([]);
  });

  it("keeps a saved incomplete limb out of production readiness", () => {
    const assets = requiredAssetsForDirections(["south"]);
    const armIndex = assets.findIndex(
      (asset) => asset.slot === "arm.left.upper"
    );
    const arm = assets[armIndex];
    if (!arm) throw new Error("Expected left upper arm fixture.");

    const incompleteArm = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: arm.assetId,
        blobId: arm.blobId,
        label: arm.label,
        slot: arm.slot,
        direction: arm.direction,
        anchorStatus: "invalidAnchors",
        anchors: { proximal: arm.anchors!.proximal }
      })
    );
    const incompleteAssets = assets.map((asset, index) =>
      index === armIndex ? incompleteArm : asset
    );
    const issues = validateAnimationProjectProductionSources(
      projectForAssets("singleDirectionPrototype", incompleteAssets),
      incompleteAssets
    );

    expect(issues).toEqual([
      {
        code: "invalidAnchors",
        assetId: arm.assetId,
        slot: "arm.left.upper",
        direction: "south"
      }
    ]);
  });

  it("reports project assignments whose PartAsset metadata is unavailable", () => {
    const project = parseAnimationProject(
      createAnimationProjectInput({
        directionSourceMode: "singleDirectionPrototype",
        parts: [{ assetId: "part_missing_001" }],
        clips: [],
        overrides: []
      })
    );
    const issues = validateAnimationProjectProductionSources(project, []);

    expect(issues[0]).toEqual({
      code: "missingPartAsset",
      assetId: "part_missing_001"
    });
    expect(
      issues.filter((issue) => issue.code === "missingRequiredSource")
    ).toHaveLength(15);
  });

  it("keeps an imported anchor-pending source visible as a production blocker", () => {
    const pending = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const project = projectForAssets("singleDirectionPrototype", [pending]);

    expect(validateAnimationProjectProductionSources(project, [pending])).toContainEqual({
      code: "anchorsPending",
      assetId: pending.assetId,
      slot: "head",
      direction: "south"
    });
  });

  it("uses canonical direction order for full authored validation", () => {
    const project = projectForAssets("eightAuthored", []);
    const issues = validateAnimationProjectProductionSources(project, []);
    const firstMissingByDirection = issues
      .filter((issue) => issue.code === "missingRequiredSource")
      .filter((issue) => issue.slot === ("head" satisfies RequiredPartSlot))
      .map((issue) => issue.direction);

    expect(firstMissingByDirection).toEqual(DIRECTION_IDS);
  });
});
