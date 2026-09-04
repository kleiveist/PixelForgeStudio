import { describe, expect, it } from "vitest";
import { parseAnimationPartAsset, parseAnimationProject } from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import { createPartCoverageMatrix } from "./partCoverage";

describe("part direction coverage", () => {
  it("distinguishes authored, missing, optional and anchor-pending sources", () => {
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
    expect(matrix.rows.find(({ slot }) => slot === "head")?.cells[0]?.status).toBe("authoredSource");
    expect(matrix.rows.find(({ slot }) => slot === "torso")?.cells[0]?.status).toBe("anchorPending");
    expect(matrix.rows.find(({ slot }) => slot === "arm.left.upper")?.cells[0]?.status).toBe("missing");
    expect(matrix.rows.find(({ slot }) => slot === "hair.back")?.cells[0]?.status).toBe("optional");
  });
});
