import { useEffect, useRef, useState } from "react";
import type { RenderedFrame } from "../../domain/animation";
import { putRgbaImageData } from "../../services";
import styles from "./AnimationWorkspace.module.css";

export interface RenderedFrameCanvasProps {
  readonly frame: RenderedFrame;
}

export function RenderedFrameCanvas({ frame }: RenderedFrameCanvasProps) {
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
        className={styles.renderCanvas}
        role="img"
        aria-label={`Gerenderter Projektframe mit ${frame.renderedPartIds.length} ${frame.renderedPartIds.length === 1 ? "Part" : "Parts"}`}
        data-testid="rendered-animation-frame"
        data-rendered-parts={frame.renderedPartIds.length}
      />
      {displayError ? (
        <span className={styles.canvasError} role="status">
          {displayError}
        </span>
      ) : null}
    </>
  );
}
