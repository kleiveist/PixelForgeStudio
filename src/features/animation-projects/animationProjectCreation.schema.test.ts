import { describe, expect, it } from "vitest";
import {
  AnimationProjectCreationSchema,
  DEFAULT_ANIMATION_PROJECT_CREATION_VALUES,
  toCreateAnimationProjectDefinition
} from "./animationProjectCreation.schema";

describe("AnimationProjectCreationSchema", () => {
  it("maps the documented humanoid project defaults", () => {
    const values = AnimationProjectCreationSchema.parse({
      ...DEFAULT_ANIMATION_PROJECT_CREATION_VALUES,
      name: "  Waldläufer Walk  "
    });

    expect(toCreateAnimationProjectDefinition(values)).toEqual({
      name: "Waldläufer Walk",
      frameProfile: {
        frameSize: { width: 128, height: 128 },
        characterHeight: 80,
        footAnchor: { x: 64, y: 112 }
      },
      directionSourceMode: "fiveAuthoredPlusMirror",
      walk: { enabled: true, frameCount: 8, fps: 10 }
    });
  });

  it("rejects an empty name and invalid frame relationships", () => {
    const parsed = AnimationProjectCreationSchema.safeParse({
      ...DEFAULT_ANIMATION_PROJECT_CREATION_VALUES,
      name: "   ",
      frameWidth: 0,
      frameHeight: 64,
      characterHeight: 80,
      footAnchorX: 64,
      footAnchorY: 64
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining([
        "name",
        "frameWidth",
        "characterHeight",
        "footAnchorX",
        "footAnchorY"
      ])
    );
  });

  it("keeps Walk at exactly eight frames and validates FPS", () => {
    expect(
      AnimationProjectCreationSchema.safeParse({
        ...DEFAULT_ANIMATION_PROJECT_CREATION_VALUES,
        name: "Test",
        walkFrameCount: 7,
        walkFps: 0
      }).success
    ).toBe(false);
  });
});
