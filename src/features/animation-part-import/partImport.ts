import {
  cropRgba,
  findAlphaBounds,
  hasOpaqueOuterEdge,
  type RgbaImage
} from "../../domain/animation";
import {
  MAX_ANIMATION_SOURCE_DIMENSION,
  MAX_ANIMATION_SOURCE_FILE_BYTES,
  type ValidatedAnimationSize,
  type ValidatedAnimationTrimRect
} from "../../schemas";
import { ImageDecodingError, type ImageDecoder } from "../../services";

export const PNG_MIME_TYPE = "image/png" as const;
export const PNG_SIGNATURE = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10] as const);

export type PartImportWarning = "opaqueOuterEdge";

export interface PreparedAnimationPartImport {
  readonly originalBlob: Blob;
  readonly fileName: string;
  readonly sourceSize: ValidatedAnimationSize;
  readonly decodedRgba: RgbaImage;
  readonly trimRect: ValidatedAnimationTrimRect;
  readonly trimmedRgba: RgbaImage;
  readonly warnings: readonly PartImportWarning[];
}

export type PartImportErrorCode =
  | "notFile"
  | "wrongMimeType"
  | "emptyFile"
  | "fileTooLarge"
  | "invalidPngSignature"
  | "undecodablePng"
  | "invalidDimensions"
  | "dimensionsTooLarge"
  | "invalidPixelBuffer"
  | "fullyTransparent";

export type PartImportPreparationResult =
  | Readonly<{ status: "ok"; value: PreparedAnimationPartImport }>
  | Readonly<{ status: "invalid"; code: PartImportErrorCode; message: string }>;

interface NamedBlob extends Blob {
  readonly name: string;
}

function isNamedBlob(input: unknown): input is NamedBlob {
  if (typeof input !== "object" || input === null) return false;
  try {
    const candidate = input as Partial<NamedBlob>;
    return (
      typeof candidate.name === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.size === "number" &&
      Number.isFinite(candidate.size) &&
      candidate.size >= 0 &&
      typeof candidate.slice === "function" &&
      typeof candidate.arrayBuffer === "function"
    );
  } catch {
    return false;
  }
}

function invalid(
  code: PartImportErrorCode,
  message: string
): PartImportPreparationResult {
  return { status: "invalid", code, message };
}

async function hasPngSignature(blob: Blob): Promise<boolean> {
  try {
    const signature = new Uint8Array(await blob.slice(0, PNG_SIGNATURE.length).arrayBuffer());
    return (
      signature.length === PNG_SIGNATURE.length &&
      PNG_SIGNATURE.every((byte, index) => signature[index] === byte)
    );
  } catch {
    return false;
  }
}

function validateDecodedImage(image: RgbaImage): PartImportPreparationResult | null {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return invalid("invalidDimensions", "Die PNG-Datei besitzt keine gültigen Bildmaße.");
  }
  if (
    image.width > MAX_ANIMATION_SOURCE_DIMENSION ||
    image.height > MAX_ANIMATION_SOURCE_DIMENSION
  ) {
    return invalid(
      "dimensionsTooLarge",
      `PNG-Dateien dürfen höchstens ${MAX_ANIMATION_SOURCE_DIMENSION} × ${MAX_ANIMATION_SOURCE_DIMENSION} px groß sein.`
    );
  }
  if (image.pixels.length !== image.width * image.height * 4) {
    return invalid("invalidPixelBuffer", "Die decodierten RGBA-Daten sind unvollständig.");
  }
  return null;
}

export async function prepareAnimationPartImport(
  input: unknown,
  decoder: ImageDecoder
): Promise<PartImportPreparationResult> {
  if (!isNamedBlob(input)) {
    return invalid("notFile", "Wähle eine lokale PNG-Datei aus.");
  }
  if (input.type.toLowerCase() !== PNG_MIME_TYPE) {
    return invalid("wrongMimeType", "Nur Dateien mit dem MIME-Typ image/png sind erlaubt.");
  }
  if (input.size <= 0) {
    return invalid("emptyFile", "Die PNG-Datei ist leer.");
  }
  if (input.size > MAX_ANIMATION_SOURCE_FILE_BYTES) {
    return invalid("fileTooLarge", "PNG-Dateien dürfen höchstens 16 MiB groß sein.");
  }
  if (!(await hasPngSignature(input))) {
    return invalid("invalidPngSignature", "Die Datei besitzt keine gültige PNG-Signatur.");
  }

  let decoded: RgbaImage;
  try {
    decoded = await decoder.decode(input);
  } catch (error) {
    if (error instanceof ImageDecodingError) {
      if (error.code === "dimensionsTooLarge") {
        return invalid(
          "dimensionsTooLarge",
          `PNG-Dateien dürfen höchstens ${MAX_ANIMATION_SOURCE_DIMENSION} × ${MAX_ANIMATION_SOURCE_DIMENSION} px groß sein.`
        );
      }
      if (error.code === "invalidDimensions") {
        return invalid("invalidDimensions", "Die PNG-Datei besitzt keine gültigen Bildmaße.");
      }
    }
    return invalid("undecodablePng", "Die PNG-Datei ist beschädigt oder nicht decodierbar.");
  }
  const decodedFailure = validateDecodedImage(decoded);
  if (decodedFailure) return decodedFailure;

  let trimRect: ValidatedAnimationTrimRect | null;
  try {
    trimRect = findAlphaBounds(decoded);
  } catch {
    return invalid("invalidPixelBuffer", "Die decodierten RGBA-Daten sind ungültig.");
  }
  if (!trimRect) {
    return invalid("fullyTransparent", "Die PNG-Datei enthält kein sichtbares Pixel.");
  }

  const warnings: readonly PartImportWarning[] = hasOpaqueOuterEdge(decoded)
    ? Object.freeze(["opaqueOuterEdge"])
    : Object.freeze([]);
  return {
    status: "ok",
    value: Object.freeze({
      originalBlob: input,
      fileName: input.name,
      sourceSize: Object.freeze({ width: decoded.width, height: decoded.height }),
      decodedRgba: decoded,
      trimRect,
      trimmedRgba: cropRgba(decoded, trimRect),
      warnings
    })
  };
}

export function partLabelFromFileName(fileName: string): string {
  const withoutExtension = fileName.trim().replace(/\.png$/iu, "").trim();
  return (withoutExtension || "PNG-Teil").slice(0, 120);
}
