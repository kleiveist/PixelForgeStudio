import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import {
  MAX_PROJECT_PART_OFFSET,
  MAX_PROJECT_PART_ROTATION_DELTA,
  MAX_PROJECT_PART_SCALE_MULTIPLIER,
  MIN_PROJECT_PART_SCALE_MULTIPLIER,
  type AnimationPartAsset,
  type StableId
} from "../../schemas";
import {
  findSlotBinding,
  isRequiredPartSlot,
  snapSourcePoint,
  toSourceAnchors,
  validateSourceAnchors,
  type Direction,
  type EditableSourceAnchors,
  type Point,
  type RigTemplate,
  type SourceAnchors,
  type TransformDelta
} from "../../domain/animation";
import {
  useObjectUrl,
  type ObjectUrlFactory
} from "../animation-part-import";
import {
  IDENTITY_PART_DELTA,
  resolvePartPlacementForDisplay
} from "./anchorPlacementAdapter";
import styles from "./AnchorEditor.module.css";

export type PartBlobLoadResult =
  | Readonly<{ status: "ok"; blob: Blob }>
  | Readonly<{ status: "error"; message: string }>;

export interface AnchorEditorCommitDefinition {
  readonly assetId: StableId;
  readonly anchors: SourceAnchors;
  readonly transformDelta: TransformDelta;
}

export type AnchorEditorCommitResult =
  | Readonly<{ status: "ok"; partAsset: AnimationPartAsset }>
  | Readonly<{ status: "error"; message: string }>;

export interface AnchorEditorProps {
  readonly asset: AnimationPartAsset;
  readonly template: RigTemplate;
  readonly direction: Direction;
  readonly transformDelta?: TransformDelta | undefined;
  readonly loadBlob: (blobId: StableId) => Promise<PartBlobLoadResult>;
  readonly onCommit: (
    definition: AnchorEditorCommitDefinition
  ) => Promise<AnchorEditorCommitResult>;
  readonly objectUrlFactory?: ObjectUrlFactory | undefined;
}

type AnchorKind = "proximal" | "distal" | "pivot";

function cloneAnchors(anchors?: EditableSourceAnchors): EditableSourceAnchors {
  return Object.freeze({
    ...(anchors?.proximal
      ? { proximal: Object.freeze({ ...anchors.proximal }) }
      : {}),
    ...(anchors?.distal ? { distal: Object.freeze({ ...anchors.distal }) } : {}),
    ...(anchors?.pivot ? { pivot: Object.freeze({ ...anchors.pivot }) } : {})
  });
}

function cloneDelta(delta?: TransformDelta): TransformDelta {
  return Object.freeze({ ...(delta ?? IDENTITY_PART_DELTA) });
}

function markerLabel(kind: AnchorKind): string {
  return kind === "proximal" ? "P" : kind === "distal" ? "D" : "↻";
}

