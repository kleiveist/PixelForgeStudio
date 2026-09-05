import { describe, expect, it, vi } from "vitest";
import { BrowserPngEncoder } from "./browserPngEncoder";

describe("BrowserPngEncoder", () => {
  it("writes exact RGBA data without smoothing before native PNG encoding", async () => {
    const encodedPixels: number[] = [];
    const imageData = { data: new Uint8ClampedArray(8) } as ImageData;
    const context = {
      imageSmoothingEnabled: true,
      createImageData: vi.fn(() => imageData),
      putImageData: vi.fn(() => encodedPixels.push(...imageData.data))
    } as unknown as OffscreenCanvasRenderingContext2D;
    const png = new Blob([JSON.stringify({ rgba: [1, 2, 3, 4, 5, 6, 7, 8] })], {
      type: "image/png"
    });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      convertToBlob: vi.fn(async () => png)
    } as unknown as OffscreenCanvas;
    const encoder = new BrowserPngEncoder({ createCanvas: () => canvas });

    const result = await encoder.encode({
      width: 2,
      height: 1,
      pixels: new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8])
    });

    expect(result).toBe(png);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(encodedPixels).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const decoded = JSON.parse(await result.text()) as { rgba: number[] };
    expect(decoded.rgba).toEqual(encodedPixels);
  });
});
