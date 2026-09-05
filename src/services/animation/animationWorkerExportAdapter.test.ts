import { unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import type { StableId } from "../../schemas";
import {
  encodeImagesForExport,
  packageFilesForExport,
  type AnimationWorkerExportIdentity
} from "./animationWorkerExportAdapter";

const identity: AnimationWorkerExportIdentity = {
  projectId: "project_fallback" as StableId,
  projectRevision: 2,
  currentProjectRevision: () => 2,
  nextJobId: (operation) => `${operation}-1`
};

describe("controlled animation worker fallbacks", () => {
  it("encodes asynchronously through the injected browser adapter without OffscreenCanvas", async () => {
    const encode = vi.fn(async () =>
      new Blob([Uint8Array.from([1, 2, 3]).buffer], { type: "image/png" })
    );
    const progress = vi.fn();
    const files = await encodeImagesForExport(
      [
        {
          name: "walk.png",
          image: {
            width: 1,
            height: 1,
            pixels: new Uint8ClampedArray([1, 2, 3, 255])
          }
        }
      ],
      { encode },
      { controller: null, identity, onProgress: progress }
    );
    expect(files[0]).toEqual(
      expect.objectContaining({ name: "walk.png", mimeType: "image/png" })
    );
    expect([...files[0]!.bytes]).toEqual([1, 2, 3]);
    expect(progress).toHaveBeenLastCalledWith({
      stage: "encoding",
      completed: 1,
      total: 1
    });
  });

  it("packages only after all entries are available and honors pre-cancel", async () => {
    const archive = await packageFilesForExport(
      [{ path: "frames/walk.png", bytes: Uint8Array.from([1, 2, 3]) }],
      "application/zip",
      { controller: null, identity }
    );
    expect(unzipSync(new Uint8Array(await archive.arrayBuffer()))).toHaveProperty(
      "frames/walk.png"
    );

    const abort = new AbortController();
    abort.abort();
    await expect(
      packageFilesForExport([], "application/zip", {
        controller: null,
        identity,
        signal: abort.signal
      })
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