export function AnchorEditor({
  asset,
  template,
  direction,
  transformDelta,
  loadBlob,
  onCommit,
  objectUrlFactory
}: AnchorEditorProps) {
  const [draft, setDraft] = useState<EditableSourceAnchors>(() =>
    cloneAnchors(asset.anchors)
  );
  const [delta, setDelta] = useState<TransformDelta>(() =>
    cloneDelta(transformDelta)
  );
  const [activeAnchor, setActiveAnchor] = useState<AnchorKind>("proximal");
  const [zoom, setZoom] = useState(6);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobState, setBlobState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadRevision = useRef(0);
  const objectUrl = useObjectUrl(blob, objectUrlFactory);
  const binding = isRequiredPartSlot(asset.slot)
    ? findSlotBinding(template, asset.slot)
    : null;

  useEffect(() => {
    setDraft(cloneAnchors(asset.anchors));
    setDelta(cloneDelta(transformDelta));
    setMessage(null);
  }, [asset.assetId, asset.anchors, transformDelta]);

  useEffect(() => {
    const revision = loadRevision.current + 1;
    loadRevision.current = revision;
    setBlob(null);
    setBlobState("loading");
    void loadBlob(asset.blobId).then((result) => {
      if (revision !== loadRevision.current) return;
      if (result.status === "ok") {
        setBlob(result.blob);
        setBlobState("ready");
      } else {
        setBlobState("error");
        setMessage(result.message);
      }
    });
    return () => {
      loadRevision.current += 1;
    };
  }, [asset.blobId, loadBlob]);

  const validation = useMemo(
    () =>
      binding
        ? validateSourceAnchors(binding, draft, asset.sourceSize)
        : null,
    [asset.sourceSize, binding, draft]
  );
  const placement = useMemo(
    () =>
      resolvePartPlacementForDisplay(
        template,
        direction,
        { ...asset, anchors: draft },
        delta
      ),
    [asset, delta, direction, draft, template]
  );

  if (!binding) {
    return (
      <section className={styles.editor} aria-labelledby="anchor-editor-title">
        <h3 id="anchor-editor-title">Anker bearbeiten</h3>
        <p role="note">
          Für diesen optionalen Slot ist noch keine versionierte Bone-Bindung
          definiert. Das Originalbild bleibt unverändert.
        </p>
      </section>
    );
  }

  const setAnchorPoint = (kind: AnchorKind, point: Point) => {
    setDraft((current) => Object.freeze({ ...current, [kind]: point }));
    setMessage(null);
  };

  const updateCoordinate = (
    kind: AnchorKind,
    axis: "x" | "y",
    value: number
  ) => {
    if (!Number.isFinite(value)) return;
    const existing = draft[kind] ?? { x: 0, y: 0 };
    setAnchorPoint(
      kind,
      snapSourcePoint({ ...existing, [axis]: value }, asset.sourceSize)
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = snapSourcePoint(
      {
        x:
          (event.clientX -
            bounds.left +
            event.currentTarget.scrollLeft -
            pan.x) /
          zoom,
        y:
          (event.clientY -
            bounds.top +
            event.currentTarget.scrollTop -
            pan.y) /
          zoom
      },
      asset.sourceSize
    );
    setAnchorPoint(activeAnchor, point);
  };

  const handleStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 24 : 6;
    const offsets: Partial<Record<string, Point>> = {
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: -amount },
      ArrowDown: { x: 0, y: amount }
    };
    const offset = offsets[event.key];
    if (offset) {
      event.preventDefault();
      setPan((current) => ({
        x: current.x + offset.x,
        y: current.y + offset.y
      }));
    }
  };

  const reset = () => {
    setDraft(cloneAnchors(asset.anchors));
    setDelta(cloneDelta(transformDelta));
    setZoom(6);
    setPan({ x: 0, y: 0 });
    setMessage("Persistierte Anker und Korrekturen wurden wiederhergestellt.");
  };

  const save = async () => {
    const sourceAnchors = toSourceAnchors(draft);
    if (!sourceAnchors) {
      setMessage("Setze mindestens den proximalen Anker.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await onCommit({
        assetId: asset.assetId,
        anchors: sourceAnchors,
        transformDelta: delta
      });
      setMessage(
        result.status === "ok"
          ? result.partAsset.anchorStatus === "ready"
            ? "Anker und projektweite Korrektur wurden gespeichert."
            : "Der Ankerentwurf wurde gespeichert; Pflichtanker sind noch ungültig."
          : result.message
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Anker und Korrektur konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  };

  const anchorKinds: readonly AnchorKind[] =
    binding.sourceAnchorRequirement === "twoPoint"
      ? ["proximal", "distal", "pivot"]
      : ["proximal", "pivot"];
  const planeStyle = {
    width: asset.sourceSize.width * zoom,
    height: asset.sourceSize.height * zoom,
    transform: `translate(${pan.x}px, ${pan.y}px)`
  } as CSSProperties;

  return (
    <section className={styles.editor} aria-labelledby="anchor-editor-title">
      <div className={styles.heading}>
        <div>
          <span>Ankerbearbeitungsmodus</span>
          <h3 id="anchor-editor-title">{asset.label}</h3>
        </div>
        <strong>{binding.sourceAnchorRequirement === "twoPoint" ? "Zweipunkt-Part" : "Einpunkt-Part"}</strong>
      </div>

      <div className={styles.modeControls} role="group" aria-label="Zu setzender Anker">
        {anchorKinds.map((kind) => (
          <button
            type="button"
            key={kind}
            aria-pressed={activeAnchor === kind}
            onClick={() => setActiveAnchor(kind)}
          >
            {kind === "proximal" ? "Proximal" : kind === "distal" ? "Distal" : "Pivot (optional)"}
          </button>
        ))}
      </div>

      <div className={styles.zoomControls} role="group" aria-label="Quellbild-Zoom und Pan">
        <button type="button" onClick={() => setZoom((value) => Math.max(2, value - 1))}>− Zoom</button>
        <span>{zoom}× pixelgenau</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(16, value + 1))}>+ Zoom</button>
        <button type="button" aria-label="Quellbild nach links verschieben" onClick={() => setPan((value) => ({ x: value.x - 6, y: value.y }))}>←</button>
        <button type="button" aria-label="Quellbild nach oben verschieben" onClick={() => setPan((value) => ({ x: value.x, y: value.y - 6 }))}>↑</button>
        <button type="button" aria-label="Quellbild nach unten verschieben" onClick={() => setPan((value) => ({ x: value.x, y: value.y + 6 }))}>↓</button>
        <button type="button" aria-label="Quellbild nach rechts verschieben" onClick={() => setPan((value) => ({ x: value.x + 6, y: value.y }))}>→</button>
        <button type="button" onClick={() => setPan({ x: 0, y: 0 })}>Pan zentrieren</button>
      </div>

      <div
        className={styles.sourceStage}
        role="region"
        aria-label={`Originalbild ${asset.sourceSize.width} mal ${asset.sourceSize.height} Pixel; Klick setzt ${activeAnchor}`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleStageKeyDown}
        data-testid="anchor-source-stage"
      >
        <div className={styles.sourcePlane} style={planeStyle}>
          {objectUrl ? (
            <img
              src={objectUrl}
              alt=""
              draggable={false}
              style={{
                width: asset.sourceSize.width * zoom,
                height: asset.sourceSize.height * zoom
              }}
            />
          ) : (
            <span className={styles.imageState}>
              {blobState === "loading"
                ? "Originalbild wird geladen …"
                : "Originalbild nicht verfügbar"}
            </span>
          )}
          {anchorKinds.map((kind) => {
            const point = draft[kind];
            return point ? (
              <span
                key={kind}
                className={styles.marker}
                data-anchor={kind}
                aria-label={`${kind} ${point.x}, ${point.y}`}
                style={{ left: point.x * zoom, top: point.y * zoom }}
              >
                {markerLabel(kind)}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <p className={styles.help}>
        Pointer snappen auf ganze Originalpixel. Pfeiltasten verschieben die
        Ansicht; alle Anker sind zusätzlich über Zahlenfelder erreichbar.
      </p>

      <div className={styles.coordinateGrid}>
        {anchorKinds.map((kind) => (
          <fieldset key={kind}>
            <legend>{kind === "proximal" ? "Proximal" : kind === "distal" ? "Distal" : "Pivot"}</legend>
            <label>
              X
              <input
                aria-label={`${kind === "proximal" ? "Proximal" : kind === "distal" ? "Distal" : "Pivot"} X`}
                type="number"
                min={0}
                max={asset.sourceSize.width - 1}
                value={draft[kind]?.x ?? ""}
                onChange={(event) => updateCoordinate(kind, "x", Number(event.currentTarget.value))}
              />
            </label>
            <label>
              Y
              <input
                aria-label={`${kind === "proximal" ? "Proximal" : kind === "distal" ? "Distal" : "Pivot"} Y`}
                type="number"
                min={0}
                max={asset.sourceSize.height - 1}
                value={draft[kind]?.y ?? ""}
                onChange={(event) => updateCoordinate(kind, "y", Number(event.currentTarget.value))}
              />
            </label>
            {kind === "pivot" && draft.pivot ? (
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => {
                    const { pivot: _removed, ...rest } = current;
                    return Object.freeze(rest);
                  })
                }
              >
                Pivot entfernen
              </button>
            ) : null}
          </fieldset>
        ))}
      </div>

      <fieldset className={styles.deltaFields}>
        <legend>Projektweite Partkorrektur</legend>
        <label>Offset X<input aria-label="Part Offset X" type="number" min={-MAX_PROJECT_PART_OFFSET} max={MAX_PROJECT_PART_OFFSET} step="0.25" value={delta.offsetX} onChange={(event) => setDelta({ ...delta, offsetX: Number(event.currentTarget.value) })} /></label>
        <label>Offset Y<input aria-label="Part Offset Y" type="number" min={-MAX_PROJECT_PART_OFFSET} max={MAX_PROJECT_PART_OFFSET} step="0.25" value={delta.offsetY} onChange={(event) => setDelta({ ...delta, offsetY: Number(event.currentTarget.value) })} /></label>
        <label>Rotation (rad)<input aria-label="Part Rotation" type="number" min={-MAX_PROJECT_PART_ROTATION_DELTA} max={MAX_PROJECT_PART_ROTATION_DELTA} step="0.01" value={delta.rotationDelta} onChange={(event) => setDelta({ ...delta, rotationDelta: Number(event.currentTarget.value) })} /></label>
        <label>Scale<input aria-label="Part Scale" type="number" min={MIN_PROJECT_PART_SCALE_MULTIPLIER} max={MAX_PROJECT_PART_SCALE_MULTIPLIER} step="0.01" value={delta.scaleMultiplier} onChange={(event) => setDelta({ ...delta, scaleMultiplier: Number(event.currentTarget.value) })} /></label>
      </fieldset>

      {validation && !validation.valid ? (
        <ul className={styles.issues} role="alert">
          {validation.issues.map((issue) => (
            <li key={`${issue.code}-${issue.path.join(".")}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      <div className={styles.livePreview}>
        <h4>Live-Bone-Vorschau · {direction}</h4>
        {placement.status === "ok" && objectUrl ? (
          <div
            className={styles.previewFrame}
            style={{
              width: template.frameProfile.frameSize.width,
              height: template.frameProfile.frameSize.height
            }}
            data-testid="anchor-placement-preview"
            data-direction={direction}
          >
            <div
              className={styles.placedCrop}
              style={{
                width: asset.trimRect.width,
                height: asset.trimRect.height,
                transform: `matrix(${placement.placement.transform.a}, ${placement.placement.transform.b}, ${placement.placement.transform.c}, ${placement.placement.transform.d}, ${placement.placement.transform.e}, ${placement.placement.transform.f})`
              }}
            >
              <img
                src={objectUrl}
                alt={`Platzierungsvorschau ${asset.label}`}
                style={{
                  width: asset.sourceSize.width,
                  height: asset.sourceSize.height,
                  left: -asset.trimRect.x,
                  top: -asset.trimRect.y
                }}
              />
            </div>
          </div>
        ) : (
          <p role="status">
            {placement.status === "invalidAnchors"
              ? "Vorschau wartet auf gültige slotabhängige Anker."
              : placement.status === "unavailable"
                ? placement.message
                : blobState === "loading"
                  ? "Originalbild wird für die Vorschau geladen …"
                  : "Originalbild ist für die Vorschau nicht verfügbar."}
          </p>
        )}
        {placement.status === "ok" && placement.placement.basePlacement.warnings.length > 0 ? (
          <ul className={styles.warnings} role="status">
            {placement.placement.basePlacement.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Anker werden gespeichert …" : "Anker speichern"}
        </button>
        <button type="button" onClick={reset} disabled={saving}>Reset</button>
      </div>
      {message ? <p role={message.includes("gespeichert") || message.includes("wiederhergestellt") ? "status" : "alert"}>{message}</p> : null}
    </section>
  );
}
