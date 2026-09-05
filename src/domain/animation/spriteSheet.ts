import type { Direction } from "./directions";
import { DIRECTION_IDS, isDirection } from "./directions";
import type { Rect, Size } from "./animation.types";
import type { RgbaImage } from "./rgba";

export const DEFAULT_SPRITE_SHEET_FRAME_COUNT = 8 as const;

export interface SpriteSheetLayoutCell extends Rect {
  readonly row: number;
  readonly column: number;
  readonly direction: Direction;
  readonly frameIndex: number;
}

export interface SpriteSheetLayout {
  readonly frameSize: Size;
  readonly directions: readonly Direction[];
  readonly frameCount: number;
  readonly rows: number;
  readonly columns: number;
  readonly capacity: number;
  readonly margin: number;
  readonly spacing: number;
  readonly sheetWidth: number;
  readonly sheetHeight: number;
  readonly cells: readonly SpriteSheetLayoutCell[];
}

export interface ResolveSpriteSheetLayoutInput {
  readonly frameSize: Size;
  readonly directions?: readonly Direction[];
  readonly frameCount?: number;
  readonly margin?: number;
  readonly spacing?: number;
}

export interface SpriteSheetSourceFrame {
  readonly direction: Direction;
  readonly frameIndex: number;
  readonly frame: RgbaImage;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
}

function canonicalDirections(
  directions: readonly Direction[] | undefined
): readonly Direction[] {
  const selected = directions ?? DIRECTION_IDS;
  if (selected.length === 0) {
    throw new RangeError("Sprite sheet directions must not be empty.");
  }
  if (new Set(selected).size !== selected.length) {
    throw new RangeError("Sprite sheet directions must be unique.");
  }
  if (!selected.every(isDirection)) {
    throw new RangeError("Sprite sheet contains an unknown direction.");
  }
  const selectedIds = new Set<Direction>(selected);
  return Object.freeze(
    DIRECTION_IDS.filter((direction) => selectedIds.has(direction))
  );
}

/** Resolves the stable direction-row / frame-column production layout. */
export function resolveSpriteSheetLayout(
  input: ResolveSpriteSheetLayoutInput
): SpriteSheetLayout {
  assertPositiveInteger(input.frameSize.width, "Frame width");
  assertPositiveInteger(input.frameSize.height, "Frame height");
  const frameCount = input.frameCount ?? DEFAULT_SPRITE_SHEET_FRAME_COUNT;
  const margin = input.margin ?? 0;
  const spacing = input.spacing ?? 0;
  assertPositiveInteger(frameCount, "Frame count");
  assertNonNegativeInteger(margin, "Sheet margin");
  assertNonNegativeInteger(spacing, "Sheet spacing");

  const directions = canonicalDirections(input.directions);
  const rows = directions.length;
  const columns = frameCount;
  const sheetWidth = margin * 2 + columns * input.frameSize.width +
    Math.max(0, columns - 1) * spacing;
  const sheetHeight = margin * 2 + rows * input.frameSize.height +
    Math.max(0, rows - 1) * spacing;
  const cells = directions.flatMap((direction, row) =>
    Array.from({ length: frameCount }, (_, frameIndex) =>
      Object.freeze({
        row,
        column: frameIndex,
        direction,
        frameIndex,
        x: margin + frameIndex * (input.frameSize.width + spacing),
        y: margin + row * (input.frameSize.height + spacing),
        width: input.frameSize.width,
        height: input.frameSize.height
      })
    )
  );

  return Object.freeze({
    frameSize: Object.freeze({ ...input.frameSize }),
    directions,
    frameCount,
    rows,
    columns,
    capacity: rows * columns,
    margin,
    spacing,
    sheetWidth,
    sheetHeight,
    cells: Object.freeze(cells)
  });
}

function assertSourceFrame(
  source: SpriteSheetSourceFrame,
  layout: SpriteSheetLayout
): void {
  if (
    source.frame.width !== layout.frameSize.width ||
    source.frame.height !== layout.frameSize.height
  ) {
    throw new RangeError(
      `Frame ${source.direction}:${source.frameIndex} must be ` +
        `${layout.frameSize.width}x${layout.frameSize.height}px.`
    );
  }
  const expectedLength = source.frame.width * source.frame.height * 4;
  if (
    !(source.frame.pixels instanceof Uint8ClampedArray) ||
    source.frame.pixels.length !== expectedLength
  ) {
    throw new RangeError(
      `Frame ${source.direction}:${source.frameIndex} has invalid RGBA data.`
    );
  }
}

/** Copies native RGBA bytes into their cells; untouched margins stay transparent. */
export function composeSpriteSheet(
  layout: SpriteSheetLayout,
  sourceFrames: readonly SpriteSheetSourceFrame[]
): RgbaImage {
  if (sourceFrames.length !== layout.capacity) {
    throw new RangeError(
      `Sprite sheet requires exactly ${layout.capacity} frames, received ${sourceFrames.length}.`
    );
  }
  const byAddress = new Map<string, SpriteSheetSourceFrame>();
  for (const source of sourceFrames) {
    assertSourceFrame(source, layout);
    const address = `${source.direction}:${source.frameIndex}`;
    if (byAddress.has(address)) {
      throw new RangeError(`Duplicate sprite sheet frame ${address}.`);
    }
    byAddress.set(address, source);
  }

  const pixels = new Uint8ClampedArray(
    layout.sheetWidth * layout.sheetHeight * 4
  );
  for (const cell of layout.cells) {
    const source = byAddress.get(`${cell.direction}:${cell.frameIndex}`);
    if (!source) {
      throw new RangeError(
        `Missing sprite sheet frame ${cell.direction}:${cell.frameIndex}.`
      );
    }
    for (let sourceY = 0; sourceY < cell.height; sourceY += 1) {
      const sourceStart = sourceY * cell.width * 4;
      const sourceEnd = sourceStart + cell.width * 4;
      const destinationStart =
        ((cell.y + sourceY) * layout.sheetWidth + cell.x) * 4;
      pixels.set(
        source.frame.pixels.subarray(sourceStart, sourceEnd),
        destinationStart
      );
    }
  }
  return Object.freeze({
    width: layout.sheetWidth,
    height: layout.sheetHeight,
    pixels
  });
}

export function createAnimationFrameFileName(
  direction: Direction,
  frameIndex: number,
  action = "walk"
): string {
  if (!isDirection(direction)) throw new RangeError("Unknown frame direction.");
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex > 99) {
    throw new RangeError("Frame index must be an integer from 0 to 99.");
  }
  const safeAction = action
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "animation";
  return `${safeAction}_${direction}_${String(frameIndex).padStart(2, "0")}.png`;
}

export function normalizeAnimationExportBaseName(
  projectName: string,
  projectId: string
): string {
  const normalized = projectName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  if (normalized) return normalized;
  const fallback = projectId
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return fallback || "animation-project";
}
