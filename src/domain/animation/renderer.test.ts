import { describe, expect, it } from "vitest";
import {
  IDENTITY_TRANSFORM,
  blitNearestAffine,
  compositeSourceOver,
  composeTransforms,
  createRasterSurface,
  createRotationTransform,
  createTranslationTransform,
  createUniformScaleTransform,
  renderFrame,
  type RasterSurface,
  type RgbaImage,
  type Transform2D
} from "./index";

const TRANSPARENT = [0, 0, 0, 0] as const;
const RED = [255, 0, 0, 255] as const;
const GREEN = [0, 255, 0, 255] as const;
const BLUE = [0, 0, 255, 255] as const;

function rgbaImage(
  width: number,
  height: number,
  pixels: readonly (readonly [number, number, number, number])[]
): RgbaImage {
  return {
    width,
    height,
    pixels: new Uint8ClampedArray(pixels.flat())
  };
}

function pixelAt(
  image: RgbaImage,
  x: number,
  y: number
): readonly [number, number, number, number] {
  const offset = (y * image.width + x) * 4;
  return [
    image.pixels[offset] ?? 0,
    image.pixels[offset + 1] ?? 0,
    image.pixels[offset + 2] ?? 0,
    image.pixels[offset + 3] ?? 0
  ];
}

function surfaceFrom(image: RgbaImage): RasterSurface {
  return {
    width: image.width,
    height: image.height,
    pixels: new Uint8ClampedArray(image.pixels)
  };
}

