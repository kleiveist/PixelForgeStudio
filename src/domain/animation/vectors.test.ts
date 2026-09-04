import { describe, expect, it } from "vitest";
import {
  addVectors,
  clamp,
  normalizeAngle,
  subtractVectors,
  vectorAngle,
  vectorLength
} from "./index";

describe("animation vector and angle helpers", () => {
  it("adds, subtracts, and measures vectors without mutation", () => {
    const left = Object.freeze({ x: 4, y: -3 });
    const right = Object.freeze({ x: -1, y: 7 });

    expect(addVectors(left, right)).toEqual({ x: 3, y: 4 });
    expect(subtractVectors(left, right)).toEqual({ x: 5, y: -10 });
    expect(vectorLength({ x: 3, y: 4 })).toBe(5);
    expect(left).toEqual({ x: 4, y: -3 });
    expect(right).toEqual({ x: -1, y: 7 });
  });

  it("returns a radian angle and an explicit null for a zero vector", () => {
    expect(vectorAngle({ x: 1, y: 0 })).toBe(0);
    expect(vectorAngle({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    expect(vectorAngle({ x: -1, y: 0 })).toBeCloseTo(Math.PI);
    expect(vectorAngle({ x: 0, y: 0 })).toBeNull();
    expect(vectorAngle({ x: -0, y: -0 })).toBeNull();
  });

  it("normalizes finite angles to the half-open [-PI, PI) interval", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(-Math.PI);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI);
    expect(normalizeAngle(Math.PI * 2)).toBeCloseTo(0);
    expect(normalizeAngle(Math.PI * 2.5)).toBeCloseTo(Math.PI / 2);
    expect(normalizeAngle(Math.PI * -2.5)).toBeCloseTo(-Math.PI / 2);
    expect(() => normalizeAngle(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => normalizeAngle(Number.NaN)).toThrow(RangeError);
  });

  it("clamps values and rejects reversed or NaN ranges", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(1, 1, 1)).toBe(1);
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
    expect(() => clamp(Number.NaN, 0, 10)).toThrow(RangeError);
  });
});
