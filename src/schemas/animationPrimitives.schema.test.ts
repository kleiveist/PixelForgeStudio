import { describe, expect, it } from "vitest";
import {
  ANIMATION_FORMAT_VERSION,
  ANIMATION_SCHEMA_VERSION,
  AnimationApplicationSchema,
  AnimationDirectionSchema,
  AnimationDirectionSourceModeSchema,
  AnimationFrameProfileSchema,
  AnimationJointIdSchema,
  AnimationMirrorPolicySchema,
  AnimationPartSlotSchema,
  AnimationSchemaVersionSchema,
  AnimationSourceAnchorsSchema,
  ExportBundleSchema,
  FinitePixelCoordinateSchema,
  MAX_ANIMATION_SOURCE_DIMENSION,
  PositivePixelDimensionSchema,
  SchemaVersionSchema,
  V2_SCHEMA_VERSION
} from "./index";

describe("animation schema V1 primitives", () => {
  it("owns a protocol version independent from Prompt Studio V2", () => {
    expect(ANIMATION_SCHEMA_VERSION).toBe(1);
    expect(ANIMATION_FORMAT_VERSION).toBe(1);
    expect(AnimationSchemaVersionSchema.parse(1)).toBe(1);
    expect(AnimationApplicationSchema.parse("PixelForge Animation Studio")).toBe(
      "PixelForge Animation Studio"
    );
    expect(AnimationSchemaVersionSchema.safeParse(2).success).toBe(false);

    expect(V2_SCHEMA_VERSION).toBe(2);
    expect(SchemaVersionSchema.parse(2)).toBe(2);
    expect(
      ExportBundleSchema.safeParse({
        schemaVersion: 2,
        formatVersion: 2,
        kind: "exportBundle",
        application: "PixelForge Prompt Studio",
        bundleId: "bundle_prompt_v2_regression",
        exportedAt: "2026-09-04T12:00:00.000Z",
        baseProfiles: [],
        categoryProfiles: [],
        assetProfiles: [],
        wizardDrafts: []
      }).success
    ).toBe(true);
  });

  it("accepts only finite numeric pixel coordinates without coercion", () => {
    expect(FinitePixelCoordinateSchema.parse(-12.5)).toBe(-12.5);
    expect(FinitePixelCoordinateSchema.safeParse(Number.NaN).success).toBe(
      false
    );
    expect(
      FinitePixelCoordinateSchema.safeParse(Number.POSITIVE_INFINITY).success
    ).toBe(false);
    expect(FinitePixelCoordinateSchema.safeParse("12").success).toBe(false);
  });

  it("bounds positive integer dimensions at the documented source limit", () => {
    expect(PositivePixelDimensionSchema.parse(1)).toBe(1);
    expect(
      PositivePixelDimensionSchema.parse(MAX_ANIMATION_SOURCE_DIMENSION)
    ).toBe(MAX_ANIMATION_SOURCE_DIMENSION);
    expect(PositivePixelDimensionSchema.safeParse(0).success).toBe(false);
    expect(
      PositivePixelDimensionSchema.safeParse(
        MAX_ANIMATION_SOURCE_DIMENSION + 1
      ).success
    ).toBe(false);
    expect(PositivePixelDimensionSchema.safeParse(32.5).success).toBe(false);
  });

  it("validates and freezes the canonical frame profile shape", () => {
    const parsed = AnimationFrameProfileSchema.parse({
      frameSize: { width: 128, height: 128 },
      characterHeight: 80,
      footAnchor: { x: 64, y: 112 }
    });

    expect(parsed).toEqual({
      frameSize: { width: 128, height: 128 },
      characterHeight: 80,
      footAnchor: { x: 64, y: 112 }
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.frameSize)).toBe(true);
    expect(Object.isFrozen(parsed.footAnchor)).toBe(true);

    expect(
      AnimationFrameProfileSchema.safeParse({
        frameSize: { width: 128, height: 128 },
        characterHeight: 129,
        footAnchor: { x: 64, y: 112 }
      }).success
    ).toBe(false);
    expect(
      AnimationFrameProfileSchema.safeParse({
        frameSize: { width: 128, height: 128 },
        characterHeight: 80,
        footAnchor: { x: 128, y: 112 }
      }).success
    ).toBe(false);
  });

  it("uses the domain catalogs as strict enum sources", () => {
    expect(AnimationDirectionSchema.parse("southEast")).toBe("southEast");
    expect(AnimationDirectionSchema.safeParse("south-east").success).toBe(
      false
    );
    expect(
      AnimationDirectionSourceModeSchema.parse("fiveAuthoredPlusMirror")
    ).toBe("fiveAuthoredPlusMirror");
    expect(AnimationPartSlotSchema.parse("arm.left.upper")).toBe(
      "arm.left.upper"
    );
    expect(AnimationPartSlotSchema.safeParse("leftArm").success).toBe(false);
    expect(AnimationJointIdSchema.parse("shoulder.left")).toBe(
      "shoulder.left"
    );
    expect(AnimationMirrorPolicySchema.parse("forbid")).toBe("forbid");
  });

  it("keeps source-anchor objects strict and readonly", () => {
    const parsed = AnimationSourceAnchorsSchema.parse({
      proximal: { x: 2.5, y: 3.5 },
      distal: { x: 7, y: 9 },
      pivot: { x: 4, y: 4 }
    });

    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.proximal)).toBe(true);
    expect(
      AnimationSourceAnchorsSchema.safeParse({
        proximal: { x: 2, y: 3 },
        guessed: { x: 4, y: 5 }
      }).success
    ).toBe(false);
  });
});