describe("deterministic pixel renderer", () => {
  it("creates a validated transparent RGBA surface", () => {
    const surface = createRasterSurface({ width: 3, height: 2 });

    expect(surface).toMatchObject({ width: 3, height: 2 });
    expect([...surface.pixels]).toEqual(new Array(24).fill(0));
    expect(Object.isFrozen(surface)).toBe(true);
    expect(() => createRasterSurface({ width: 0, height: 2 })).toThrow(
      /positive integer/
    );
  });

  it("translates one source pixel by mapping destination pixel centres", () => {
    const frame = renderFrame(
      { width: 4, height: 3 },
      [
        {
          id: "red",
          source: rgbaImage(1, 1, [RED]),
          transform: createTranslationTransform(2, 1)
        }
      ]
    );

    expect(pixelAt(frame, 2, 1)).toEqual(RED);
    expect(pixelAt(frame, 1, 1)).toEqual(TRANSPARENT);
    expect(frame.renderedPartIds).toEqual(["red"]);
  });

  it("scales a 2 by 2 image uniformly without inventing colours", () => {
    const source = rgbaImage(2, 2, [RED, GREEN, BLUE, [255, 255, 0, 255]]);
    const frame = renderFrame(
      { width: 4, height: 4 },
      [
        {
          id: "scaled",
          source,
          transform: createUniformScaleTransform(2)
        }
      ]
    );

    expect([
      pixelAt(frame, 0, 0),
      pixelAt(frame, 1, 0),
      pixelAt(frame, 2, 0),
      pixelAt(frame, 3, 0)
    ]).toEqual([RED, RED, GREEN, GREEN]);
    expect([
      pixelAt(frame, 0, 3),
      pixelAt(frame, 1, 3),
      pixelAt(frame, 2, 3),
      pixelAt(frame, 3, 3)
    ]).toEqual([BLUE, BLUE, [255, 255, 0, 255], [255, 255, 0, 255]]);
    const colours = new Set<string>();
    for (let y = 0; y < frame.height; y += 1) {
      for (let x = 0; x < frame.width; x += 1) {
        colours.add(pixelAt(frame, x, y).join(","));
      }
    }
    expect(colours).toEqual(
      new Set([RED, GREEN, BLUE, [255, 255, 0, 255] as const].map((pixel) => pixel.join(",")))
    );
  });

  it("mirrors horizontally and rotates 90 degrees with exact sampling", () => {
    const source = rgbaImage(2, 1, [RED, GREEN]);
    const mirror: Transform2D = {
      a: -1,
      b: 0,
      c: 0,
      d: 1,
      e: 2,
      f: 0
    };
    const mirrored = renderFrame(
      { width: 2, height: 1 },
      [{ id: "mirror", source, transform: mirror }]
    );
    const rotated = renderFrame(
      { width: 1, height: 2 },
      [{
        id: "rotate",
        source,
        transform: composeTransforms(
          createTranslationTransform(1, 0),
          createRotationTransform(Math.PI / 2)
        )
      }]
    );

    expect([pixelAt(mirrored, 0, 0), pixelAt(mirrored, 1, 0)]).toEqual([
      GREEN,
      RED
    ]);
    expect([pixelAt(rotated, 0, 0), pixelAt(rotated, 0, 1)]).toEqual([
      RED,
      GREEN
    ]);
  });

  it("combines translation, rotation and scale through inverse sampling", () => {
    const transform = composeTransforms(
      createTranslationTransform(2, 1),
      createRotationTransform(Math.PI / 2),
      createUniformScaleTransform(2)
    );
    const frame = renderFrame(
      { width: 5, height: 5 },
      [{ id: "combined", source: rgbaImage(1, 1, [RED]), transform }]
    );

    expect(pixelAt(frame, 0, 1)).toEqual(RED);
    expect(pixelAt(frame, 1, 1)).toEqual(RED);
    expect(pixelAt(frame, 0, 2)).toEqual(RED);
    expect(pixelAt(frame, 1, 2)).toEqual(RED);
    expect(frame.diagnostics).toEqual([]);
  });

  it("skips transparent samples and composites straight alpha with a fixed rule", () => {
    const background = surfaceFrom(rgbaImage(2, 1, [BLUE, BLUE]));
    const source = rgbaImage(2, 1, [
      [255, 0, 255, 0],
      [255, 0, 0, 128]
    ]);
    const result = blitNearestAffine(
      background,
      source,
      IDENTITY_TRANSFORM,
      "alpha"
    );

    expect(pixelAt(result.surface, 0, 0)).toEqual(BLUE);
    expect(pixelAt(result.surface, 1, 0)).toEqual([128, 0, 127, 255]);
    expect(compositeSourceOver(TRANSPARENT, [2, 4, 6, 128])).toEqual([
      2,
      4,
      6,
      128
    ]);
    expect(compositeSourceOver(BLUE, RED)).toEqual(RED);
  });

  it("uses the supplied array order as draw order", () => {
    const red = { id: "red", source: rgbaImage(1, 1, [RED]), transform: IDENTITY_TRANSFORM };
    const green = { id: "green", source: rgbaImage(1, 1, [GREEN]), transform: IDENTITY_TRANSFORM };

    expect(pixelAt(renderFrame({ width: 1, height: 1 }, [red, green]), 0, 0)).toEqual(GREEN);
    expect(pixelAt(renderFrame({ width: 1, height: 1 }, [green, red]), 0, 0)).toEqual(RED);
  });

  it("reports partial and complete clipping without iterating the whole frame", () => {
    const source = rgbaImage(2, 1, [RED, GREEN]);
    const partial = blitNearestAffine(
      createRasterSurface({ width: 2, height: 1 }),
      source,
      createTranslationTransform(-1, 0),
      "partial"
    );
    const outside = blitNearestAffine(
      createRasterSurface({ width: 2, height: 1 }),
      source,
      createTranslationTransform(-4, 0),
      "outside"
    );

    expect(partial.diagnostics.map(({ code }) => code)).toEqual([
      "partiallyClipped"
    ]);
    expect(partial.diagnostics[0]?.edges).toEqual(["left"]);
    expect(partial.sampledPixelCount).toBe(1);
    expect(pixelAt(partial.surface, 0, 0)).toEqual(GREEN);
    expect(outside.diagnostics.map(({ code }) => code)).toEqual([
      "fullyOutside"
    ]);
    expect(outside.diagnostics[0]).toMatchObject({
      severity: "error",
      edges: ["left"]
    });
    expect(outside.sampledPixelCount).toBe(0);
  });

  it.each([
    ["left", createTranslationTransform(-1, 0)],
    ["right", createTranslationTransform(1, 0)],
    ["top", createTranslationTransform(0, -1)],
    ["bottom", createTranslationTransform(0, 1)]
  ] as const)("reports the affected %s frame edge", (edge, transform) => {
    const result = blitNearestAffine(
      createRasterSurface({ width: 2, height: 2 }),
      rgbaImage(2, 2, [RED, GREEN, BLUE, RED]),
      transform,
      edge
    );

    expect(result.diagnostics[0]).toMatchObject({
      code: "partiallyClipped",
      edges: [edge]
    });
  });

  it("reports singular matrices, empty sources and missing RGBA data", () => {
    const surface = createRasterSurface({ width: 2, height: 2 });
    const singular = blitNearestAffine(
      surface,
      rgbaImage(1, 1, [RED]),
      createUniformScaleTransform(0),
      "singular"
    );
    const empty = blitNearestAffine(
      surface,
      { width: 1, height: 1, pixels: new Uint8ClampedArray(4) },
      IDENTITY_TRANSFORM,
      "empty"
    );
    const malformed = blitNearestAffine(
      surface,
      { width: 2, height: 2, pixels: new Uint8ClampedArray(3) },
      IDENTITY_TRANSFORM,
      "malformed"
    );

    expect(singular.diagnostics[0]).toMatchObject({
      code: "nonInvertibleMatrix",
      severity: "error",
      partId: "singular"
    });
    expect(empty.diagnostics[0]).toMatchObject({ code: "emptySource" });
    expect(malformed.diagnostics[0]).toMatchObject({ code: "missingRgbaData" });
  });

  it("keeps input arrays unchanged and repeats byte-identically", () => {
    const source = rgbaImage(2, 1, [RED, [10, 20, 30, 96]]);
    const surface = surfaceFrom(rgbaImage(3, 1, [BLUE, BLUE, BLUE]));
    const sourceBefore = [...source.pixels];
    const surfaceBefore = [...surface.pixels];
    const transform = createTranslationTransform(1, 0);

    const first = blitNearestAffine(surface, source, transform, "stable");
    const second = blitNearestAffine(surface, source, transform, "stable");

    expect([...first.surface.pixels]).toEqual([...second.surface.pixels]);
    expect(first.diagnostics).toEqual(second.diagnostics);
    expect([...source.pixels]).toEqual(sourceBefore);
    expect([...surface.pixels]).toEqual(surfaceBefore);
  });
});
