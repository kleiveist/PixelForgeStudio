import { useMemo, useRef, useState } from "react";
import { Badge, Surface } from "../../components/ui";
import {
  normalizeAnimationExportBaseName,
  resolveSpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import type {
  AnimationClip,
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import {
  AnimationExportCancelledError,
  asSpriteSheetSourceFrames,
  canRunAnimationExport,
  createBrowserPngEncoder,
  createIndividualFrameArchive,
  createGodot4Package,
  createMetadataJsonBlob,
  createPfanimArchive,
  createSpriteSheetMetadata,
  createSpriteSheetPng,
  downloadBlob,
  validateAnimationExport,
  type AnimationExportJobState,
  type PngEncoder
} from "../../services";
import styles from "./AnimationExportPanel.module.css";

export type AnimationExportKind =
  | "sheet"
  | "metadata"
  | "frames"
  | "project"
  | "godot4";

export interface AnimationExportPanelProps {
  readonly project: AnimationProject;
  readonly clip: AnimationClip | null;
  readonly frames: readonly SpriteSheetSourceFrame[];
  readonly productionDiagnostics?: readonly Readonly<{
    severity: "error" | "warning";
    message: string;
    direction?: SpriteSheetSourceFrame["direction"];
    frameIndex?: number;
  }>[];
  readonly missingBlobIds?: readonly StableId[];
  readonly partAssets: readonly AnimationPartAsset[];
  readonly readImageBlob: (blobId: StableId) => Promise<Blob>;
  readonly readPreviewBlob?: (previewId: StableId) => Promise<Blob>;
  readonly pngEncoder?: PngEncoder;
  readonly onDownload?: (blob: Blob, fileName: string) => void;
  readonly now?: () => string;
}

const STATUS_LABELS: Readonly<Record<AnimationExportJobState["status"], string>> = {
  idle: "Bereit",
  validating: "Wird geprüft …",
  rendering: "Frames werden vorbereitet …",
  encoding: "PNG-Dateien werden kodiert …",
  packaging: "Paket wird erstellt …",
  completed: "Export abgeschlossen",
  cancelled: "Export abgebrochen",
  failed: "Export fehlgeschlagen"
};

function defaultNow(): string {
  return new Date().toISOString();
}

export function AnimationExportPanel({
  project,
  clip,
  frames,
  productionDiagnostics = [],
  missingBlobIds = [],
  partAssets,
  readImageBlob,
  readPreviewBlob,
  pngEncoder = createBrowserPngEncoder(),
  onDownload = downloadBlob,
  now = defaultNow
}: AnimationExportPanelProps) {
  const [warningsConfirmed, setWarningsConfirmed] = useState(false);
  const [job, setJob] = useState<AnimationExportJobState>({ status: "idle" });
  const activeAbortRef = useRef<AbortController | null>(null);
  const sourceFrames = useMemo(() => asSpriteSheetSourceFrames(frames), [frames]);
  const validation = useMemo(
    () =>
      validateAnimationExport({
        project,
        clip,
        frames: sourceFrames,
        missingBlobIds,
        productionDiagnostics
      }),
    [clip, missingBlobIds, productionDiagnostics, project, sourceFrames]
  );
  const isRunning = ["validating", "rendering", "encoding", "packaging"].includes(
    job.status
  );
  const canExport = canRunAnimationExport(validation, warningsConfirmed) && !isRunning;
  const baseName = normalizeAnimationExportBaseName(project.name, project.projectId);

  const runExport = async (kind: AnimationExportKind) => {
    if (!clip || !canRunAnimationExport(validation, warningsConfirmed)) return;
    const abort = new AbortController();
    activeAbortRef.current = abort;
    setJob({ status: "validating" });
    try {
      const layout = resolveSpriteSheetLayout({
        frameSize: project.frameProfile.frameSize,
        frameCount: clip.frameCount
      });
      const metadata = createSpriteSheetMetadata({ project, clip, layout });
      let file: Readonly<{ name: string; blob: Blob }>;
      if (kind === "sheet") {
        setJob({ status: "rendering", completed: 64, total: 64 });
        setJob({ status: "encoding", completed: 0, total: 1 });
        file = {
          name: `${baseName}_walk.png`,
          blob: await createSpriteSheetPng(
            layout,
            sourceFrames,
            pngEncoder,
            abort.signal
          )
        };
      } else if (kind === "metadata") {
        setJob({ status: "packaging" });
        file = {
          name: `${baseName}_walk.json`,
          blob: createMetadataJsonBlob(metadata)
        };
      } else if (kind === "frames") {
        setJob({ status: "encoding", completed: 0, total: 64 });
        file = {
          name: `${baseName}_frames.zip`,
          blob: await createIndividualFrameArchive({
            frames: sourceFrames,
            metadata,
            encoder: pngEncoder,
            signal: abort.signal,
            onProgress: (completed, total) =>
              setJob({ status: "encoding", completed, total })
          })
        };
      } else if (kind === "project") {
        setJob({ status: "packaging" });
        file = {
          name: `${baseName}.pfanim`,
          blob: await createPfanimArchive({
            project,
            partAssets,
            exportedAt: now(),
            readImageBlob,
            ...(readPreviewBlob ? { readPreviewBlob } : {})
          })
        };
      } else {
        setJob({ status: "encoding", completed: 0, total: 1 });
        const sheetPng = await createSpriteSheetPng(
          layout,
          sourceFrames,
          pngEncoder,
          abort.signal
        );
        if (abort.signal.aborted) throw new AnimationExportCancelledError();
        setJob({ status: "packaging" });
        const godotPackage = await createGodot4Package({
          metadata,
          sheetPng,
          packageName: baseName
        });
        file = {
          name: `${baseName}_godot4.zip`,
          blob: godotPackage.blob
        };
      }
      if (abort.signal.aborted) throw new AnimationExportCancelledError();
      onDownload(file.blob, file.name);
      setJob({ status: "completed", files: Object.freeze([file]) });
    } catch (error) {
      if (error instanceof AnimationExportCancelledError || abort.signal.aborted) {
        setJob({ status: "cancelled" });
      } else {
        setJob({
          status: "failed",
          message: error instanceof Error ? error.message : "Der Export ist fehlgeschlagen."
        });
      }
    } finally {
      if (activeAbortRef.current === abort) activeAbortRef.current = null;
    }
  };

  return (
    <Surface
      as="section"
      id="animation-export-panel"
      className={styles.panel}
      tone="raised"
      aria-labelledby="animation-export-title"
    >
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Produktion</span>
          <h2 id="animation-export-title">Export</h2>
        </div>
        <Badge
          tone={job.status === "completed" ? "success" : job.status === "failed" ? "neutral" : "accent"}
          role="status"
          aria-live="polite"
        >
          {STATUS_LABELS[job.status]}
        </Badge>
      </div>

      {validation.hardErrors.length > 0 ? (
        <div className={styles.errors} role="alert">
          <strong>{validation.hardErrors.length} Exportfehler blockieren die Ausgabe.</strong>
          <ul>{validation.hardErrors.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
        </div>
      ) : null}
      {validation.warnings.length > 0 ? (
        <div className={styles.warnings}>
          <strong>{validation.warnings.length} Warnungen prüfen</strong>
          <ul>{validation.warnings.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
          <label>
            <input
              type="checkbox"
              checked={warningsConfirmed}
              onChange={(event) => setWarningsConfirmed(event.currentTarget.checked)}
            />
            <span>Warnungen geprüft und Export ausdrücklich freigeben</span>
          </label>
        </div>
      ) : null}

      <div className={styles.actions} aria-label="Exportformate">
        <button type="button" disabled={!canExport} onClick={() => void runExport("sheet")}>
          SpriteSheet PNG
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("metadata")}>
          Metadaten JSON
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("frames")}>
          64 Einzelbilder
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("project")}>
          Projektbundle .pfanim
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("godot4")}>
          Godot 4 Paket
        </button>
      </div>

      {job.status === "encoding" || job.status === "rendering" ? (
        <progress value={job.completed} max={job.total} aria-label="Exportfortschritt">
          {job.completed} / {job.total}
        </progress>
      ) : null}
      {isRunning ? (
        <button
          className={styles.cancel}
          type="button"
          onClick={() => activeAbortRef.current?.abort()}
        >
          Export abbrechen
        </button>
      ) : null}
      {job.status === "failed" ? <p className={styles.errors} role="alert">{job.message}</p> : null}
      {job.status === "completed" ? (
        <p className={styles.success} role="status">
          {job.files.map(({ name }) => name).join(", ")} wurde vollständig erzeugt.
        </p>
      ) : null}
    </Surface>
  );
}
