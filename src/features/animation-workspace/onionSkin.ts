import type { RenderedFrame } from "../../domain/animation";

export const ONION_SKIN_MODES = Object.freeze([
  "off",
  "previous",
  "next",
  "both"
] as const);
export type OnionSkinMode = (typeof ONION_SKIN_MODES)[number];

export const MIN_ONION_SKIN_OPACITY = 0.1;
export const MAX_ONION_SKIN_OPACITY = 0.6;
export const DEFAULT_ONION_SKIN_OPACITY = 0.25;

export interface OnionSkinLayer {
  readonly kind: "previous" | "next";
  readonly frameIndex: number;
  readonly frame: RenderedFrame;
}

export function clampOnionSkinOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return DEFAULT_ONION_SKIN_OPACITY;
  return Math.min(
    MAX_ONION_SKIN_OPACITY,
    Math.max(MIN_ONION_SKIN_OPACITY, opacity)
  );
}

function adjacentFrameIndex(
  frameIndex: number,
  delta: -1 | 1,
  frameCount: number,
  loop: boolean
): number | null {
  const candidate = frameIndex + delta;
  if (candidate >= 0 && candidate < frameCount) return candidate;
  if (!loop) return null;
  return (candidate + frameCount) % frameCount;
}

/**
 * Selects preview-only neighboring frames. It never composites or copies the
 * active frame, so export pixels remain owned by the renderer.
 */
export function resolveOnionSkinLayers(
  frames: readonly RenderedFrame[],
  frameIndex: number,
  loop: boolean,
  mode: OnionSkinMode
): readonly OnionSkinLayer[] {
  if (
    !Number.isInteger(frameIndex) ||
    frameIndex < 0 ||
    frameIndex >= frames.length
  ) {
    return Object.freeze([]);
  }
  const deltas: readonly Readonly<{
    kind: OnionSkinLayer["kind"];
    delta: -1 | 1;
  }>[] =
    mode === "previous"
      ? [{ kind: "previous", delta: -1 }]
      : mode === "next"
        ? [{ kind: "next", delta: 1 }]
        : mode === "both"
          ? [
              { kind: "previous", delta: -1 },
              { kind: "next", delta: 1 }
            ]
          : [];

  return Object.freeze(
    deltas.flatMap(({ kind, delta }) => {
      const adjacent = adjacentFrameIndex(
        frameIndex,
        delta,
        frames.length,
        loop
      );
      const frame = adjacent === null ? undefined : frames[adjacent];
      return frame && adjacent !== null
        ? [Object.freeze({ kind, frameIndex: adjacent, frame })]
        : [];
    })
  );
}
