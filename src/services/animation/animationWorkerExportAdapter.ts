import { zipSync } from "fflate";
import {
  composeSpriteSheet,
  type RgbaImage,
  type SpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import type { StableId } from "../../schemas";
import {
  ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
  type AnimationExportWorkerStage
} from "../../workers/animationExportProtocol";
import type { PngEncoder } from "./browserPngEncoder";
import type { AnimationExportWorkerController } from "./animationExportWorkerController";

export interface AnimationWorkerExportIdentity {
  readonly projectId: StableId;
  readonly projectRevision: number;
  readonly nextJobId: (operation: string) => string;
  readonly currentProjectRevision: () => number;
}

export interface AnimationWorkerExportProgress {
  readonly stage: AnimationExportWorkerStage;
  readonly completed: number;
  readonly total: number;
}

export interface PreparedBinaryFile {
  readonly name: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
}

interface WorkerOperationOptions {
  readonly controller: AnimationExportWorkerController | null;
  readonly identity: AnimationWorkerExportIdentity;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: AnimationWorkerExportProgress) => void;
}

function progressOptions(options: WorkerOperationOptions) {
  return {
    ...(options.signal ? { signal: options.signal } : {}),
    currentProjectRevision: options.identity.currentProjectRevision,
    onProgress: ({ stage, completed, total }: AnimationWorkerExportProgress) =>
      options.onProgress?.({ stage, completed, total })
  };
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function composeSpriteSheetForExport(
  layout: SpriteSheetLayout,
  frames: readonly SpriteSheetSourceFrame[],
  options: WorkerOperationOptions
): Promise<RgbaImage> {
  assertNotAborted(options.signal);
  if (!options.controller) {
    options.onProgress?.({ stage: "rendering", completed: 0, total: 64 });
    await nextTask();
    assertNotAborted(options.signal);
    const image = composeSpriteSheet(layout, frames);
    options.onProgress?.({ stage: "rendering", completed: 64, total: 64 });
    return image;
  }
  const completed = await options.controller.run(
    {
      protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
      type: "composeSpriteSheet",
      jobId: options.identity.nextJobId("compose"),
      projectId: options.identity.projectId,
      projectRevision: options.identity.projectRevision,
      payload: { layout, frames }
    },
    progressOptions(options)
  );
  if (completed.result.kind !== "composeSpriteSheet") {
    throw new Error("Der Worker lieferte kein SpriteSheet.");
  }
  return completed.result.image;
}

export async function encodeImagesForExport(
  images: readonly Readonly<{ name: string; image: RgbaImage }>[],
  encoder: PngEncoder,
  options: WorkerOperationOptions
): Promise<readonly PreparedBinaryFile[]> {
  assertNotAborted(options.signal);
  if (options.controller) {
    const completed = await options.controller.run(
      {
        protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
        type: "prepareExport",
        jobId: options.identity.nextJobId("encode"),
        projectId: options.identity.projectId,
        projectRevision: options.identity.projectRevision,
        payload: { images }
      },
      progressOptions(options)
    );
    if (completed.result.kind !== "prepareExport") {
      throw new Error("Der Worker lieferte keine Exportdaten.");
    }
    if (completed.result.encoding === "worker") {
      return Object.freeze(completed.result.files.map((file) => Object.freeze(file)));
    }
    images = completed.result.images;
  }

  const files: PreparedBinaryFile[] = [];
  options.onProgress?.({ stage: "encoding", completed: 0, total: images.length });
  for (let index = 0; index < images.length; index += 1) {
    assertNotAborted(options.signal);
    await nextTask();
    const source = images[index]!;
    const blob = await encoder.encode(source.image);
    assertNotAborted(options.signal);
    files.push(
      Object.freeze({
        name: source.name,
        mimeType: blob.type || "image/png",
        bytes: new Uint8Array(await blob.arrayBuffer())
      })
    );
    options.onProgress?.({
      stage: "encoding",
      completed: index + 1,
      total: images.length
    });
  }
  return Object.freeze(files);
}

export async function packageFilesForExport(
  entries: readonly Readonly<{ path: string; bytes: Uint8Array }>[],
  mimeType: string,
  options: WorkerOperationOptions
): Promise<Blob> {
  assertNotAborted(options.signal);
  if (options.controller) {
    const completed = await options.controller.run(
      {
        protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
        type: "packageBundle",
        jobId: options.identity.nextJobId("package"),
        projectId: options.identity.projectId,
        projectRevision: options.identity.projectRevision,
        payload: { entries, mimeType }
      },
      progressOptions(options)
    );
    if (completed.result.kind !== "packageBundle") {
      throw new Error("Der Worker lieferte kein vollständiges Paket.");
    }
    return new Blob([Uint8Array.from(completed.result.archive).buffer], {
      type: completed.result.mimeType
    });
  }
  options.onProgress?.({ stage: "packaging", completed: 0, total: 1 });
  await nextTask();
  assertNotAborted(options.signal);
  const byPath: Record<string, Uint8Array> = {};
  for (const entry of entries) byPath[entry.path] = entry.bytes;
  const archive = zipSync(byPath, {
    level: 6,
    mtime: new Date("1980-01-01T00:00:00.000Z")
  });
  options.onProgress?.({ stage: "packaging", completed: 1, total: 1 });
  return new Blob([archive], { type: mimeType });
}
