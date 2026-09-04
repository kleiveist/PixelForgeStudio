import type { Size, Transform2D } from "./animation.types";
import type { RgbaImage } from "./rgba";
import { applyTransform, invertTransform } from "./matrices";

export const RASTER_COORDINATE_EPSILON = 1e-9;

export const RENDER_DIAGNOSTIC_CODES = Object.freeze([
  "fullyOutside",
  "partiallyClipped",
  "emptySource",
  "nonInvertibleMatrix",
  "missingRgbaData"
] as const);

export type RenderDiagnosticCode =
  (typeof RENDER_DIAGNOSTIC_CODES)[number];
export type FrameEdge = "left" | "right" | "top" | "bottom";

export type RgbaPixel = readonly [number, number, number, number];

export interface RasterBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RasterSurface extends RgbaImage {}

export interface RenderablePart {
  readonly id: string;
  readonly source: RgbaImage;
  readonly transform: Transform2D;
}

export interface RenderDiagnostic {
  readonly code: RenderDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly partId?: string;
  readonly bounds?: RasterBounds;
  readonly edges?: readonly FrameEdge[];
  readonly message: string;
}

export interface RasterBlitResult {
  readonly surface: RasterSurface;
  readonly diagnostics: readonly RenderDiagnostic[];
  readonly sampledPixelCount: number;
  readonly compositedPixelCount: number;
}

