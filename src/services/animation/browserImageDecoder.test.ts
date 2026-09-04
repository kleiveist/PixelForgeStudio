import { describe, expect, it, vi } from "vitest";
import {
  BrowserImageDecoder,
  type BrowserImageDecoderEnvironment
} from "./browserImageDecoder";

function canvasWithPixels(pixels: Uint8ClampedArray): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: pixels })
  } as unknown as CanvasRenderingContext2D;
  vi.spyOn(canvas, "getContext").mockReturnValue(context);
  return canvas;
}

describe("BrowserImageDecoder", () => {
  it("prefers createImageBitmap, extracts owned RGBA data and closes the bitmap", async () => {
    const close = vi.fn();
    const bitmap = { width: 2, height: 1, close } as ImageBitmap;
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const fallback = vi.fn();
    const environment: BrowserImageDecoderEnvironment = {
      createImageBitmap,
      createCanvas: () => canvasWithPixels(new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8])),
      createImageElement: fallback,
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn()
    };

    const result = await new BrowserImageDecoder(environment).decode(
      new Blob(["png"], { type: "image/png" })
    );

    expect(result).toMatchObject({ width: 2, height: 1 });
    expect([...result.pixels]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(createImageBitmap).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("uses the controlled image-element fallback and always revokes its object URL", async () => {
    const image = document.createElement("img");
    image.width = 1;
    image.height = 1;
    Object.defineProperty(image, "src", {
      configurable: true,
      set() {
        queueMicrotask(() => image.onload?.(new Event("load")));
      }
    });
    const revokeObjectURL = vi.fn();
    const environment: BrowserImageDecoderEnvironment = {
      createImageBitmap: vi.fn().mockRejectedValue(new Error("bitmap unsupported")),
      createCanvas: () => canvasWithPixels(new Uint8ClampedArray([9, 8, 7, 255])),
      createImageElement: () => image,
      createObjectURL: vi.fn().mockReturnValue("blob:fallback"),
      revokeObjectURL
    };

    await expect(
      new BrowserImageDecoder(environment).decode(new Blob(["png"], { type: "image/png" }))
    ).resolves.toMatchObject({ width: 1, height: 1 });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fallback");
  });

  it("reports an undecodable fallback without leaking its object URL", async () => {
    const image = document.createElement("img");
    Object.defineProperty(image, "src", {
      configurable: true,
      set() {
        queueMicrotask(() => image.onerror?.(new Event("error")));
      }
    });
    const revokeObjectURL = vi.fn();
    const environment: BrowserImageDecoderEnvironment = {
      createCanvas: () => canvasWithPixels(new Uint8ClampedArray()),
      createImageElement: () => image,
      createObjectURL: vi.fn().mockReturnValue("blob:broken"),
      revokeObjectURL
    };

    await expect(
      new BrowserImageDecoder(environment).decode(new Blob(["broken"], { type: "image/png" }))
    ).rejects.toThrow(/nicht sicher decodiert/);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:broken");
  });
});
