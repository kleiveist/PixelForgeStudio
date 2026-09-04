import { describe, expect, it } from "vitest";
import type { RenderedFrame } from "../../domain/animation";
import {
  MAX_ONION_SKIN_OPACITY,
  MIN_ONION_SKIN_OPACITY,
  clampOnionSkinOpacity,
  resolveOnionSkinLayers
} from "./onionSkin";

function frame(marker: number): RenderedFrame {
  return Object.freeze({
    width: 1,
    height: 1,
    pixels: new Uint8ClampedArray([marker, 0, 0, 255]),
    diagnostics: Object.freeze([]),
    renderedPartIds: Object.freeze([`part-${marker}`])
  });
}

describe("Onion Skin display projection", () => {
  const frames = Object.freeze([frame(0), frame(1), frame(2)]);

  it("selects previous, next, both and off with loop-aware edges", () => {
    expect(resolveOnionSkinLayers(frames, 0, true, "off")).toEqual([]);
    expect(
      resolveOnionSkinLayers(frames, 0, true, "previous").map(
        ({ kind, frameIndex }) => [kind, frameIndex]
      )
    ).toEqual([["previous", 2]]);
    expect(
      resolveOnionSkinLayers(frames, 0, true, "next").map(
        ({ kind, frameIndex }) => [kind, frameIndex]
      )
    ).toEqual([["next", 1]]);
    expect(
      resolveOnionSkinLayers(frames, 1, true, "both").map(
        ({ kind, frameIndex }) => [kind, frameIndex]
      )
    ).toEqual([
      ["previous", 0],
      ["next", 2]
    ]);
    expect(resolveOnionSkinLayers(frames, 0, false, "previous")).toEqual([]);
  });

  it("bounds opacity and leaves the export frame bytes untouched", () => {
    expect(clampOnionSkinOpacity(-10)).toBe(MIN_ONION_SKIN_OPACITY);
    expect(clampOnionSkinOpacity(10)).toBe(MAX_ONION_SKIN_OPACITY);
    const exportBytes = Uint8ClampedArray.from(frames[1]!.pixels);

    const layers = resolveOnionSkinLayers(frames, 1, true, "both");

    expect(layers[0]?.frame).toBe(frames[0]);
    expect(layers[1]?.frame).toBe(frames[2]);
    expect(frames[1]!.pixels).toEqual(exportBytes);
  });
});
