import type { RgbaImage } from "../../domain/animation";
import { MAX_ANIMATION_SOURCE_DIMENSION } from "../../schemas";
import { ImageDecodingError, type ImageDecoder } from "./imageDecoder";

export interface BrowserImageDecoderEnvironment {
  readonly createImageBitmap?: (blob: Blob) => Promise<ImageBitmap>;
  readonly createCanvas: (width: number, height: number) => HTMLCanvasElement;
  readonly createImageElement: () => HTMLImageElement;
  readonly createObjectURL: (blob: Blob) => string;
  readonly revokeObjectURL: (url: string) => void;
}

function defaultEnvironment(): BrowserImageDecoderEnvironment {
  const bitmapFactory =
    typeof globalThis.createImageBitmap === "function"
      ? (blob: Blob) => globalThis.createImageBitmap(blob)
      : undefined;
  return {
    ...(bitmapFactory ? { createImageBitmap: bitmapFactory } : {}),
    createCanvas(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    },
    createImageElement: () => document.createElement("img"),
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url)
  };
}

function sourceDimensions(source: CanvasImageSource): Readonly<{
  width: number;
  height: number;
}> {
  if (
    typeof HTMLVideoElement !== "undefined" &&
    source instanceof HTMLVideoElement
  ) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (typeof VideoFrame !== "undefined" && source instanceof VideoFrame) {
    return { width: source.displayWidth, height: source.displayHeight };
  }
  const sizedSource = source as Exclude<
    CanvasImageSource,
    HTMLVideoElement | VideoFrame
  >;
  if (
    typeof SVGImageElement !== "undefined" &&
    sizedSource instanceof SVGImageElement
  ) {
    return {
      width: sizedSource.width.baseVal.value,
      height: sizedSource.height.baseVal.value
    };
  }
  const numericSize = sizedSource as Readonly<{ width: number; height: number }>;
  return { width: numericSize.width, height: numericSize.height };
}

function extractRgba(
  source: CanvasImageSource,
  environment: BrowserImageDecoderEnvironment
): RgbaImage {
  const { width, height } = sourceDimensions(source);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new ImageDecodingError(
      "invalidDimensions",
      "Die PNG-Datei besitzt keine gültigen Bildmaße."
    );
  }
  if (
    width > MAX_ANIMATION_SOURCE_DIMENSION ||
    height > MAX_ANIMATION_SOURCE_DIMENSION
  ) {
    throw new ImageDecodingError(
      "dimensionsTooLarge",
      `Die PNG-Datei überschreitet ${MAX_ANIMATION_SOURCE_DIMENSION} × ${MAX_ANIMATION_SOURCE_DIMENSION} px.`
    );
  }
  const canvas = environment.createCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new ImageDecodingError(
      "canvasUnavailable",
      "Der Browser konnte keinen 2D-Decodierkontext bereitstellen."
    );
  }
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0);
  const pixels = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
  return Object.freeze({ width, height, pixels });
}

async function decodeWithImageElement(
  blob: Blob,
  environment: BrowserImageDecoderEnvironment
): Promise<RgbaImage> {
  const objectUrl = environment.createObjectURL(blob);
  try {
    const image = environment.createImageElement();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new ImageDecodingError(
            "undecodable",
            "Die PNG-Datei ist nicht decodierbar."
          )
        );
      image.src = objectUrl;
    });
    return extractRgba(image, environment);
  } finally {
    environment.revokeObjectURL(objectUrl);
  }
}

export class BrowserImageDecoder implements ImageDecoder {
  public constructor(
    private readonly environment: BrowserImageDecoderEnvironment = defaultEnvironment()
  ) {}

  public async decode(blob: Blob): Promise<RgbaImage> {
    let bitmapFailure: unknown;
    if (this.environment.createImageBitmap) {
      try {
        const bitmap = await this.environment.createImageBitmap(blob);
        try {
          return extractRgba(bitmap, this.environment);
        } finally {
          bitmap.close();
        }
      } catch (error) {
        if (
          error instanceof ImageDecodingError &&
          (error.code === "invalidDimensions" ||
            error.code === "dimensionsTooLarge")
        ) {
          throw error;
        }
        bitmapFailure = error;
      }
    }

    try {
      return await decodeWithImageElement(blob, this.environment);
    } catch (error) {
      if (
        error instanceof ImageDecodingError &&
        (error.code === "invalidDimensions" ||
          error.code === "dimensionsTooLarge")
      ) {
        throw error;
      }
      throw new ImageDecodingError("undecodable", "Die PNG-Datei konnte nicht sicher decodiert werden.", {
        cause: error ?? bitmapFailure
      });
    }
  }
}

export function createBrowserImageDecoder(
  environment?: BrowserImageDecoderEnvironment
): ImageDecoder {
  return environment
    ? new BrowserImageDecoder(environment)
    : new BrowserImageDecoder();
}
