import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AnimationFrameScheduler } from "./animationPlayback";
import { useAnimationPlayback } from "./useAnimationPlayback";

class FakeAnimationFrameScheduler implements AnimationFrameScheduler {
  currentTime = 0;
  nextHandle = 1;
  callbacks = new Map<number, (timestamp: number) => void>();
  cancelled: number[] = [];

  now = () => this.currentTime;

  requestFrame = (callback: (timestamp: number) => void) => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.callbacks.set(handle, callback);
    return handle;
  };

  cancelFrame = (handle: number) => {
    this.cancelled.push(handle);
    this.callbacks.delete(handle);
  };

  tick(timestamp: number) {
    this.currentTime = timestamp;
    const pending = [...this.callbacks.values()];
    this.callbacks.clear();
    pending.forEach((callback) => callback(timestamp));
  }
}

describe("useAnimationPlayback", () => {
  it("plays at 10 FPS, pauses, stops and steps manually", () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const onFrameChange = vi.fn();
    const { result } = renderHook(() => {
      const [frameIndex, setFrameIndex] = useState(0);
      return useAnimationPlayback({
        identity: "project-a:clip-a:south",
        enabled: true,
        frameIndex,
        frameCount: 8,
        fps: 10,
        loop: true,
        onFrameChange: (nextFrame) => {
          onFrameChange(nextFrame);
          setFrameIndex(nextFrame);
        },
        scheduler
      });
    });

    expect(result.current.isPlaying).toBe(false);
    expect(scheduler.callbacks.size).toBe(0);
    act(() => result.current.play());
    expect(result.current.isPlaying).toBe(true);
    expect(scheduler.callbacks.size).toBe(1);

    act(() => scheduler.tick(99));
    expect(onFrameChange).not.toHaveBeenCalled();
    act(() => scheduler.tick(100));
    expect(onFrameChange).toHaveBeenLastCalledWith(1);

    act(() => result.current.pause());
    expect(result.current.isPlaying).toBe(false);
    expect(scheduler.callbacks.size).toBe(0);
    act(() => result.current.next());
    expect(onFrameChange).toHaveBeenLastCalledWith(2);
    act(() => result.current.previous());
    expect(onFrameChange).toHaveBeenLastCalledWith(1);
    act(() => result.current.stop());
    expect(onFrameChange).toHaveBeenLastCalledWith(0);
  });

  it("catches up a delayed tick and loops frame seven to zero", () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const onFrameChange = vi.fn();
    const { result } = renderHook(() =>
      useAnimationPlayback({
        identity: "project-a:clip-a:south",
        enabled: true,
        frameIndex: 7,
        frameCount: 8,
        fps: 10,
        loop: true,
        onFrameChange,
        scheduler
      })
    );

    act(() => result.current.play());
    act(() => scheduler.tick(100));
    expect(onFrameChange).toHaveBeenLastCalledWith(0);
    act(() => scheduler.tick(550));
    expect(onFrameChange).toHaveBeenLastCalledWith(4);
  });

  it("stops and cleans up on identity changes and unmount", () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const onFrameChange = vi.fn();
    const { result, rerender, unmount } = renderHook(
      ({ identity }) =>
        useAnimationPlayback({
          identity,
          enabled: true,
          frameIndex: 3,
          frameCount: 8,
          fps: 10,
          loop: true,
          onFrameChange,
          scheduler
        }),
      { initialProps: { identity: "project-a:clip-a:south" } }
    );

    act(() => result.current.play());
    const firstHandle = scheduler.nextHandle - 1;
    rerender({ identity: "project-b:clip-a:south" });
    expect(result.current.isPlaying).toBe(false);
    expect(onFrameChange).toHaveBeenLastCalledWith(0);
    expect(scheduler.cancelled).toContain(firstHandle);

    act(() => result.current.play());
    const secondHandle = scheduler.nextHandle - 1;
    unmount();
    expect(scheduler.cancelled).toContain(secondHandle);
    expect(scheduler.callbacks.size).toBe(0);
  });

  it("never auto-plays when reduced motion is requested", () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "matchMedia"
    );
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia
    });
    try {
      const { result } = renderHook(() =>
        useAnimationPlayback({
          identity: "project-a:clip-a:south",
          enabled: true,
          frameIndex: 0,
          frameCount: 8,
          fps: 10,
          loop: true,
          onFrameChange: vi.fn(),
          scheduler
        })
      );

      expect(matchMedia).toHaveBeenCalledWith(
        "(prefers-reduced-motion: reduce)"
      );
      expect(result.current.reducedMotion).toBe(true);
      expect(result.current.isPlaying).toBe(false);
      expect(scheduler.callbacks.size).toBe(0);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "matchMedia", originalDescriptor);
      } else {
        Reflect.deleteProperty(window, "matchMedia");
      }
    }
  });
});
