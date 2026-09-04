import type { Point, Transform2D } from "./animation.types";

export const AFFINE_DETERMINANT_EPSILON = 1e-12;

export const IDENTITY_TRANSFORM: Transform2D = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0
});

export function createTranslationTransform(x: number, y: number): Transform2D {
  return Object.freeze({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
}

export function createRotationTransform(angle: number): Transform2D {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return Object.freeze({
    a: cosine,
    b: sine,
    c: -sine,
    d: cosine,
    e: 0,
    f: 0
  });
}

export function createUniformScaleTransform(scale: number): Transform2D {
  return Object.freeze({ a: scale, b: 0, c: 0, d: scale, e: 0, f: 0 });
}

function multiplyTransforms(
  left: Transform2D,
  right: Transform2D
): Transform2D {
  return Object.freeze({
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f
  });
}

/**
 * Multiplies matrices in the supplied order. Consequently the right-most
 * transform is applied to a point first: compose(T, R, S) means T × R × S.
 */
export function composeTransforms(
  ...transforms: readonly Transform2D[]
): Transform2D {
  return transforms.reduce<Transform2D>(
    (composed, transform) => multiplyTransforms(composed, transform),
    IDENTITY_TRANSFORM
  );
}

export function applyTransform(transform: Transform2D, point: Point): Point {
  return Object.freeze({
    x: transform.a * point.x + transform.c * point.y + transform.e,
    y: transform.b * point.x + transform.d * point.y + transform.f
  });
}

export function invertTransform(transform: Transform2D): Transform2D | null {
  const determinant = transform.a * transform.d - transform.b * transform.c;
  if (Math.abs(determinant) <= AFFINE_DETERMINANT_EPSILON) return null;

  const inverseDeterminant = 1 / determinant;

  return Object.freeze({
    a: transform.d * inverseDeterminant,
    b: -transform.b * inverseDeterminant,
    c: -transform.c * inverseDeterminant,
    d: transform.a * inverseDeterminant,
    e:
      (transform.c * transform.f - transform.d * transform.e) *
      inverseDeterminant,
    f:
      (transform.b * transform.e - transform.a * transform.f) *
      inverseDeterminant
  });
}
