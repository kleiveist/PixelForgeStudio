import { describe, expect, it } from "vitest";
import {
  DIRECTION_IDS,
  composeSpriteSheet,
  createAnimationFrameFileName,
  normalizeAnimationExportBaseName,
  resolveSpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "./index";

function solidFrame(
  direction: (typeof DIRECTION_IDS)[number],
  frameIndex: number,
  width = 2,
  height = 2
): SpriteSheetSourceFrame {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels.set([frameIndex, DIRECTION_IDS.indexOf(direction), 200, 255], offset);
  }
  return { direction, frameIndex, frame: { width, height, pixels } };
}

describe("sprite sheet domain", () => {
  it("resolves the canonical 8x8 1024px layout and all 64 rects", () => {
    const layout = resolveSpriteSheetLayout({
      frameSize: { width: 128, height: 128 },
      directions: [...DIRECTION_IDS].reverse(),
      frameCount: 8
    });

    expect(layout).toMatchObject({
      rows: 8,
      columns: 8,
      capacity: 64,
      sheetWidth: 1024,
      sheetHeight: 1024,
      margin: 0,
      spacing: 0
    });
    expect(layout.directions).toEqual(DIRECTION_IDS);
    expect(layout.cells).toHaveLength(64);
    expect(layout.cells[0]).toMatchObject({
      direction: "south",
      frameIndex: 0,
      x: 0,
      y: 0,
      width: 128,
      height: 128
    });
    expect(layout.cells[63]).toMatchObject({
      direction: "southWest",
      frameIndex: 7,
      x: 896,
      y: 896
    });
  });

  it("accounts for margin/spacing and preserves transparent gaps", () => {
    const layout = resolveSpriteSheetLayout({
      frameSize: { width: 2, height: 2 },
      directions: ["south", "east"],
      frameCount: 2,
      margin: 1,
      spacing: 1
    });
    const sheet = composeSpriteSheet(layout, [
      solidFrame("south", 0),
      solidFrame("south", 1),
      solidFrame("east", 0),
      solidFrame("east", 1)
    ]);

    expect(sheet).toMatchObject({ width: 7, height: 7 });
    const pixel = (x: number, y: number) =>
      [...sheet.pixels.slice((y * sheet.width + x) * 4, (y * sheet.width + x) * 4 + 4)];
    expect(pixel(1, 1)).toEqual([0, 0, 200, 255]);
    expect(pixel(4, 1)).toEqual([1, 0, 200, 255]);
    expect(pixel(1, 4)).toEqual([0, 2, 200, 255]);
    expect(pixel(0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(3, 2)).toEqual([0, 0, 0, 0]);
  });

  it("rejects missing, duplicate, malformed, and wrong-sized frames", () => {
    const layout = resolveSpriteSheetLayout({
      frameSize: { width: 2, height: 2 },
      directions: ["south"],
      frameCount: 2
    });
    expect(() => composeSpriteSheet(layout, [solidFrame("south", 0)])).toThrow(
      /exactly 2/
    );
    expect(() =>
      composeSpriteSheet(layout, [solidFrame("south", 0), solidFrame("south", 0)])
    ).toThrow(/Duplicate/);
    expect(() =>
      composeSpriteSheet(layout, [solidFrame("south", 0), solidFrame("south", 1, 1, 2)])
    ).toThrow(/must be 2x2/);
  });

  it("creates stable frame and normalized project file names", () => {
    expect(createAnimationFrameFileName("southWest", 7)).toBe(
      "walk_southWest_07.png"
    );
    expect(normalizeAnimationExportBaseName("Kleif Wäche!", "project-1")).toBe(
      "kleif-wache"
    );
    expect(normalizeAnimationExportBaseName("🔥", "project_guard_001")).toBe(
      "project_guard_001"
    );
  });
});
