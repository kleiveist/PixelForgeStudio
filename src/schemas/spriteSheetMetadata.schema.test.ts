import { describe, expect, it } from "vitest";
import { DIRECTION_IDS, resolveSpriteSheetLayout } from "../domain/animation";
import {
  SpriteSheetMetadataSchema,
  parseSpriteSheetMetadata
} from "./spriteSheetMetadata.schema";

function metadataInput() {
  const layout = resolveSpriteSheetLayout({
    frameSize: { width: 128, height: 128 },
    frameCount: 8
  });
  return {
    application: "PixelForge Animation Studio",
    formatVersion: 1,
    kind: "spriteSheetMetadata",
    projectId: "project_guard_001",
    projectName: "Waldwächter",
    clipId: "clip_walk_001",
    action: "walk",
    fps: 10,
    loop: true,
    frameWidth: 128,
    frameHeight: 128,
    sheetWidth: 1024,
    sheetHeight: 1024,
    columns: 8,
    rows: 8,
    margin: 0,
    spacing: 0,
    footAnchor: { x: 64, y: 112 },
    directions: DIRECTION_IDS,
    animations: DIRECTION_IDS.map((direction, row) => ({
      name: `walk_${direction}`,
      direction,
      frames: layout.cells
        .filter((cell) => cell.row === row)
        .map(({ frameIndex: index, x, y, width, height }) => ({
          index,
          x,
          y,
          width,
          height
        }))
    }))
  };
}

describe("SpriteSheetMetadataSchema", () => {
  it("accepts and freezes all 64 canonical V1 frame regions", () => {
    const parsed = parseSpriteSheetMetadata(metadataInput());
    expect(parsed.animations.flatMap(({ frames }) => frames)).toHaveLength(64);
    expect(parsed.animations[7]?.frames[7]).toEqual({
      index: 7,
      x: 896,
      y: 896,
      width: 128,
      height: 128
    });
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it("rejects reordered directions, incorrect regions and unknown fields", () => {
    const input = metadataInput();
    expect(
      SpriteSheetMetadataSchema.safeParse({
        ...input,
        directions: [...DIRECTION_IDS].reverse()
      }).success
    ).toBe(false);
    const animations = input.animations.map((animation) => ({
      ...animation,
      frames: animation.frames.map((frame) => ({ ...frame }))
    }));
    animations[0]!.frames[0]!.x = 1;
    expect(
      SpriteSheetMetadataSchema.safeParse({ ...input, animations }).success
    ).toBe(false);
    expect(
      SpriteSheetMetadataSchema.safeParse({ ...input, absolutePath: "/tmp" }).success
    ).toBe(false);
  });
});