export interface RenderedFrame extends RasterSurface {
  readonly diagnostics: readonly RenderDiagnostic[];
  readonly renderedPartIds: readonly string[];
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

function assertSurface(surface: RasterSurface): void {
  assertPositiveInteger(surface.width, "Raster surface width");
  assertPositiveInteger(surface.height, "Raster surface height");
  if (!(surface.pixels instanceof Uint8ClampedArray)) {
    throw new TypeError("Raster surface pixels must be a Uint8ClampedArray.");
  }
  const expectedLength = surface.width * surface.height * 4;
  if (surface.pixels.length !== expectedLength) {
    throw new RangeError(
      `Raster surface pixel length must be ${expectedLength}, received ${surface.pixels.length}.`
    );
  }
}

function copySurface(surface: RasterSurface): RasterSurface {
  return Object.freeze({
    width: surface.width,
    height: surface.height,
    pixels: new Uint8ClampedArray(surface.pixels)
  });
}

export function createRasterSurface(size: Size): RasterSurface {
  assertPositiveInteger(size.width, "Raster surface width");
  assertPositiveInteger(size.height, "Raster surface height");
  return Object.freeze({
    width: size.width,
    height: size.height,
    pixels: new Uint8ClampedArray(size.width * size.height * 4)
  });
}

function roundPositiveRatio(numerator: number, denominator: number): number {
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

function assertRgbaPixel(pixel: RgbaPixel, label: string): void {
  if (
    pixel.length !== 4 ||
    pixel.some(
      (channel) =>
        !Number.isInteger(channel) || channel < 0 || channel > 255
    )
  ) {
    throw new RangeError(`${label} must contain four integer RGBA channels.`);
  }
}

/**
 * Composites straight-alpha RGBA channels with integer-only intermediates.
 * Every division rounds to the nearest integer; exact half steps round up.
 */
export function compositeSourceOver(
  destination: RgbaPixel,
  source: RgbaPixel
): RgbaPixel {
  assertRgbaPixel(destination, "Destination pixel");
  assertRgbaPixel(source, "Source pixel");

  const sourceAlpha = source[3];
  const destinationAlpha = destination[3];
  if (sourceAlpha === 0) return Object.freeze([...destination] as RgbaPixel);
  if (sourceAlpha === 255) return Object.freeze([...source] as RgbaPixel);

  const inverseSourceAlpha = 255 - sourceAlpha;
  const outputAlphaNumerator =
    sourceAlpha * 255 + destinationAlpha * inverseSourceAlpha;
  if (outputAlphaNumerator === 0) {
    return Object.freeze([0, 0, 0, 0] as const);
  }

  const channel = (index: 0 | 1 | 2) =>
    roundPositiveRatio(
      source[index] * sourceAlpha * 255 +
        destination[index] * destinationAlpha * inverseSourceAlpha,
      outputAlphaNumerator
    );

  return Object.freeze([
    channel(0),
    channel(1),
    channel(2),
    roundPositiveRatio(outputAlphaNumerator, 255)
  ] as const);
}

function diagnostic(
  code: RenderDiagnosticCode,
  severity: RenderDiagnostic["severity"],
  message: string,
  partId?: string,
  bounds?: RasterBounds,
  edges?: readonly FrameEdge[]
): RenderDiagnostic {
  return Object.freeze({
    code,
    severity,
    ...(partId ? { partId } : {}),
    ...(bounds ? { bounds: Object.freeze({ ...bounds }) } : {}),
    ...(edges && edges.length > 0 ? { edges: Object.freeze([...edges]) } : {}),
    message
  });
}

function resultWithoutBlit(
  surface: RasterSurface,
  issue: RenderDiagnostic
): RasterBlitResult {
  return Object.freeze({
    surface: copySurface(surface),
    diagnostics: Object.freeze([issue]),
    sampledPixelCount: 0,
    compositedPixelCount: 0
  });
}

function transformIsFinite(transform: Transform2D): boolean {
  return [
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  ].every(Number.isFinite);
}

function sourceHasVisiblePixel(source: RgbaImage): boolean {
  for (let offset = 3; offset < source.pixels.length; offset += 4) {
    if ((source.pixels[offset] ?? 0) > 0) return true;
  }
  return false;
}

function snapNearInteger(value: number): number {
  const integer = Math.round(value);
  return Math.abs(value - integer) <= RASTER_COORDINATE_EPSILON
    ? integer
    : value;
}

function targetBounds(
  source: RgbaImage,
  transform: Transform2D
): RasterBounds | null {
  // Pixel cells occupy [x, x + 1); their centres are x + 0.5. The source
  // support is therefore the half-open rectangle [0, width) × [0, height).
  const left = 0;
  const top = 0;
  const right = source.width;
  const bottom = source.height;
  const corners = [
    applyTransform(transform, { x: left, y: top }),
    applyTransform(transform, { x: right, y: top }),
    applyTransform(transform, { x: left, y: bottom }),
    applyTransform(transform, { x: right, y: bottom })
  ];
  if (corners.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return null;
  }
  const xs = corners.map(({ x }) => snapNearInteger(x));
  const ys = corners.map(({ y }) => snapNearInteger(y));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const x = Math.ceil(snapNearInteger(minX - 0.5));
  const y = Math.ceil(snapNearInteger(minY - 0.5));
  const endX = Math.ceil(snapNearInteger(maxX - 0.5));
  const endY = Math.ceil(snapNearInteger(maxY - 0.5));
  return Object.freeze({ x, y, width: endX - x, height: endY - y });
}

function intersectBounds(
  bounds: RasterBounds,
  surface: RasterSurface
): RasterBounds | null {
  const x = Math.max(0, bounds.x);
  const y = Math.max(0, bounds.y);
  const endX = Math.min(surface.width, bounds.x + bounds.width);
  const endY = Math.min(surface.height, bounds.y + bounds.height);
  if (endX <= x || endY <= y) return null;
  return Object.freeze({ x, y, width: endX - x, height: endY - y });
}

function clippedFrameEdges(
  bounds: RasterBounds,
  surface: RasterSurface
): readonly FrameEdge[] {
  const edges: FrameEdge[] = [];
  if (bounds.x < 0) edges.push("left");
  if (bounds.x + bounds.width > surface.width) edges.push("right");
  if (bounds.y < 0) edges.push("top");
  if (bounds.y + bounds.height > surface.height) edges.push("bottom");
  return Object.freeze(edges);
}

function sourcePixelIndex(coordinate: number): number {
  return Math.floor(snapNearInteger(coordinate));
}

function readPixel(pixels: Uint8ClampedArray, offset: number): RgbaPixel {
  return [
    pixels[offset] ?? 0,
    pixels[offset + 1] ?? 0,
    pixels[offset + 2] ?? 0,
    pixels[offset + 3] ?? 0
  ];
}

function writePixel(
  pixels: Uint8ClampedArray,
  offset: number,
  pixel: RgbaPixel
): void {
  pixels[offset] = pixel[0];
  pixels[offset + 1] = pixel[1];
  pixels[offset + 2] = pixel[2];
  pixels[offset + 3] = pixel[3];
}

/** Pure inverse-affine nearest-neighbour blit. Neither input array is mutated. */
export function blitNearestAffine(
  surface: RasterSurface,
  source: RgbaImage,
  transform: Transform2D,
  partId?: string
): RasterBlitResult {
  assertSurface(surface);

  if (
    !Number.isInteger(source.width) ||
    !Number.isInteger(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "emptySource",
        "warning",
        "The source image has no positive integer raster extent.",
        partId
      )
    );
  }
  const expectedSourceLength = source.width * source.height * 4;
  if (
    !(source.pixels instanceof Uint8ClampedArray) ||
    source.pixels.length !== expectedSourceLength
  ) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "missingRgbaData",
        "error",
        `The source image requires exactly ${expectedSourceLength} RGBA channels.`,
        partId
      )
    );
  }
  if (!sourceHasVisiblePixel(source)) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "emptySource",
        "warning",
        "The source image contains no visible pixel.",
        partId
      )
    );
  }
  if (!transformIsFinite(transform)) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "nonInvertibleMatrix",
        "error",
        "The affine transform contains a non-finite coefficient.",
        partId
      )
    );
  }
  const inverse = invertTransform(transform);
  const bounds = targetBounds(source, transform);
  if (!inverse || !bounds) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "nonInvertibleMatrix",
        "error",
        "The affine transform cannot be inverted to sample source pixels.",
        partId
      )
    );
  }

  const clippedBounds = intersectBounds(bounds, surface);
  const clippedEdges = clippedFrameEdges(bounds, surface);
  if (!clippedBounds) {
    return resultWithoutBlit(
      surface,
      diagnostic(
        "fullyOutside",
        "error",
        "The transformed part lies completely outside the target surface.",
        partId,
        bounds,
        clippedEdges
      )
    );
  }

  const pixels = new Uint8ClampedArray(surface.pixels);
  let sampledPixelCount = 0;
  let compositedPixelCount = 0;
  for (
    let targetY = clippedBounds.y;
    targetY < clippedBounds.y + clippedBounds.height;
    targetY += 1
  ) {
    for (
      let targetX = clippedBounds.x;
      targetX < clippedBounds.x + clippedBounds.width;
      targetX += 1
    ) {
      const sourcePoint = applyTransform(inverse, {
        x: targetX + 0.5,
        y: targetY + 0.5
      });
      const sourceX = sourcePixelIndex(sourcePoint.x);
      const sourceY = sourcePixelIndex(sourcePoint.y);
      if (
        sourceX < 0 ||
        sourceX >= source.width ||
        sourceY < 0 ||
        sourceY >= source.height
      ) {
        continue;
      }
      sampledPixelCount += 1;
      const sourceOffset = (sourceY * source.width + sourceX) * 4;
      const sourceAlpha = source.pixels[sourceOffset + 3] ?? 0;
      if (sourceAlpha === 0) continue;
      const targetOffset = (targetY * surface.width + targetX) * 4;
      writePixel(
        pixels,
        targetOffset,
        compositeSourceOver(
          readPixel(surface.pixels, targetOffset),
          readPixel(source.pixels, sourceOffset)
        )
      );
      compositedPixelCount += 1;
    }
  }

  const wasClipped =
    clippedBounds.x !== bounds.x ||
    clippedBounds.y !== bounds.y ||
    clippedBounds.width !== bounds.width ||
    clippedBounds.height !== bounds.height;
  return Object.freeze({
    surface: Object.freeze({
      width: surface.width,
      height: surface.height,
      pixels
    }),
    diagnostics: Object.freeze(
      wasClipped
        ? [
            diagnostic(
              "partiallyClipped",
              "warning",
              "The transformed part is clipped by the target surface.",
              partId,
              bounds,
              clippedEdges
            )
          ]
        : []
    ),
    sampledPixelCount,
    compositedPixelCount
  });
}

export function renderPart(
  surface: RasterSurface,
  part: RenderablePart
): RasterBlitResult {
  return blitNearestAffine(surface, part.source, part.transform, part.id);
}

export function renderFrame(
  size: Size,
  partsInDrawOrder: readonly RenderablePart[]
): RenderedFrame {
  let surface = createRasterSurface(size);
  const diagnostics: RenderDiagnostic[] = [];
  const renderedPartIds: string[] = [];
  for (const part of partsInDrawOrder) {
    const result = renderPart(surface, part);
    surface = result.surface;
    diagnostics.push(...result.diagnostics);
    if (result.compositedPixelCount > 0) renderedPartIds.push(part.id);
  }
  return Object.freeze({
    width: surface.width,
    height: surface.height,
    pixels: surface.pixels,
    diagnostics: Object.freeze(diagnostics),
    renderedPartIds: Object.freeze(renderedPartIds)
  });
}
