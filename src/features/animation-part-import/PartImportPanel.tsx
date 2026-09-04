import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { Direction, PartSlot, Rect, Size } from "../../domain/animation";
import type { AnimationPartAsset, StableId } from "../../schemas";
import type { ImageDecoder } from "../../services";
import {
  partLabelFromFileName,
  prepareAnimationPartImport,
  type PreparedAnimationPartImport
} from "./partImport";
import { useObjectUrl, type ObjectUrlFactory } from "./useObjectUrl";
import styles from "./PartImportPanel.module.css";

export interface PartImportCommitDefinition {
  readonly originalBlob: Blob;
  readonly label: string;
  readonly slot: PartSlot;
  readonly direction: Direction;
  readonly sourceSize: Size;
  readonly trimRect: Rect;
  readonly replacedAssetId?: StableId;
}

export type PartImportCommitResult =
  | Readonly<{ status: "ok"; partAsset: AnimationPartAsset }>
  | Readonly<{ status: "error"; message: string }>;

export interface PartImportPanelProps {
  readonly selectedSlot: PartSlot | null;
  readonly selectedSlotLabel: string | null;
  readonly direction: Direction;
  readonly directionLabel: string;
  readonly decoder: ImageDecoder | null;
  readonly existingPart: AnimationPartAsset | null;
  readonly onCommit: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
  readonly objectUrlFactory?: ObjectUrlFactory;
}

type ImportPhase = "idle" | "decoding" | "ready" | "saving";

export function PartImportPanel({
  selectedSlot,
  selectedSlotLabel,
  direction,
  directionLabel,
  decoder,
  existingPart,
  onCommit,
  objectUrlFactory
}: PartImportPanelProps) {
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [draft, setDraft] = useState<PreparedAnimationPartImport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const requestRevision = useRef(0);
  const objectUrl = useObjectUrl(
    draft?.originalBlob ?? null,
    objectUrlFactory
  );
  const controlsDisabled = !selectedSlot || !decoder || phase === "saving";

  const prepareFile = async (input: unknown) => {
    if (!selectedSlot) {
      setMessage("Wähle zuerst den Zielslot im Teileinventar.");
      return;
    }
    if (!decoder) {
      setMessage("Der Bilddecoder ist in dieser Umgebung nicht verfügbar.");
      return;
    }
    const revision = requestRevision.current + 1;
    requestRevision.current = revision;
    setDraft(null);
    setMessage(null);
    setPhase("decoding");
    const prepared = await prepareAnimationPartImport(input, decoder);
    if (requestRevision.current !== revision) return;
    if (prepared.status !== "ok") {
      setPhase("idle");
      setMessage(prepared.message);
      return;
    }
    setDraft(prepared.value);
    setPhase("ready");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void prepareFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (controlsDisabled) return;
    const file = event.dataTransfer.files[0];
    if (file) void prepareFile(file);
  };

  const cancel = () => {
    requestRevision.current += 1;
    setDraft(null);
    setMessage(null);
    setPhase("idle");
  };

  const confirm = async () => {
    if (!draft || !selectedSlot) return;
    setMessage(null);
    setPhase("saving");
    const result = await onCommit({
      originalBlob: draft.originalBlob,
      label: partLabelFromFileName(draft.fileName),
      slot: selectedSlot,
      direction,
      sourceSize: draft.sourceSize,
      trimRect: draft.trimRect,
      ...(existingPart ? { replacedAssetId: existingPart.assetId } : {})
    });
    if (result.status === "error") {
      setPhase("ready");
      setMessage(result.message);
      return;
    }
    setDraft(null);
    setPhase("idle");
    setMessage(`„${result.partAsset.label}“ wurde importiert; die Anker sind noch ausstehend.`);
  };

  return (
    <section className={styles.importPanel} aria-labelledby="part-import-title">
      <div>
        <h3 id="part-import-title">PNG-Teil importieren</h3>
        <p>
          Ziel: {selectedSlotLabel ?? "noch kein Slot"} · {directionLabel}
        </p>
      </div>
      <div
        className={styles.dropZone}
        data-disabled={controlsDisabled}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <strong>PNG hier ablegen</strong>
        <span>oder über den immer verfügbaren Dateidialog auswählen</span>
        <label className={styles.fileButton}>
          PNG-Datei auswählen
          <input
            type="file"
            accept="image/png,.png"
            disabled={controlsDisabled}
            onChange={handleFileChange}
          />
        </label>
      </div>
      {!selectedSlot ? (
        <p className={styles.hint}>Wähle zuerst einen Slot; die Toolbar-Richtung bleibt das Importziel.</p>
      ) : null}
      {phase === "decoding" ? <p role="status">PNG wird geprüft und decodiert …</p> : null}
      {draft ? (
        <div className={styles.previewCard}>
          {objectUrl ? (
            <img src={objectUrl} alt={`Vorschau ${draft.fileName}`} />
          ) : (
            <span className={styles.previewFallback}>Vorschau nicht verfügbar</span>
          )}
          <dl>
            <div><dt>Datei</dt><dd>{draft.fileName}</dd></div>
            <div><dt>Original</dt><dd>{draft.sourceSize.width} × {draft.sourceSize.height} px</dd></div>
            <div><dt>Trim</dt><dd>X {draft.trimRect.x}, Y {draft.trimRect.y}, {draft.trimRect.width} × {draft.trimRect.height} px</dd></div>
            <div><dt>Anker</dt><dd>Nach Import ausstehend</dd></div>
          </dl>
          {draft.warnings.includes("opaqueOuterEdge") ? (
            <p className={styles.warning} role="status">
              Warnung: Mindestens ein vollständig opakes Pixel berührt den Außenrand. Prüfe möglichen Beschnitt.
            </p>
          ) : null}
          {existingPart ? (
            <p className={styles.warning}>
              Die bisherige Quelle „{existingPart.label}“ wird nur aus diesem Projektplatz gelöst, nicht gelöscht.
            </p>
          ) : null}
          <div className={styles.actions}>
            <button type="button" onClick={() => void confirm()} disabled={phase === "saving"}>
              {phase === "saving" ? "Import wird gespeichert …" : "Import bestätigen"}
            </button>
            <button type="button" onClick={cancel} disabled={phase === "saving"}>
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
      {message ? (
        <p className={styles.message} role={message.includes("wurde importiert") ? "status" : "alert"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
