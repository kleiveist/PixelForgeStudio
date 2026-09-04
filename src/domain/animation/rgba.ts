import type { Rect } from "./animation.types";

export const DEFAULT_ALPHA_THRESHOLD = 1 as const;

export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
}

function assertDimension(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

function assertRgbaImage(image: RgbaImage): void {
  assertDimension(image.width, "RGBA width");
  assertDimension(image.height, "RGBA height");
  const expectedLength = image.width * image.height * 4;
  if (image.pixels.length !== expectedLength) {
    throw new RangeError(
      `RGBA pixel length must be ${expectedLength}, received ${image.pixels.length}.`
    );
  }
}

function assertAlphaThreshold(threshold: number): void {
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 255) {
    throw new RangeError("Alpha threshold must be an integer from 0 to 255.");
  }
}

function assertCropRect(image: RgbaImage, rect: Rect): void {
  for (const [label, value] of Object.entries(rect)) {
    if (!Number.isInteger(value)) {
      throw new RangeError(`Crop ${label} must be an integer.`);
    }
  }
  if (
    rect.x < 0 ||
    rect.y < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.x + rect.width > image.width ||
    rect.y + rect.height > image.height
  ) {
    throw new RangeError("Crop rectangle must fit inside the RGBA image.");
  }
}

export function findAlphaBounds(
  image: RgbaImage,
  threshold: number = DEFAULT_ALPHA_THRESHOLD
): Rect | null {
  assertRgbaImage(image);
  assertAlphaThreshold(threshold);

  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3];
      if (alpha === undefined || alpha <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return Object.freeze({
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  });
}

export function cropRgba(image: RgbaImage, rect: Rect): RgbaImage {
  assertRgbaImage(image);
  assertCropRect(image, rect);

  const pixels = new Uint8ClampedArray(rect.width * rect.height * 4);
  for (let y = 0; y < rect.height; y += 1) {
    const sourceStart = ((rect.y + y) * image.width + rect.x) * 4;
    const sourceEnd = sourceStart + rect.width * 4;
    pixels.set(image.pixels.subarray(sourceStart, sourceEnd), y * rect.width * 4);
  }

  return Object.freeze({ width: rect.width, height: rect.height, pixels });
}

export function hasOpaqueOuterEdge(image: RgbaImage): boolean {
  assertRgbaImage(image);
  const lastX = image.width - 1;
  const lastY = image.height - 1;
  const alphaAt = (x: number, y: number) =>
    image.pixels[(y * image.width + x) * 4 + 3] ?? 0;

  for (let x = 0; x < image.width; x += 1) {
    if (alphaAt(x, 0) === 255 || alphaAt(x, lastY) === 255) return true;
  }
  for (let y = 1; y < lastY; y += 1) {
    if (alphaAt(0, y) === 255 || alphaAt(lastX, y) === 255) return true;
  }
  return false;
}
