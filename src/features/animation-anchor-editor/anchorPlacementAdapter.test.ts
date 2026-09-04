import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  type RigTemplate
} from "../../domain/animation";
import { parseAnimationPartAsset } from "../../schemas";
import { createAnimationPartAssetInput } from "../../test/animationSchemaFixtures";
import { resolvePartPlacementForDisplay } from "./anchorPlacementAdapter";

describe("part placement display adapter", () => {
  it("recomputes on direction changes while retaining original source anchors", () => {
    const asset = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        slot: "arm.left.upper",
        sourceSize: { width: 32, height: 32 },
        trimRect: { x: 2, y: 2, width: 28, height: 28 },
        anchors: {
          proximal: { x: 10, y: 8 },
          distal: { x: 10, y: 24 }
        }
      })
    );
    const south = resolvePartPlacementForDisplay(
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      asset
    );
    const east = resolvePartPlacementForDisplay(
      HUMANOID_80_RIG_TEMPLATE,
      "east",
      asset
    );

    expect(south.status).toBe("ok");
    expect(east.status).toBe("ok");
    if (south.status !== "ok" || east.status !== "ok") return;
    expect(south.placement.transform).not.toEqual(east.placement.transform);
    expect(asset.anchors).toEqual({
      proximal: { x: 10, y: 8 },
      distal: { x: 10, y: 24 }
    });

    const shiftedTemplate: RigTemplate = {
      ...HUMANOID_80_RIG_TEMPLATE,
      directions: HUMANOID_80_RIG_TEMPLATE.directions.map((directionRig) =>
        directionRig.direction === "south"
          ? {
              ...directionRig,
              joints: {
                ...directionRig.joints,
                "shoulder.left": {
                  ...directionRig.joints["shoulder.left"],
                  position: {
                    x: directionRig.joints["shoulder.left"].position.x + 4,
                    y: directionRig.joints["shoulder.left"].position.y
                  }
                }
              }
            }
          : directionRig
      )
    };
    const shifted = resolvePartPlacementForDisplay(
      shiftedTemplate,
      "south",
      asset
    );
    expect(shifted.status).toBe("ok");
    if (shifted.status === "ok") {
      expect(shifted.placement.transform).not.toEqual(
        south.placement.transform
      );
    }
    expect(asset.anchors).toEqual({
      proximal: { x: 10, y: 8 },
      distal: { x: 10, y: 24 }
    });
  });
});
