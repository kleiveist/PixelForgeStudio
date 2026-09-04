import { useCallback, useEffect, useRef, useState } from "react";
import {
  advancePlaybackClock,
  createBrowserAnimationFrameScheduler,
  type AnimationFrameScheduler
} from "./animationPlayback";

const BROWSER_SCHEDULER = createBrowserAnimationFrameScheduler();

export interface AnimationPlaybackOptions {
  readonly identity: string;
  readonly enabled: boolean;
  readonly frameIndex: number;
  readonly frameCount: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly onFrameChange: (frameIndex: number) => void;
  readonly scheduler?: AnimationFrameScheduler;
  readonly reducedMotion?: boolean;
}

export interface AnimationPlaybackController {
  readonly isPlaying: boolean;
  readonly reducedMotion: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly previous: () => void;
  readonly next: () => void;
  readonly selectFrame: (frameIndex: number) => void;
}

function browserPrefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useAnimationPlayback({
  identity,
  enabled,
  frameIndex,
  frameCount,
  fps,
  loop,
  onFrameChange,
  scheduler = BROWSER_SCHEDULER,
  reducedMotion
}: AnimationPlaybackOptions): AnimationPlaybackController {
  const [isPlaying, setIsPlaying] = useState(false);
  const [systemReducedMotion] = useState(browserPrefersReducedMotion);
  const frameIndexRef = useRef(frameIndex);
  const remainderMsRef = useRef(0);
  const onFrameChangeRef = useRef(onFrameChange);
  const previousIdentityRef = useRef(identity);

  frameIndexRef.current = frameIndex;
  onFrameChangeRef.current = onFrameChange;

  const resetClock = useCallback(() => {
    remainderMsRef.current = 0;
  }, []);

  const emitFrame = useCallback((nextFrameIndex: number) => {
    frameIndexRef.current = nextFrameIndex;
    onFrameChangeRef.current(nextFrameIndex);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    resetClock();
    emitFrame(0);
  }, [emitFrame, resetClock]);

  const selectFrame = useCallback(
    (nextFrameIndex: number) => {
      if (!enabled || frameCount <= 0) return;
      const bounded = Math.min(
        Math.max(Math.trunc(nextFrameIndex), 0),
        frameCount - 1
      );
      setIsPlaying(false);
      resetClock();
      emitFrame(bounded);
    },
    [emitFrame, enabled, frameCount, resetClock]
  );

  const previous = useCallback(() => {
    if (!enabled || frameCount <= 0) return;
    const nextFrameIndex =
      frameIndexRef.current === 0
        ? loop
          ? frameCount - 1
          : 0
        : frameIndexRef.current - 1;
    selectFrame(nextFrameIndex);
  }, [enabled, frameCount, loop, selectFrame]);

  const next = useCallback(() => {
    if (!enabled || frameCount <= 0) return;
    const nextFrameIndex =
      frameIndexRef.current === frameCount - 1
        ? loop
          ? 0
          : frameCount - 1
        : frameIndexRef.current + 1;
    selectFrame(nextFrameIndex);
  }, [enabled, frameCount, loop, selectFrame]);

  const play = useCallback(() => {
    if (!enabled || frameCount <= 0 || fps <= 0) return;
    setIsPlaying(true);
  }, [enabled, fps, frameCount]);

  useEffect(() => {
    if (previousIdentityRef.current === identity) return;
    previousIdentityRef.current = identity;
    setIsPlaying(false);
    resetClock();
    emitFrame(0);
  }, [emitFrame, identity, resetClock]);

  useEffect(() => {
    if (enabled) return;
    setIsPlaying(false);
    resetClock();
  }, [enabled, resetClock]);

  useEffect(() => {
    if (!isPlaying || !enabled) return undefined;
    let disposed = false;
    let requestHandle: number | null = null;
    let previousTimestamp = scheduler.now();

    const tick = (timestamp: number) => {
      if (disposed) return;
      const result = advancePlaybackClock(
        {
          frameIndex: frameIndexRef.current,
          remainderMs: remainderMsRef.current
        },
        timestamp - previousTimestamp,
        fps,
        frameCount,
        loop
      );
      previousTimestamp = timestamp;
      remainderMsRef.current = result.remainderMs;
      if (result.frameIndex !== frameIndexRef.current) {
        emitFrame(result.frameIndex);
      }
      if (result.ended) {
        setIsPlaying(false);
        return;
      }
      requestHandle = scheduler.requestFrame(tick);
    };

    requestHandle = scheduler.requestFrame(tick);
    return () => {
      disposed = true;
      if (requestHandle !== null) scheduler.cancelFrame(requestHandle);
    };
  }, [emitFrame, enabled, fps, frameCount, identity, isPlaying, loop, scheduler]);

  return Object.freeze({
    isPlaying,
    reducedMotion: reducedMotion ?? systemReducedMotion,
    play,
    pause,
    stop,
    previous,
    next,
    selectFrame
  });
}
