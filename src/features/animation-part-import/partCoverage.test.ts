import { describe, expect, it } from "vitest";
import { parseAnimationPartAsset, parseAnimationProject } from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import { createPartCoverageMatrix } from "./partCoverage";

describe("part direction coverage", () => {
  it("builds all eight columns and distinguishes source, anchor and optional states", () => {
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

    expect(matrix.directions).toHaveLength(8);
    expect(matrix.rows.find(({ slot }) => slot === "head")?.cells[0]?.status).toBe("authoredSource");
    expect(matrix.rows.find(({ slot }) => slot === "torso")?.cells[0]?.status).toBe("anchorsIncomplete");
    expect(matrix.rows.find(({ slot }) => slot === "arm.left.upper")?.cells[0]?.status).toBe("missingSource");
    expect(matrix.rows.find(({ slot }) => slot === "hair.back")?.cells[0]?.status).toBe("optionalUnused");

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
    ).toBe("anchorsIncomplete");
  });
});
