import { describe, expect, it } from "vitest";
import { parseAnimationPartAsset, parseAnimationProject } from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import { createPartCoverageMatrix } from "./partCoverage";

describe("part direction coverage", () => {
  it("distinguishes ready, invalid, missing and anchor-pending sources", () => {
    const ready = parseAnimationPartAsset(createAnimationPartAssetInput());
    const pending = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: "part_torso_south_001",
        blobId: "blob_torso_south_001",
        slot: "torso",
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const project = parseAnimationProject(
      createAnimationProjectInput({
        directionSourceMode: "singleDirectionPrototype",
        parts: [{ assetId: ready.assetId }, { assetId: pending.assetId }],
        clips: [],
        overrides: []
      })
    );
    const matrix = createPartCoverageMatrix(project, [ready, pending]);

    expect(matrix.directions).toEqual(["south"]);
    expect(matrix.rows.find(({ slot }) => slot === "head")?.cells[0]?.status).toBe("ready");
    expect(matrix.rows.find(({ slot }) => slot === "torso")?.cells[0]?.status).toBe("anchorsPending");
    expect(matrix.rows.find(({ slot }) => slot === "arm.left.upper")?.cells[0]?.status).toBe("missing");
    expect(matrix.rows.find(({ slot }) => slot === "hair.back")?.cells[0]?.status).toBe("missing");

    const invalid = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: "part_arm_south_001",
        blobId: "blob_arm_south_001",
        slot: "arm.left.upper",
        anchorStatus: "invalidAnchors",
        anchors: { proximal: { x: 8, y: 8 } }
      })
    );
    const invalidProject = parseAnimationProject(
      createAnimationProjectInput({
        directionSourceMode: "singleDirectionPrototype",
        parts: [{ assetId: invalid.assetId }],
        clips: [],
        overrides: []
      })
    );
    expect(
      createPartCoverageMatrix(invalidProject, [invalid]).rows.find(
        ({ slot }) => slot === "arm.left.upper"
      )?.cells[0]?.status
    ).toBe("invalidAnchors");
  });
});
