import { describe, expect, it } from "vitest";
import {
  IDENTITY_TRANSFORM,
  applyTransform,
  composeTransforms,
  createRotationTransform,
  createTranslationTransform,
  createUniformScaleTransform,
  invertTransform,
  type Point,
  type Transform2D
} from "./index";

function expectPointClose(actual: Point, expected: Point): void {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
}

function expectTransformClose(
  actual: Transform2D,
  expected: Transform2D
): void {
  expect(actual.a).toBeCloseTo(expected.a, 10);
  expect(actual.b).toBeCloseTo(expected.b, 10);
  expect(actual.c).toBeCloseTo(expected.c, 10);
  expect(actual.d).toBeCloseTo(expected.d, 10);
  expect(actual.e).toBeCloseTo(expected.e, 10);
  expect(actual.f).toBeCloseTo(expected.f, 10);
}

describe("affine animation transforms", () => {
  it("provides an immutable identity transform", () => {
    expect(IDENTITY_TRANSFORM).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0
    });
    expect(applyTransform(IDENTITY_TRANSFORM, { x: 12, y: -4 })).toEqual({
      x: 12,
      y: -4
    });
    expect(composeTransforms()).toBe(IDENTITY_TRANSFORM);
    expect(Object.isFrozen(IDENTITY_TRANSFORM)).toBe(true);
  });

  it("composes translate, rotate, and uniform scale in matrix order", () => {
    const transform = composeTransforms(
      createTranslationTransform(10, -5),
      createRotationTransform(Math.PI / 2),
      createUniformScaleTransform(2)
    );

    // Right-most first: (1,2) -> scale (2,4) -> rotate (-4,2) -> (6,-3).
    expectPointClose(applyTransform(transform, { x: 1, y: 2 }), {
      x: 6,
      y: -3
    });
  });

  it("inverts a composed transform and roundtrips points", () => {
    const transform = composeTransforms(
      createTranslationTransform(24, 17),
      createRotationTransform(-0.72),
      createUniformScaleTransform(1.75)
    );
    const inverse = invertTransform(transform);

    expect(inverse).not.toBeNull();
    if (inverse === null) throw new Error("Expected an invertible transform.");

    expectTransformClose(
      composeTransforms(transform, inverse),
      IDENTITY_TRANSFORM
    );

    const source = { x: -9.25, y: 31.5 };
    expectPointClose(
      applyTransform(inverse, applyTransform(transform, source)),
      source
    );
  });

  it("returns null for singular and near-singular transforms", () => {
    expect(invertTransform(createUniformScaleTransform(0))).toBeNull();
    expect(invertTransform(createUniformScaleTransform(1e-8))).toBeNull();
  });
});
