import type { RgbaImage } from "../../domain/animation";

export interface PngEncoder {
  encode(image: RgbaImage): Promise<Blob>;
}

type PngCanvas = HTMLCanvasElement | OffscreenCanvas;

export interface BrowserPngEncoderEnvironment {
  readonly createCanvas: (width: number, height: number) => PngCanvas | null;
}

function defaultCreateCanvas(width: number, height: number): PngCanvas | null {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToPng(canvas: PngCanvas): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Der Browser konnte kein PNG erzeugen."));
      },
      "image/png"
    );
  });
}

function assertRgba(image: RgbaImage): void {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0 ||
    !(image.pixels instanceof Uint8ClampedArray) ||
    image.pixels.length !== image.width * image.height * 4
  ) {
    throw new RangeError("PNG encoding requires complete native RGBA pixels.");
  }
}

export class BrowserPngEncoder implements PngEncoder {
  public constructor(
    private readonly environment: BrowserPngEncoderEnvironment = {
      createCanvas: defaultCreateCanvas
    }
  ) {}

  public async encode(image: RgbaImage): Promise<Blob> {
    assertRgba(image);
    const canvas = this.environment.createCanvas(image.width, image.height);
    if (!canvas) throw new Error("PNG-Canvas ist in diesem Browser nicht verfügbar.");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D ist für den PNG-Export nicht verfügbar.");
    context.imageSmoothingEnabled = false;
    const imageData = context.createImageData(image.width, image.height);
    imageData.data.set(image.pixels);
    context.putImageData(imageData, 0, 0);
    const blob = await canvasToPng(canvas);
    if (blob.type && blob.type !== "image/png") {
      throw new Error(`Der Browser lieferte den unerwarteten Typ ${blob.type}.`);
    }
    return blob;
  }
}

export function createBrowserPngEncoder(
  environment?: BrowserPngEncoderEnvironment
): PngEncoder {
  return environment
    ? new BrowserPngEncoder(environment)
    : new BrowserPngEncoder();
}
