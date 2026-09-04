import { describe, expect, it } from "vitest";
import {
  AnimationPartAssetSchema,
  MAX_ANIMATION_NAME_LENGTH,
  MAX_ANIMATION_SOURCE_DIMENSION,
  parseAnimationPartAsset
} from "./index";
import { createAnimationPartAssetInput } from "../test/animationSchemaFixtures";

describe("AnimationPartAssetSchema", () => {
  it("parses a complete metadata object without embedding image bytes", () => {
    const parsed = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        label: "  Linker Unterarm Süd  ",
        slot: "arm.left.lower",
        attachmentJointId: "wrist.left",
        anchors: {
          proximal: { x: 8, y: 6 },
          distal: { x: 10, y: 30 },
          pivot: { x: 8, y: 6 }
        }
      })
    );

    expect(parsed.label).toBe("Linker Unterarm Süd");
    expect(parsed.blobId).toBe("blob_head_south_001");
    expect("blob" in parsed).toBe(false);
    expect("imageData" in parsed).toBe(false);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.anchors)).toBe(true);
    expect(parsed.anchorStatus).toBe("ready");
  });

  it("accepts explicit pending anchors without inventing source coordinates", () => {
    const parsed = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );

    expect(parsed.anchorStatus).toBe("anchorsPending");
    expect(parsed.anchors).toBeUndefined();
    expect(
      AnimationPartAssetSchema.safeParse(
        createAnimationPartAssetInput({ anchors: undefined })
      ).success
    ).toBe(false);
    expect(
      AnimationPartAssetSchema.safeParse(
        createAnimationPartAssetInput({ anchorStatus: "anchorsPending" })
      ).success
    ).toBe(false);
  });

  it("persists invalid limb anchors for resume but never marks them ready", () => {
    const invalidDraft = createAnimationPartAssetInput({
      slot: "arm.left.upper",
      anchorStatus: "invalidAnchors",
      anchors: { proximal: { x: 8, y: 6 } }
    });
    expect(AnimationPartAssetSchema.safeParse(invalidDraft).success).toBe(true);
    expect(
      AnimationPartAssetSchema.safeParse({
        ...invalidDraft,
        anchorStatus: "ready"
      }).success
    ).toBe(false);
  });

  it.each([
    ["schemaVersion", { schemaVersion: 2 }],
    ["kind", { kind: "partAsset" }],
    ["direction", { direction: "south-east" }],
    ["slot", { slot: "arm.visual.left" }],
    ["mirrorPolicy", { mirrorPolicy: "automatic" }]
  ])("rejects an invalid %s contract value", (_field, override) => {
    expect(
      AnimationPartAssetSchema.safeParse(
        { ...createAnimationPartAssetInput(), ...override }
      ).success
    ).toBe(false);
  });

  it("rejects unknown keys and attempted inline image payloads", () => {
    const input = {
      ...createAnimationPartAssetInput(),
      imageData: "data:image/png;base64,not-allowed"
    };

    expect(AnimationPartAssetSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    ["proximal", { proximal: { x: 32, y: 4 } }],
    [
      "distal",
      { proximal: { x: 4, y: 4 }, distal: { x: -0.01, y: 8 } }
    ],
    [
      "pivot",
      { proximal: { x: 4, y: 4 }, pivot: { x: 8, y: 40 } }
    ]
  ])("rejects an out-of-bounds %s source anchor", (_anchor, anchors) => {
    const result = AnimationPartAssetSchema.safeParse(
      createAnimationPartAssetInput({ anchors })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "anchors")).toBe(
        true
      );
    }
  });

  it("rejects trim rectangles that leave the original source image", () => {
    const widthResult = AnimationPartAssetSchema.safeParse(
      createAnimationPartAssetInput({
        trimRect: { x: 20, y: 3, width: 13, height: 36 }
      })
    );
    const heightResult = AnimationPartAssetSchema.safeParse(
      createAnimationPartAssetInput({
        trimRect: { x: 2, y: 20, width: 28, height: 21 }
      })
    );

    expect(widthResult.success).toBe(false);
    expect(heightResult.success).toBe(false);
  });

  it("accepts documented source and label boundaries and rejects overflow", () => {
    expect(
      AnimationPartAssetSchema.safeParse(
        createAnimationPartAssetInput({
          label: "a".repeat(MAX_ANIMATION_NAME_LENGTH),
          sourceSize: {
            width: MAX_ANIMATION_SOURCE_DIMENSION,
            height: MAX_ANIMATION_SOURCE_DIMENSION
          }
        })
      ).success
    ).toBe(true);
    expect(
      AnimationPartAssetSchema.safeParse(
        createAnimationPartAssetInput({
          label: "a".repeat(MAX_ANIMATION_NAME_LENGTH + 1)
        })
      ).success
    ).toBe(false);
    expect(
      AnimationPartAssetSchema.safeParse(
        createAnimationPartAssetInput({
          sourceSize: {
            width: MAX_ANIMATION_SOURCE_DIMENSION + 1,
            height: 40
          }
        })
      ).success
    ).toBe(false);
  });

  it("parses data arriving through an unknown import boundary", () => {
    const imported: unknown = createAnimationPartAssetInput();
    expect(parseAnimationPartAsset(imported).assetId).toBe(
      "part_head_south_001"
    );
  });
});
