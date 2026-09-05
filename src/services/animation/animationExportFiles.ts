import { strToU8, zipSync } from "fflate";
import {
  composeSpriteSheet,
  createAnimationFrameFileName,
  type SpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import type { SpriteSheetMetadata } from "../../schemas";
import type { PngEncoder } from "./browserPngEncoder";

export type AnimationExportJobState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "validating" }>
  | Readonly<{ status: "rendering"; completed: number; total: number }>
  | Readonly<{ status: "encoding"; completed: number; total: number }>
  | Readonly<{ status: "packaging" }>
  | Readonly<{ status: "completed"; files: readonly ExportedAnimationFile[] }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "failed"; message: string }>;

export interface ExportedAnimationFile {
  readonly name: string;
  readonly blob: Blob;
}

export class AnimationExportCancelledError extends Error {
  public constructor() {
    super("Der Export wurde abgebrochen.");
    this.name = "AnimationExportCancelledError";
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AnimationExportCancelledError();
}

export function createMetadataJsonBlob(metadata: SpriteSheetMetadata): Blob {
  return new Blob([`${JSON.stringify(metadata, null, 2)}\n`], {
    type: "application/json"
  });
}

export async function createSpriteSheetPng(
  layout: SpriteSheetLayout,
  frames: readonly SpriteSheetSourceFrame[],
  encoder: PngEncoder,
  signal?: AbortSignal
): Promise<Blob> {
  throwIfAborted(signal);
  const sheet = composeSpriteSheet(layout, frames);
  throwIfAborted(signal);
  const png = await encoder.encode(sheet);
  throwIfAborted(signal);
  return png;
}

export async function createIndividualFrameArchive(input: Readonly<{
  frames: readonly SpriteSheetSourceFrame[];
  metadata: SpriteSheetMetadata;
  encoder: PngEncoder;
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number) => void;
}>): Promise<Blob> {
  const ordered = [...input.frames].sort(
    (left, right) =>
      input.metadata.directions.indexOf(left.direction) -
        input.metadata.directions.indexOf(right.direction) ||
      left.frameIndex - right.frameIndex
  );
  const expectedAddresses = new Set(
    input.metadata.animations.flatMap((animation) =>
      animation.frames.map((frame) => `${animation.direction}:${frame.index}`)
    )
  );
  const actualAddresses = new Set(
    ordered.map((frame) => `${frame.direction}:${frame.frameIndex}`)
  );
  if (
    ordered.length !== 64 ||
    actualAddresses.size !== 64 ||
    expectedAddresses.size !== 64 ||
    [...expectedAddresses].some((address) => !actualAddresses.has(address))
  ) {
    throw new RangeError("Individual-frame export requires exactly 64 canonical frames.");
  }
  const entries: Record<string, Uint8Array> = {};
  for (let index = 0; index < ordered.length; index += 1) {
    throwIfAborted(input.signal);
    const source = ordered[index]!;
    const blob = await input.encoder.encode(source.frame);
    throwIfAborted(input.signal);
    entries[`frames/${createAnimationFrameFileName(source.direction, source.frameIndex)}`] =
      new Uint8Array(await blob.arrayBuffer());
    input.onProgress?.(index + 1, ordered.length);
  }
  entries["frames/metadata.json"] = strToU8(
    `${JSON.stringify(input.metadata, null, 2)}\n`
  );
  throwIfAborted(input.signal);
  const archive = zipSync(entries, {
    level: 6,
    mtime: new Date("1980-01-01T00:00:00.000Z")
  });
  throwIfAborted(input.signal);
  return new Blob([archive], { type: "application/zip" });
}
