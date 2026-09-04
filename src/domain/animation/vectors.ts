import type { Point } from "./animation.types";

const FULL_ROTATION = Math.PI * 2;

export function addVectors(left: Point, right: Point): Point {
  return Object.freeze({
    x: left.x + right.x,
    y: left.y + right.y
  });
}

export function subtractVectors(left: Point, right: Point): Point {
  return Object.freeze({
    x: left.x - right.x,
    y: left.y - right.y
  });
}

export function vectorLength(vector: Point): number {
  return Math.hypot(vector.x, vector.y);
}

export function vectorAngle(vector: Point): number | null {
  if (vector.x === 0 && vector.y === 0) return null;
  return Math.atan2(vector.y, vector.x);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  if (
    Number.isNaN(value) ||
    Number.isNaN(minimum) ||
    Number.isNaN(maximum) ||
    minimum > maximum
  ) {
    throw new RangeError("Clamp requires ordered, non-NaN bounds and value.");
  }

  return Math.min(maximum, Math.max(minimum, value));
}

/** Normalizes a finite radian angle into the half-open interval [-PI, PI). */
export function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    throw new RangeError("Angle must be finite.");
  }

  const normalized =
    ((angle + Math.PI) % FULL_ROTATION + FULL_ROTATION) % FULL_ROTATION -
    Math.PI;

  return Object.is(normalized, -0) ? 0 : normalized;
}
