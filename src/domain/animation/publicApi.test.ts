import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANIMATION_ACTION_IDS,
  DIRECTION_IDS,
  HUMANOID_80_FRAME_PROFILE,
  HUMANOID_80_RIG_TEMPLATE,
  HUMANOID_WALK_CLIP,
  HUMANOID_WALK_CLIP_ID,
  PART_SLOT_IDS,
  resolveHumanoidWalkPose,
  type AnimationActionId,
  type Direction,
  type FrameProfile,
  type MirrorPolicy,
  type PartSlot,
  type Point,
  type Rect,
  type RigTemplate,
  type RigTemplateId,
  type Size,
  type SourceAnchors,
  type Transform2D,
  type TransformDelta
} from "./index";

describe("animation domain public boundary", () => {
  it("exports standalone readonly contracts through the barrel", () => {
    const point: Point = { x: 3, y: 5 };
    const size: Size = { width: 16, height: 24 };
    const rect: Rect = { ...point, ...size };
    const frameProfile: FrameProfile = HUMANOID_80_FRAME_PROFILE;
    const anchors: SourceAnchors = {
      proximal: point,
      distal: { x: 3, y: 13 }
    };
    const transform: Transform2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const delta: TransformDelta = {
      offsetX: 1,
      offsetY: -1,
      rotationDelta: 0.25,
      scaleMultiplier: 1
    };
    const direction: Direction = DIRECTION_IDS[0];
    const slot: PartSlot = PART_SLOT_IDS[0];
    const mirrorPolicy: MirrorPolicy = "inherit";
    const rigTemplateId: RigTemplateId = "humanoid-80-v1";
    const rigTemplate: RigTemplate = HUMANOID_80_RIG_TEMPLATE;
    const action: AnimationActionId = ANIMATION_ACTION_IDS[0];

    expect({
      point,
      size,
      rect,
      frameProfile,
      anchors,
      transform,
      delta,
      direction,
      slot,
      mirrorPolicy,
      rigTemplateId,
      rigTemplate,
      action
    }).toMatchObject({
      direction: "south",
      slot: "head",
      mirrorPolicy: "inherit",
      rigTemplateId: "humanoid-80-v1",
      rigTemplate: expect.objectContaining({ id: "humanoid-80-v1" }),
      action: "walk"
    });
    expect(HUMANOID_WALK_CLIP.templateId).toBe(HUMANOID_WALK_CLIP_ID);
    expect(resolveHumanoidWalkPose(0).phase).toBe("contactLeft");
  });

  it("does not depend on frameworks, persistence, canvas, or browser globals", () => {
    const domainDirectory = resolve(process.cwd(), "src/domain/animation");
    const productionFiles = readdirSync(domainDirectory).filter(
      (fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts")
    );

    for (const fileName of productionFiles) {
      const source = readFileSync(resolve(domainDirectory, fileName), "utf8");
      expect(source, fileName).not.toMatch(
        /(?:from|import)\s*(?:\([^)]*\)\s*)?["'](?:react|zod|react-dom)["']/
      );
      expect(source, fileName).not.toMatch(
        /\b(?:window|document|localStorage|indexedDB|CanvasRenderingContext2D)\b/
      );
    }
  });
});
