import type { RgbaImage } from "../../domain/animation";

export type RgbaCanvasDisplayResult =
  | Readonly<{ status: "ok" }>
  | Readonly<{ status: "unavailable"; message: string }>;

function hasValidRgba(image: RgbaImage): boolean {
  return (
    Number.isInteger(image.width) &&
    Number.isInteger(image.height) &&
    image.width > 0 &&
    image.height > 0 &&
    image.pixels instanceof Uint8ClampedArray &&
    image.pixels.length === image.width * image.height * 4
  );
}

/** Displays already-rendered RGBA bytes. It never performs raster sampling. */
export function putRgbaImageData(
  canvas: HTMLCanvasElement,
  image: RgbaImage
): RgbaCanvasDisplayResult {
  if (!hasValidRgba(image)) {
    return Object.freeze({
      status: "unavailable",
      message: "Die gerenderten RGBA-Daten sind unvollständig."
    });
  }
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    return Object.freeze({
      status: "unavailable",
      message: "Der Browser stellt keinen Canvas-2D-Anzeigeadapter bereit."
    });
  }
  context.imageSmoothingEnabled = false;
  const imageData = context.createImageData(image.width, image.height);
  imageData.data.set(image.pixels);
  context.putImageData(imageData, 0, 0);
  return Object.freeze({ status: "ok" });
}
