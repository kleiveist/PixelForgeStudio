import { unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import {
  DIRECTION_IDS,
  resolveSpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { createSpriteSheetMetadata } from "./animationExport";
import {
  AnimationExportCancelledError,
  createIndividualFrameArchive
} from "./animationExportFiles";

function fixture() {
  const project = parseAnimationProject(createAnimationProjectInput());
  const layout = resolveSpriteSheetLayout({ frameSize: project.frameProfile.frameSize });
  const frames: SpriteSheetSourceFrame[] = DIRECTION_IDS.flatMap((direction) =>
    Array.from({ length: 8 }, (_, frameIndex) => ({
      direction,
      frameIndex,
      frame: {
        width: 128,
        height: 128,
        pixels: new Uint8ClampedArray(128 * 128 * 4)
      }
    }))
  );
  return {
    frames,
    metadata: createSpriteSheetMetadata({
      project,
      clip: project.clips[0]!,
      layout
    })
  };
}

describe("individual frame archive", () => {
  it("encodes 64 stable names plus matching metadata and reports progress", async () => {
    const { frames, metadata } = fixture();
    const progress = vi.fn();
    const archive = await createIndividualFrameArchive({
      frames,
      metadata,
      encoder: { encode: async () => new Blob([new Uint8Array([1, 2, 3])]) },
      onProgress: progress
    });
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    expect(Object.keys(files)).toHaveLength(65);
    expect(files).toHaveProperty("frames/walk_south_00.png");
    expect(files).toHaveProperty("frames/walk_southWest_07.png");
    expect(files).toHaveProperty("frames/metadata.json");
    expect(progress).toHaveBeenLastCalledWith(64, 64);
  });

  it("stops without a completed archive when cancellation is requested", async () => {
    const { frames, metadata } = fixture();
    const controller = new AbortController();
    controller.abort();
    await expect(
      createIndividualFrameArchive({
        frames,
        metadata,
        encoder: { encode: async () => new Blob() },
        signal: controller.signal
      })
    ).rejects.toBeInstanceOf(AnimationExportCancelledError);
  });
});
