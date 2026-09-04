import { describe, expect, it, vi } from "vitest";
import { putRgbaImageData } from "./rgbaCanvasDisplay";

describe("putRgbaImageData", () => {
  it("uses ImageData/putImageData and disables smoothing", () => {
    const canvas = document.createElement("canvas");
    const data = new Uint8ClampedArray(8);
    const imageData = { data } as ImageData;
    const context = {
      imageSmoothingEnabled: true,
      createImageData: vi.fn(() => imageData),
      putImageData: vi.fn()
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );
    const sourcePixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 128
    ]);

    expect(
      putRgbaImageData(canvas, {
        width: 2,
        height: 1,
        pixels: sourcePixels
      })
    ).toEqual({ status: "ok" });
    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(1);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.createImageData).toHaveBeenCalledWith(2, 1);
    expect(context.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
    expect([...data]).toEqual([...sourcePixels]);
  });

  it("reports missing context or malformed RGBA without drawing", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    expect(
      putRgbaImageData(canvas, {
        width: 1,
        height: 1,
        pixels: new Uint8ClampedArray([1, 2, 3, 4])
      })
    ).toMatchObject({ status: "unavailable" });
    expect(
      putRgbaImageData(canvas, {
        width: 2,
        height: 1,
        pixels: new Uint8ClampedArray(3)
      })
    ).toMatchObject({ status: "unavailable" });
  });
});
