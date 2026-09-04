export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect extends Point, Size {}

export interface FrameProfile {
  readonly frameSize: Size;
  readonly characterHeight: number;
  readonly footAnchor: Point;
}

export interface SourceAnchors {
  readonly proximal: Point;
  readonly distal?: Point;
  readonly pivot?: Point;
}

/**
 * Canvas-compatible affine matrix coefficients without a Canvas dependency.
 *
 * x' = a * x + c * y + e
 * y' = b * x + d * y + f
 */
export interface Transform2D {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

export interface TransformDelta {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly rotationDelta: number;
  readonly scaleMultiplier: number;
}

export const MIRROR_POLICIES = Object.freeze([
  "inherit",
  "allow",
  "forbid"
] as const);

export const RIG_TEMPLATE_IDS = Object.freeze(["humanoid-80-v1"] as const);

export const ANIMATION_ACTION_IDS = Object.freeze(["walk"] as const);

export type MirrorPolicy = (typeof MIRROR_POLICIES)[number];
export type RigTemplateId = (typeof RIG_TEMPLATE_IDS)[number];
export type AnimationActionId = (typeof ANIMATION_ACTION_IDS)[number];
