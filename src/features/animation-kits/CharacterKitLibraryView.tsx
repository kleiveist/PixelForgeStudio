import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge, Surface } from "../../components/ui";
import {
  checkCharacterKitCompatibility,
  getBuiltInRigTemplate
} from "../../domain/animation";
import {
  MAX_ANIMATION_DESCRIPTION_LENGTH,
  MAX_ANIMATION_NAME_LENGTH,
  type CharacterKit,
  type StableId
} from "../../schemas";
import { useAnimationProject } from "../../store/animation";
import { useObjectUrl } from "../animation-part-import";
import {
  filterCharacterKits,
  type CharacterKitCoverageFilter,
  type CharacterKitRigFilter
} from "./characterKitLibraryData";
import styles from "./CharacterKitLibraryView.module.css";

const CharacterKitFormSchema = z.strictObject({
  name: z.string().trim().min(1, "Gib einen Kit-Namen ein.").max(MAX_ANIMATION_NAME_LENGTH),
  description: z.string().trim().max(MAX_ANIMATION_DESCRIPTION_LENGTH)
});

type CharacterKitFormValues = z.infer<typeof CharacterKitFormSchema>;

const RenameCharacterKitFormSchema = CharacterKitFormSchema.pick({ name: true });

function RenameCharacterKitForm({
  busy,
  kit,
  onRename
}: Readonly<{
  busy: boolean;
  kit: CharacterKit;
  onRename: (name: string) => Promise<void>;
}>) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register
  } = useForm<Readonly<{ name: string }>>({
    resolver: zodResolver(RenameCharacterKitFormSchema),
    defaultValues: { name: kit.name }
  });
  return (
    <form
      className={styles.rename}
      onSubmit={handleSubmit(({ name }) => onRename(name))}
      noValidate
    >
      <label>
        <span>Kit-Name</span>
        <input
          {...register("name")}
          maxLength={MAX_ANIMATION_NAME_LENGTH}
          aria-invalid={errors.name ? "true" : undefined}
        />
        {errors.name ? <small role="alert">{errors.name.message}</small> : null}
      </label>
      <button type="submit" disabled={busy || isSubmitting}>Umbenennen</button>
      <p><code>{kit.kitId}</code> · {kit.partAssetIds.length} PartAsset-Referenzen</p>
    </form>
  );
}

function KitPreview({ kit }: Readonly<{ kit: CharacterKit }>) {
  const { loadCharacterKitPreview } = useAnimationProject();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "missing">("idle");
  const url = useObjectUrl(blob);

  useEffect(() => {
    if (!kit.previewBlobId) {
      setBlob(null);
      setState("missing");
      return undefined;
    }
    let cancelled = false;
    setState("loading");
    void loadCharacterKitPreview(kit.previewBlobId).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        setBlob(result.value);
        setState("ready");
      } else {
        setBlob(null);
        setState("missing");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kit.previewBlobId, loadCharacterKitPreview]);

  return (
    <div className={styles.preview} data-preview-state={state}>
      {url ? <img src={url} alt={`Vorschau für ${kit.name}`} /> : null}
      {!url ? (
        <span aria-label={`Vorschau für ${kit.name}`}>
          {state === "loading" ? "Vorschau wird geladen …" : "Keine Vorschau"}
        </span>
      ) : null}
    </div>
  );
}

function coverageLabel(kit: CharacterKit): string {
  return kit.coverage.productionReady
    ? "8 Richtungen bereit"
    : `${kit.coverage.resolvedRequiredCellCount}/${kit.coverage.requiredCellCount || 120} Pflichtzellen`;
}

