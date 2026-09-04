import { useEffect, useRef, useState } from "react";
import type { RenderedFrame } from "../../domain/animation";
import { putRgbaImageData } from "../../services";
import styles from "./AnimationWorkspace.module.css";

export interface RenderedFrameCanvasProps {
  readonly frame: RenderedFrame;
  readonly variant?: "viewport" | "thumbnail" | "onion";
  readonly ariaLabel?: string;
  readonly ariaHidden?: boolean;
  readonly testId?: string;
}

export function RenderedFrameCanvas({
  frame,
  variant = "viewport",
  ariaLabel,
  ariaHidden = false,
  testId = "rendered-animation-frame"
}: RenderedFrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const result = putRgbaImageData(canvas, frame);
    setDisplayError(result.status === "ok" ? null : result.message);
  }, [frame]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`${styles.renderCanvas} ${styles[`${variant}Canvas`]}`}
        {...(ariaHidden
          ? { "aria-hidden": true }
          : {
              role: "img",
              "aria-label":
                ariaLabel ??
                `Gerenderter Projektframe mit ${frame.renderedPartIds.length} ${frame.renderedPartIds.length === 1 ? "Part" : "Parts"}`
            })}
        data-testid={testId}
        data-rendered-parts={frame.renderedPartIds.length}
      />
      {displayError && variant === "viewport" ? (
        <span className={styles.canvasError} role="status">
          {displayError}
        </span>
      ) : null}
    </>
  );
}
