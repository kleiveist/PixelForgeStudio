import type { RgbaImage } from "../../domain/animation";

export interface ImageDecoder {
  decode(blob: Blob): Promise<RgbaImage>;
}

export type ImageDecodingErrorCode =
  | "undecodable"
  | "invalidDimensions"
  | "dimensionsTooLarge"
  | "canvasUnavailable";

export class ImageDecodingError extends Error {
  public constructor(
    public readonly code: ImageDecodingErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ImageDecodingError";
  }
}
