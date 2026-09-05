import { describe, expect, it, vi } from "vitest";
import type { StableId } from "../../schemas";
import { ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION } from "../../workers/animationExportProtocol";
import {
  AnimationExportWorkerController,
  AnimationWorkerCancelledError,
  StaleAnimationWorkerResultError,
  type AnimationWorkerMessageEvent,
  type AnimationWorkerPort
} from "./animationExportWorkerController";

class FakeWorker implements AnimationWorkerPort {
  readonly sent: unknown[] = [];
  readonly terminate = vi.fn();
  private listeners = new Set<(event: AnimationWorkerMessageEvent) => void>();

  postMessage(message: unknown): void {
    this.sent.push(message);
  }

  addEventListener(
    _type: "message",
    listener: (event: AnimationWorkerMessageEvent) => void
  ): void {
    this.listeners.add(listener);
  }

  removeEventListener(
    _type: "message",
    listener: (event: AnimationWorkerMessageEvent) => void
  ): void {
    this.listeners.delete(listener);
  }

  emit(data: unknown): void {
    for (const listener of this.listeners) listener({ data });
  }
}

function request() {
  return {
    protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
    type: "composeSpriteSheet" as const,
    jobId: "job-compose-1",
    projectId: "project_worker" as StableId,
    projectRevision: 7,
    payload: {
      layout: {
        frameSize: { width: 1, height: 1 },
        frameCount: 64,
        capacity: 64,
        columns: 8,
        rows: 8,
        margin: 0,
        spacing: 0,
        sheetWidth: 8,
        sheetHeight: 8,
        directions: [],
        cells: []
      },
      frames: []
    }
  };
}

function messageBase() {
  return {
    protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
    jobId: "job-compose-1",
    projectId: "project_worker",
    projectRevision: 7,
    operation: "composeSpriteSheet"
  } as const;
}

describe("AnimationExportWorkerController", () => {
  it("forwards real 0-to-64 progress and resolves only the matching versioned job", async () => {
    const worker = new FakeWorker();
    const controller = new AnimationExportWorkerController(worker);
    const onProgress = vi.fn();
    const pending = controller.run(request(), { onProgress });
    worker.emit({ ...messageBase(), protocolVersion: 99, type: "completed", result: {} });
    worker.emit({
      ...messageBase(),
      type: "progress",
      stage: "rendering",
      completed: 0,
      total: 64
    });
    worker.emit({
      ...messageBase(),
      type: "progress",
      stage: "rendering",
      completed: 64,
      total: 64
    });
    worker.emit({
      ...messageBase(),
      type: "completed",
      result: {
        kind: "composeSpriteSheet",
        image: { width: 1, height: 1, pixels: new Uint8ClampedArray(4) }
      }
    });

    await expect(pending).resolves.toEqual(
      expect.objectContaining({ type: "completed", operation: "composeSpriteSheet" })
    );
    expect(onProgress).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ completed: 0, total: 64 })
    );
    expect(onProgress).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ completed: 64, total: 64 })
    );
  });

  it("sends cancel and rejects without accepting a later partial result", async () => {
    const worker = new FakeWorker();
    const controller = new AnimationExportWorkerController(worker);
    const abort = new AbortController();
    const pending = controller.run(request(), { signal: abort.signal });
    abort.abort();
    await expect(pending).rejects.toBeInstanceOf(AnimationWorkerCancelledError);
    expect(worker.sent).toHaveLength(2);
    expect(worker.sent[1]).toEqual(
      expect.objectContaining({
        protocolVersion: 1,
        type: "cancel",
        jobId: "job-compose-1"
      })
    );
    worker.emit({ ...messageBase(), type: "completed", result: {} });
  });

  it("discards a completed result after the project revision changed", async () => {
    const worker = new FakeWorker();
    const controller = new AnimationExportWorkerController(worker);
    let revision = 7;
    const pending = controller.run(request(), {
      currentProjectRevision: () => revision
    });
    revision = 8;
    worker.emit({
      ...messageBase(),
      type: "completed",
      result: {
        kind: "composeSpriteSheet",
        image: { width: 1, height: 1, pixels: new Uint8ClampedArray(4) }
      }
    });
    await expect(pending).rejects.toBeInstanceOf(StaleAnimationWorkerResultError);
    expect(worker.sent.at(-1)).toEqual(expect.objectContaining({ type: "cancel" }));
  });

  it("surfaces worker failures and terminates all remaining work", async () => {
    const worker = new FakeWorker();
    const controller = new AnimationExportWorkerController(worker);
    const failed = controller.run(request());
    worker.emit({ ...messageBase(), type: "failed", message: "render exploded" });
    await expect(failed).rejects.toThrow("render exploded");

    const remaining = controller.run({ ...request(), jobId: "job-compose-2" });
    controller.terminate();
    await expect(remaining).rejects.toBeInstanceOf(AnimationWorkerCancelledError);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
