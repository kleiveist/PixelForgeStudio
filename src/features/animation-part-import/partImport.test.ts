import { describe, expect, it, vi } from "vitest";
import type { RgbaImage } from "../../domain/animation";
import { MAX_ANIMATION_SOURCE_FILE_BYTES } from "../../schemas";
import type { ImageDecoder } from "../../services";
import {
  PNG_SIGNATURE,
  partLabelFromFileName,
  prepareAnimationPartImport
} from "./partImport";

function pngFile(name = "head.png", type = "image/png", extra: BlobPart[] = []): File {
  return new File([new Uint8Array(PNG_SIGNATURE), ...extra], name, { type });
}

function rgba(width: number, height: number, alphas: readonly number[]): RgbaImage {
  const pixels = new Uint8ClampedArray(width * height * 4);
  alphas.forEach((alpha, index) => {
    pixels[index * 4 + 3] = alpha;
  });
  return { width, height, pixels };
}

function decoder(value: RgbaImage): ImageDecoder {
  return { decode: vi.fn().mockResolvedValue(value) };
}

describe("prepareAnimationPartImport", () => {
  it("keeps the original PNG and separates decoded RGBA, trim and warning data", async () => {
    const file = pngFile();
    const result = await prepareAnimationPartImport(
      file,
      decoder(rgba(3, 3, [255, 0, 0, 0, 100, 0, 0, 0, 0]))
    );

    expect(result).toMatchObject({
      status: "ok",
      value: {
        originalBlob: file,
        fileName: "head.png",
        sourceSize: { width: 3, height: 3 },
        trimRect: { x: 0, y: 0, width: 2, height: 2 },
        trimmedRgba: { width: 2, height: 2 },
        warnings: ["opaqueOuterEdge"]
      }
    });
  });

  it("rejects non-files, wrong MIME, invalid signatures and undecodable PNG data", async () => {
    const validDecoder = decoder(rgba(1, 1, [255]));
    await expect(prepareAnimationPartImport({}, validDecoder)).resolves.toMatchObject({ code: "notFile" });
    await expect(prepareAnimationPartImport(pngFile("head.jpg", "image/jpeg"), validDecoder)).resolves.toMatchObject({ code: "wrongMimeType" });
    await expect(prepareAnimationPartImport(new File(["not png"], "head.png", { type: "image/png" }), validDecoder)).resolves.toMatchObject({ code: "invalidPngSignature" });
    await expect(
      prepareAnimationPartImport(pngFile(), { decode: vi.fn().mockRejectedValue(new Error("decode")) })
    ).resolves.toMatchObject({ code: "undecodablePng" });
  });

  it("rejects file, dimensions, pixel buffer and visibility limits", async () => {
    const tooLarge = pngFile(
      "huge.png",
      "image/png",
      [new Uint8Array(MAX_ANIMATION_SOURCE_FILE_BYTES)]
    );
    await expect(prepareAnimationPartImport(tooLarge, decoder(rgba(1, 1, [255])))).resolves.toMatchObject({ code: "fileTooLarge" });
    await expect(prepareAnimationPartImport(pngFile(), decoder(rgba(2049, 1, new Array(2049).fill(255))))).resolves.toMatchObject({ code: "dimensionsTooLarge" });
    await expect(prepareAnimationPartImport(pngFile(), decoder({ width: 2, height: 2, pixels: new Uint8ClampedArray(4) }))).resolves.toMatchObject({ code: "invalidPixelBuffer" });
    await expect(prepareAnimationPartImport(pngFile(), decoder(rgba(2, 2, [0, 1, 0, 0])))).resolves.toMatchObject({ code: "fullyTransparent" });
  });

  it("derives a bounded user label without changing the persisted filename", () => {
    expect(partLabelFromFileName(" hero-head.PNG ")).toBe("hero-head");
    expect(partLabelFromFileName(".png")).toBe("PNG-Teil");
    expect(partLabelFromFileName(`${"x".repeat(140)}.png`)).toHaveLength(120);
  });
});
