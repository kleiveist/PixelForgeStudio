import { describe, expect, it } from "vitest";
import {
  cropRgba,
  findAlphaBounds,
  hasOpaqueOuterEdge,
  type RgbaImage
} from "./rgba";

function image(width: number, height: number, alphas: readonly number[]): RgbaImage {
  const pixels = new Uint8ClampedArray(width * height * 4);
  alphas.forEach((alpha, index) => {
    pixels[index * 4] = index + 1;
    pixels[index * 4 + 3] = alpha;
  });
  return { width, height, pixels };
}

describe("RGBA alpha bounds", () => {
  it("finds deterministic inclusive bounds above the default alpha threshold", () => {
    const source = image(4, 3, [
      0, 1, 0, 0,
      0, 2, 255, 0,
      0, 0, 3, 0
    ]);

    expect(findAlphaBounds(source)).toEqual({ x: 1, y: 1, width: 2, height: 2 });
    expect(findAlphaBounds(source, 2)).toEqual({ x: 2, y: 1, width: 1, height: 2 });
  });

  it("returns null for a fully transparent or threshold-hidden image", () => {
    expect(findAlphaBounds(image(2, 2, [0, 0, 0, 0]))).toBeNull();
    expect(findAlphaBounds(image(2, 1, [1, 1]))).toBeNull();
  });

  it("crops rows without changing the source pixels", () => {
    const source = image(3, 2, [0, 20, 0, 0, 30, 40]);
    const before = [...source.pixels];
    const cropped = cropRgba(source, { x: 1, y: 0, width: 2, height: 2 });

    expect(cropped).toMatchObject({ width: 2, height: 2 });
    expect([...cropped.pixels]).toEqual([
      2, 0, 0, 20,
      3, 0, 0, 0,
      5, 0, 0, 30,
      6, 0, 0, 40
    ]);
    expect([...source.pixels]).toEqual(before);
  });

  it("detects a fully opaque source pixel only on the outer edge", () => {
    expect(hasOpaqueOuterEdge(image(3, 3, [0, 0, 0, 0, 255, 0, 0, 0, 0]))).toBe(false);
    expect(hasOpaqueOuterEdge(image(3, 3, [0, 0, 0, 0, 0, 0, 0, 255, 0]))).toBe(true);
  });

  it("rejects malformed buffers, thresholds and crop rectangles", () => {
    expect(() => findAlphaBounds({ width: 2, height: 2, pixels: new Uint8ClampedArray(3) })).toThrow(
      /pixel length/
    );
    expect(() => findAlphaBounds(image(1, 1, [255]), 1.5)).toThrow(/threshold/);
    expect(() => cropRgba(image(2, 2, [1, 2, 3, 4]), { x: 1, y: 1, width: 2, height: 1 })).toThrow(
      /fit inside/
    );
  });
});
