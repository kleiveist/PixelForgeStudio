import { describe, expect, it } from "vitest";
import { DIRECTION_IDS, resolveSpriteSheetLayout } from "../../domain/animation";
import {
  parseAnimationProject,
  StableIdSchema,
  type AnimationClip
} from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import {
  canRunAnimationExport,
  createSpriteSheetMetadata,
  validateAnimationExport
} from "./animationExport";

function frames(alpha = 0) {
  return DIRECTION_IDS.flatMap((direction) =>
    Array.from({ length: 8 }, (_, frameIndex) => {
      const pixels = new Uint8ClampedArray(128 * 128 * 4);
      pixels[3] = alpha;
      return { direction, frameIndex, frame: { width: 128, height: 128, pixels } };
    })
  );
}

describe("animation export contracts", () => {
  const project = parseAnimationProject(
    createAnimationProjectInput({
      clips: [{
        clipId: "clip_walk_001",
        templateId: "walk-humanoid-8-v1",
        action: "walk",
        frameCount: 8,
        fps: 10,
        loop: true
      }]
    })
  );
  const clip = project.clips[0] as AnimationClip;

  it("creates exact canonical metadata from the pure layout", () => {
    const metadata = createSpriteSheetMetadata({
      project,
      clip,
      layout: resolveSpriteSheetLayout({ frameSize: project.frameProfile.frameSize })
    });
    expect(metadata.animations).toHaveLength(8);
    expect(metadata.animations.flatMap(({ frames }) => frames)).toHaveLength(64);
    expect(metadata.directions).toEqual(DIRECTION_IDS);
  });

  it("blocks hard errors and requires explicit confirmation for warnings", () => {
    const hard = validateAnimationExport({
      project,
      clip,
      frames: frames().slice(1),
      missingBlobIds: [StableIdSchema.parse("blob_missing")]
    });
    expect(hard.hardErrors.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["missingFrame", "invalidBlobReference"])
    );
    expect(canRunAnimationExport(hard, true)).toBe(false);

    const warning = validateAnimationExport({
      project,
      clip,
      frames: frames(255)
    });
    expect(warning.hardErrors).toHaveLength(0);
    expect(warning.warnings.some(({ code }) => code === "opaqueOuterEdge")).toBe(true);
    expect(canRunAnimationExport(warning, false)).toBe(false);
    expect(canRunAnimationExport(warning, true)).toBe(true);
  });

  it("never labels a retained four-direction requirement as an eight-direction export", () => {
    const fourDirectionProject = parseAnimationProject({
      ...createAnimationProjectInput({ sourcePrompt: undefined }),
      directionRequirement: 4
    });
    const result = validateAnimationExport({
      project: fourDirectionProject,
      clip: fourDirectionProject.clips[0] ?? null,
      frames: frames()
    });
    expect(result.hardErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "directionRequirementMismatch" })
      ])
    );
  });
});
