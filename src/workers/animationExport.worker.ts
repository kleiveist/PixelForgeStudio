import { zipSync } from "fflate";
import {
  DIRECTION_IDS,
  composeSpriteSheet,
  getBuiltInRigTemplate,
  type RgbaImage
} from "../domain/animation";
import {
  finalizeEightDirectionWalkGeneration,
  generateDirectionalFrames
} from "../features/animation-workspace/directionalWalkRenderer";
import {
  ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
  type AnimationExportWorkerJobRequest,
  type AnimationExportWorkerOperation,
  type AnimationExportWorkerRequest,
  type AnimationWorkerIdentity
} from "./animationExportProtocol";

interface WorkerMessageEvent {
  readonly data: AnimationExportWorkerRequest;
}

interface WorkerScope {
  addEventListener(type: "message", listener: (event: WorkerMessageEvent) => void): void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

const scope = globalThis as unknown as WorkerScope;
const cancelledJobs = new Set<string>();
const ZIP_TIMESTAMP = new Date("1980-01-01T00:00:00.000Z");

function operation(request: AnimationExportWorkerJobRequest): AnimationExportWorkerOperation {
  return request.type;
}

function responseIdentity(request: AnimationWorkerIdentity) {
  return {
    protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
    jobId: request.jobId,
    projectId: request.projectId,
    projectRevision: request.projectRevision
  } as const;
}

function postProgress(
  request: AnimationExportWorkerJobRequest,
  stage: "validating" | "rendering" | "encoding" | "packaging",
  completed: number,
  total: number
): void {
  scope.postMessage({
    ...responseIdentity(request),
    type: "progress",
    operation: operation(request),
    stage,
    completed,
    total
  });
}

function throwIfCancelled(request: AnimationExportWorkerJobRequest): void {
  if (cancelledJobs.has(request.jobId)) throw new Error("__cancelled__");
}

function yieldToWorker(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function assertImage(image: RgbaImage): void {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0 ||
    !(image.pixels instanceof Uint8ClampedArray) ||
    image.pixels.length !== image.width * image.height * 4
  ) {
    throw new RangeError("Worker received malformed RGBA pixels.");
  }
}

async function encodePng(image: RgbaImage): Promise<Uint8Array | null> {
  if (typeof OffscreenCanvas === "undefined") return null;
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  if (!context || typeof canvas.convertToBlob !== "function") return null;
  context.imageSmoothingEnabled = false;
  const data = context.createImageData(image.width, image.height);
  data.data.set(image.pixels);
  context.putImageData(data, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

async function handleRenderFrames(request: Extract<AnimationExportWorkerJobRequest, { type: "renderFrames" }>) {
  postProgress(request, "validating", 0, 1);
  const template = getBuiltInRigTemplate(request.payload.project.rigTemplateId);
  if (!template) throw new Error("Die angeforderte Rigvorlage ist nicht verfügbar.");
  postProgress(request, "rendering", 0, 64);
  const generated = [];
  for (let index = 0; index < DIRECTION_IDS.length; index += 1) {
    throwIfCancelled(request);
    const direction = DIRECTION_IDS[index]!;
    generated.push(
      generateDirectionalFrames(
        request.payload.project,
        template,
        direction,
        request.payload.partAssets,
        request.payload.decodedSources,
        request.payload.clipId
      )
    );
    postProgress(request, "rendering", (index + 1) * 8, 64);
    await yieldToWorker();
  }
  const result = finalizeEightDirectionWalkGeneration(request.payload.project, generated);
  if (result.status === "invalid") {
    throw new Error(result.issues.map(({ message }) => message).join(" "));
  }
  return {
    kind: "renderFrames" as const,
    frames: result.frames,
    diagnostics: result.diagnostics
  };
}

async function handleCompose(request: Extract<AnimationExportWorkerJobRequest, { type: "composeSpriteSheet" }>) {
  postProgress(request, "validating", 0, 1);
  throwIfCancelled(request);
  postProgress(request, "rendering", 0, 64);
  await yieldToWorker();
  const image = composeSpriteSheet(request.payload.layout, request.payload.frames);
  postProgress(request, "rendering", 64, 64);
  return { kind: "composeSpriteSheet" as const, image };
}

async function handlePrepareExport(request: Extract<AnimationExportWorkerJobRequest, { type: "prepareExport" }>) {
  postProgress(request, "validating", 0, 1);
  request.payload.images.forEach(({ image }) => assertImage(image));
  const files: Array<{ name: string; mimeType: "image/png"; bytes: Uint8Array }> = [];
  postProgress(request, "encoding", 0, request.payload.images.length);
  for (let index = 0; index < request.payload.images.length; index += 1) {
    throwIfCancelled(request);
    const source = request.payload.images[index]!;
    const bytes = await encodePng(source.image);
    if (!bytes) {
      return {
        kind: "prepareExport" as const,
        encoding: "fallback" as const,
        images: request.payload.images
      };
    }
    files.push({ name: source.name, mimeType: "image/png", bytes });
    postProgress(request, "encoding", index + 1, request.payload.images.length);
    await yieldToWorker();
  }
  return { kind: "prepareExport" as const, encoding: "worker" as const, files };
}

async function handlePackage(request: Extract<AnimationExportWorkerJobRequest, { type: "packageBundle" }>) {
  postProgress(request, "packaging", 0, 1);
  await yieldToWorker();
  throwIfCancelled(request);
  const entries: Record<string, Uint8Array> = {};
  for (const entry of request.payload.entries) {
    if (!entry.path || entry.path.startsWith("/") || entry.path.includes("..") || entry.path.includes("\\")) {
      throw new RangeError(`Unsicherer Worker-Paketpfad: ${entry.path}`);
    }
    if (entries[entry.path]) throw new RangeError(`Doppelter Worker-Paketpfad: ${entry.path}`);
    entries[entry.path] = entry.bytes;
  }
  const archive = zipSync(entries, { level: 6, mtime: ZIP_TIMESTAMP });
  postProgress(request, "packaging", 1, 1);
  return { kind: "packageBundle" as const, archive, mimeType: request.payload.mimeType };
}

async function run(request: AnimationExportWorkerJobRequest): Promise<void> {
  try {
    const result =
      request.type === "renderFrames"
        ? await handleRenderFrames(request)
        : request.type === "composeSpriteSheet"
          ? await handleCompose(request)
          : request.type === "prepareExport"
            ? await handlePrepareExport(request)
            : await handlePackage(request);
    throwIfCancelled(request);
    scope.postMessage({
      ...responseIdentity(request),
      type: "completed",
      operation: operation(request),
      result
    });
  } catch (error) {
    scope.postMessage({
      ...responseIdentity(request),
      type: cancelledJobs.has(request.jobId) || (error instanceof Error && error.message === "__cancelled__")
        ? "cancelled"
        : "failed",
      operation: operation(request),
      ...(cancelledJobs.has(request.jobId) || (error instanceof Error && error.message === "__cancelled__")
        ? {}
        : { message: error instanceof Error ? error.message : "Der Workerjob ist fehlgeschlagen." })
    });
  } finally {
    cancelledJobs.delete(request.jobId);
  }
}

scope.addEventListener("message", (event) => {
  const request = event.data;
  if (!request || request.protocolVersion !== ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION) return;
  if (request.type === "cancel") {
    cancelledJobs.add(request.jobId);
    return;
  }
  void run(request);
});