export function CharacterKitLibraryView() {
  const {
    activeProject,
    applyCharacterKit,
    characterKitListError,
    characterKitListStatus,
    characterKits,
    deleteCharacterKit,
    duplicateCharacterKit,
    refreshCharacterKits,
    renameCharacterKit,
    saveActiveProjectAsKit
  } = useAnimationProject();
  const [query, setQuery] = useState("");
  const [rigFilter, setRigFilter] = useState<CharacterKitRigFilter>("all");
  const [coverageFilter, setCoverageFilter] =
    useState<CharacterKitCoverageFilter>("all");
  const [openedKitId, setOpenedKitId] = useState<StableId | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StableId | null>(null);
  const [overrideConflictKitId, setOverrideConflictKitId] =
    useState<StableId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [busyKitId, setBusyKitId] = useState<StableId | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset
  } = useForm<CharacterKitFormValues>({
    resolver: zodResolver(CharacterKitFormSchema),
    defaultValues: { name: "", description: "" }
  });
  const visibleKits = useMemo(
    () => filterCharacterKits(characterKits, query, rigFilter, coverageFilter),
    [characterKits, coverageFilter, query, rigFilter]
  );

  const saveKit = handleSubmit(async (values) => {
    setCommandError(null);
    setNotice(null);
    const result = await saveActiveProjectAsKit(values);
    if (result.status === "ok") {
      reset();
      setNotice(`Character Kit „${result.value.name}“ wurde referenzbasiert gespeichert.`);
    } else {
      setCommandError(result.message);
    }
  });

  const runKitCommand = async (
    kitId: StableId,
    command: () => Promise<Readonly<{ status: string; message?: string }>>,
    successMessage: string
  ) => {
    setBusyKitId(kitId);
    setCommandError(null);
    setNotice(null);
    const result = await command();
    setBusyKitId(null);
    if (result.status === "ok") setNotice(successMessage);
    else setCommandError(result.message ?? "Die Kit-Aktion ist fehlgeschlagen.");
    return result;
  };

  const apply = async (
    kit: CharacterKit,
    resolution: "abort" | "removeInvalidPartDeltas"
  ) => {
    setBusyKitId(kit.kitId);
    setCommandError(null);
    setNotice(null);
    const result = await applyCharacterKit(kit.kitId, resolution);
    setBusyKitId(null);
    if (result.status === "ok") {
      setOverrideConflictKitId(null);
      setNotice(
        `„${kit.name}“ wurde angewendet${result.value.removedOverrideSlots > 0 ? `; ${result.value.removedOverrideSlots} ungültige Slotkorrektur(en) wurden entfernt` : ""}.`
      );
      return;
    }
    if (
      result.status === "conflict" &&
      "reason" in result &&
      result.reason === "overrideConflict"
    ) {
      setOverrideConflictKitId(kit.kitId);
    }
    setCommandError(result.message);
  };

  return (
    <div className={styles.view}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Lokale Kit-Bibliothek</span>
          <h1 id="animation-library-view-title">Figuren und Ausrüstung wiederverwenden.</h1>
          <p>
            Kits teilen PartAsset- und Bildreferenzen. Rig und Clips bleiben
            Eigentum des geöffneten Projekts.
          </p>
        </div>
        <Badge tone={activeProject ? "success" : "neutral"}>
          {activeProject ? `Ziel: ${activeProject.name}` : "Kein Zielprojekt"}
        </Badge>
      </header>

      <Surface as="section" className={styles.savePanel} tone="soft" aria-labelledby="save-kit-title">
        <div>
          <span className={styles.eyebrow}>Aktives Projekt</span>
          <h2 id="save-kit-title">Als Character Kit speichern</h2>
          <p>
            Gespeichert werden nur Metadaten und PartAsset-IDs; PNG-Blobs werden
            nicht kopiert.
          </p>
        </div>
        <form onSubmit={saveKit} noValidate>
          <label>
            <span>Name</span>
            <input {...register("name")} disabled={!activeProject} />
            {errors.name ? <small role="alert">{errors.name.message}</small> : null}
          </label>
          <label>
            <span>Beschreibung</span>
            <input {...register("description")} disabled={!activeProject} />
            {errors.description ? <small role="alert">{errors.description.message}</small> : null}
          </label>
          <button type="submit" disabled={!activeProject || isSubmitting}>
            {isSubmitting ? "Speichert …" : "Projekt als Kit speichern"}
          </button>
        </form>
      </Surface>

      <Surface as="section" className={styles.filters} tone="soft" aria-labelledby="kit-filter-title">
        <div>
          <span className={styles.eyebrow}>Bibliothek</span>
          <h2 id="kit-filter-title">Kits durchsuchen</h2>
        </div>
        <label>
          <span>Suche</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Name, Beschreibung oder ID"
          />
        </label>
        <label>
          <span>Rig</span>
          <select
            value={rigFilter}
            onChange={(event) => setRigFilter(event.currentTarget.value as CharacterKitRigFilter)}
          >
            <option value="all">Alle Rigs</option>
            <option value="humanoid-80-v1">Humanoid 80</option>
          </select>
        </label>
        <label>
          <span>Abdeckung</span>
          <select
            value={coverageFilter}
            onChange={(event) => setCoverageFilter(event.currentTarget.value as CharacterKitCoverageFilter)}
          >
            <option value="all">Alle Stände</option>
            <option value="ready">Produktionsbereit</option>
            <option value="draft">Entwurf</option>
          </select>
        </label>
      </Surface>

      {notice ? <p className={styles.success} role="status">{notice}</p> : null}
      {commandError ? <p className={styles.error} role="alert">{commandError}</p> : null}

      {characterKitListStatus === "loading" ? (
        <Surface className={styles.state} tone="soft" role="status">Character Kits werden geladen …</Surface>
      ) : characterKitListStatus === "unavailable" || characterKitListStatus === "failed" ? (
        <Surface className={styles.state} tone="soft" role="alert">
          <strong>Kit-Bibliothek ist nicht verfügbar.</strong>
          <span>{characterKitListError}</span>
          <button type="button" onClick={() => void refreshCharacterKits()}>Erneut laden</button>
        </Surface>
      ) : visibleKits.length === 0 ? (
        <Surface className={styles.state} tone="soft" role="status">
          {characterKits.length === 0
            ? "Noch keine Character Kits gespeichert."
            : "Kein Kit passt zu den aktuellen Filtern."}
        </Surface>
      ) : (
        <section className={styles.results} aria-labelledby="kit-results-title">
          <div className={styles.resultsHeading}>
            <h2 id="kit-results-title">Gespeicherte Character Kits</h2>
            <span>{visibleKits.length} Treffer</span>
          </div>
          <ul className={styles.grid}>
            {visibleKits.map((kit) => {
              const compatibility = activeProject
                ? checkCharacterKitCompatibility(
                    kit,
                    activeProject,
                    getBuiltInRigTemplate(activeProject.rigTemplateId)
                  )
                : null;
              const opened = openedKitId === kit.kitId;
              const deleting = deleteCandidate === kit.kitId;
              const overrideConflict = overrideConflictKitId === kit.kitId;
              return (
                <li key={kit.kitId}>
                  <article className={styles.card} data-compatible={compatibility?.compatible ?? "unknown"}>
                    <KitPreview kit={kit} />
                    <div className={styles.cardHeader}>
                      <div>
                        <span className={styles.eyebrow}>{kit.rigTemplateId}</span>
                        <h3>{kit.name}</h3>
                      </div>
                      <Badge tone={kit.coverage.productionReady ? "success" : "accent"}>
                        {kit.coverage.productionReady ? "Bereit" : "Entwurf"}
                      </Badge>
                    </div>
                    <p>{kit.description || "Keine Beschreibung"}</p>
                    <dl>
                      <div><dt>Coverage</dt><dd>{coverageLabel(kit)}</dd></div>
                      <div><dt>Mirror</dt><dd>{kit.coverage.mirroredRequiredCellCount} gültig · {kit.coverage.mirrorReviewCount} offen · {kit.coverage.mirrorForbiddenCount} gesperrt</dd></div>
                      <div><dt>Kompatibilität</dt><dd>{compatibility ? (compatibility.compatible ? "Kompatibel" : "Blockiert") : "Zielprojekt fehlt"}</dd></div>
                    </dl>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        aria-expanded={opened}
                        onClick={() => setOpenedKitId(opened ? null : kit.kitId)}
                      >
                        {opened ? "Schließen" : "Öffnen"}
                      </button>
                      <button
                        type="button"
                        disabled={!compatibility?.compatible || busyKitId === kit.kitId}
                        onClick={() => void apply(kit, "abort")}
                      >
                        Anwenden
                      </button>
                      <button
                        type="button"
                        disabled={busyKitId === kit.kitId}
                        onClick={() => void runKitCommand(
                          kit.kitId,
                          () => duplicateCharacterKit(kit.kitId),
                          `„${kit.name}“ wurde dupliziert.`
                        )}
                      >
                        Duplizieren
                      </button>
                      <button
                        type="button"
                        aria-expanded={deleting}
                        onClick={() => setDeleteCandidate(deleting ? null : kit.kitId)}
                      >
                        Löschen
                      </button>
                    </div>
                    {opened ? (
                      <>
                        <RenameCharacterKitForm
                          busy={busyKitId === kit.kitId}
                          kit={kit}
                          onRename={async (name) => {
                            await runKitCommand(
                            kit.kitId,
                            () => renameCharacterKit(kit.kitId, name),
                            "Character Kit wurde umbenannt."
                          );
                          }}
                        />
                        {!compatibility?.compatible && compatibility ? (
                          <ul className={styles.issues}>
                            {compatibility.issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}
                          </ul>
                        ) : null}
                      </>
                    ) : null}
                    {overrideConflict ? (
                      <div className={styles.conflict} role="alert">
                        <strong>FrameOverrides passen nicht vollständig.</strong>
                        <span>Bereinige nur die angezeigten ungültigen Slotdeltas oder brich ab.</span>
                        <div>
                          <button type="button" onClick={() => setOverrideConflictKitId(null)}>Abbrechen</button>
                          <button type="button" onClick={() => void apply(kit, "removeInvalidPartDeltas")}>Bereinigen und anwenden</button>
                        </div>
                      </div>
                    ) : null}
                    {deleting ? (
                      <div className={styles.conflict} role="alert">
                        <strong>Nur das Kit löschen?</strong>
                        <span>PartAssets und von Projekten referenzierte Blobs bleiben erhalten.</span>
                        <div>
                          <button type="button" onClick={() => setDeleteCandidate(null)}>Abbrechen</button>
                          <button
                            type="button"
                            onClick={() => void runKitCommand(
                              kit.kitId,
                              () => deleteCharacterKit(kit.kitId),
                              `„${kit.name}“ wurde gelöscht; geteilte Assets bleiben erhalten.`
                            ).then(() => setDeleteCandidate(null))}
                          >
                            Kit endgültig löschen
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
