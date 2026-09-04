import { describe, expect, it } from "vitest";
import {
  AnimationClipsSchema,
  AnimationProjectSchema,
  DirectionFrameOverrideSchema,
  DirectionFrameOverridesSchema,
  MAX_ANIMATION_CLIPS_PER_PROJECT,
  MAX_ANIMATION_NAME_LENGTH,
  MAX_ANIMATION_OVERRIDES_PER_PROJECT,
  MAX_ANIMATION_PARTS_PER_PROJECT,
  ProjectPartAssignmentsSchema,
  parseAnimationProject
} from "./index";
import { createAnimationProjectInput } from "../test/animationSchemaFixtures";

const transformDelta = {
  offsetX: 1,
  offsetY: -1,
  rotationDelta: 0.1,
  scaleMultiplier: 1
} as const;

function frameOverrideInput() {
  return {
    clipId: "clip_walk_001",
    direction: "south" as const,
    frameIndex: 0,
    rootDelta: transformDelta
  };
}

function clipInput(index: number) {
  return {
    clipId: `clip_walk_${index}`,
    templateId: "walk-8-v1",
    action: "walk" as const,
    frameCount: 8,
    fps: 10,
    loop: true
  };
}

describe("AnimationProjectSchema", () => {
  it("parses and freezes a complete animation project", () => {
    const imported: unknown = createAnimationProjectInput();
    const parsed = parseAnimationProject(imported);

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      kind: "animationProject",
      projectId: "project_guard_walk_001",
      rigTemplateId: "humanoid-80-v1",
      directionSourceMode: "fiveAuthoredPlusMirror"
    });
    expect(parsed.clips[0]).toMatchObject({
      action: "walk",
      frameCount: 8,
      fps: 10,
      loop: true
    });
    expect(parsed.sourcePrompt).toEqual({
      assetProfileId: "asset_guard_001",
      compatibilityKey: "prompt-profile-compatibility-key"
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.parts)).toBe(true);
    expect(Object.isFrozen(parsed.clips[0])).toBe(true);
    expect(Object.isFrozen(parsed.overrides[0]?.partDeltas)).toBe(true);
  });

  it("accepts a minimal draft without parts, clips, overrides, or references", () => {
    const parsed = parseAnimationProject({
      schemaVersion: 1,
      kind: "animationProject",
      projectId: "project_minimal_001",
      name: "Unvollständiger Entwurf",
      createdAt: "2026-09-04T12:00:00.000Z",
      updatedAt: "2026-09-04T12:00:00.000Z",
      rigTemplateId: "humanoid-80-v1",
      frameProfile: {
        frameSize: { width: 128, height: 128 },
        characterHeight: 80,
        footAnchor: { x: 64, y: 112 }
      },
      directionSourceMode: "singleDirectionPrototype",
      parts: [],
      clips: [],
      overrides: []
    });

    expect(parsed.parts).toEqual([]);
    expect(parsed.clips).toEqual([]);
    expect(parsed.overrides).toEqual([]);
    expect("sourcePrompt" in parsed).toBe(false);
    expect("previewBlobId" in parsed).toBe(false);
  });

  it.each([
    ["schema version", { schemaVersion: 2 }],
    ["kind", { kind: "promptProject" }],
    ["rig", { rigTemplateId: "unknown-rig" }],
    ["source mode", { directionSourceMode: "automatic" }]
  ])("rejects an invalid %s", (_label, override) => {
    expect(
      AnimationProjectSchema.safeParse({
        ...createAnimationProjectInput(),
        ...override
      }).success
    ).toBe(false);
  });

  it("rejects unknown project keys instead of silently stripping them", () => {
    expect(
      AnimationProjectSchema.safeParse({
        ...createAnimationProjectInput(),
        schemaVersionV2: 2
      }).success
    ).toBe(false);
  });

  it("rejects duplicate part and clip IDs", () => {
    const duplicatePart = { assetId: "part_head_south_001" };
    const duplicateClip = clipInput(1);

    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({ parts: [duplicatePart, duplicatePart] })
      ).success
    ).toBe(false);
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          clips: [duplicateClip, duplicateClip],
          overrides: []
        })
      ).success
    ).toBe(false);
  });

  it("requires exactly eight frames for a V1 walk clip", () => {
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          clips: [{ ...clipInput(1), frameCount: 7 }],
          overrides: []
        })
      ).success
    ).toBe(false);
  });

  it("accepts overrides only for existing clips and valid frame indexes", () => {
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          overrides: [
            {
              ...frameOverrideInput(),
              clipId: "clip_missing_001"
            }
          ]
        })
      ).success
    ).toBe(false);
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          overrides: [{ ...frameOverrideInput(), frameIndex: 8 }]
        })
      ).success
    ).toBe(false);
    expect(
      AnimationProjectSchema.safeParse(
        {
          ...createAnimationProjectInput(),
          overrides: [
            {
              ...frameOverrideInput(),
              direction: "south-east"
            }
          ]
        }
      ).success
    ).toBe(false);
  });

  it("rejects duplicate targets and malformed or empty override payloads", () => {
    const valid = frameOverrideInput();
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({ overrides: [valid, valid] })
      ).success
    ).toBe(false);
    expect(
      DirectionFrameOverrideSchema.safeParse({
        clipId: "clip_walk_001",
        direction: "south",
        frameIndex: 0
      }).success
    ).toBe(false);
    expect(
      DirectionFrameOverrideSchema.safeParse({
        ...valid,
        jointDeltas: { kneecap: transformDelta }
      }).success
    ).toBe(false);
    expect(
      DirectionFrameOverrideSchema.safeParse({
        ...valid,
        layerOrderOverride: ["head", "head"]
      }).success
    ).toBe(false);
  });

  it("enforces documented text and collection limits at their boundaries", () => {
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          name: "a".repeat(MAX_ANIMATION_NAME_LENGTH)
        })
      ).success
    ).toBe(true);
    expect(
      AnimationProjectSchema.safeParse(
        createAnimationProjectInput({
          name: "a".repeat(MAX_ANIMATION_NAME_LENGTH + 1)
        })
      ).success
    ).toBe(false);

    const maxParts = Array.from(
      { length: MAX_ANIMATION_PARTS_PER_PROJECT },
      (_, index) => ({ assetId: `part_${index}` })
    );
    expect(ProjectPartAssignmentsSchema.safeParse(maxParts).success).toBe(true);
    expect(
      ProjectPartAssignmentsSchema.safeParse([
        ...maxParts,
        { assetId: "part_overflow" }
      ]).success
    ).toBe(false);

    const maxClips = Array.from(
      { length: MAX_ANIMATION_CLIPS_PER_PROJECT },
      (_, index) => clipInput(index)
    );
    expect(AnimationClipsSchema.safeParse(maxClips).success).toBe(true);
    expect(
      AnimationClipsSchema.safeParse([
        ...maxClips,
        clipInput(MAX_ANIMATION_CLIPS_PER_PROJECT)
      ]).success
    ).toBe(false);

    const maxOverrides = Array.from(
      { length: MAX_ANIMATION_OVERRIDES_PER_PROJECT },
      frameOverrideInput
    );
    expect(DirectionFrameOverridesSchema.safeParse(maxOverrides).success).toBe(
      true
    );
    expect(
      DirectionFrameOverridesSchema.safeParse([
        ...maxOverrides,
        frameOverrideInput()
      ]).success
    ).toBe(false);
  });
});
