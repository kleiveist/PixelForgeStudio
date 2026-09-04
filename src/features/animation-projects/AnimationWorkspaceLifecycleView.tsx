import { useEffect, useRef, useState } from "react";
import { Surface } from "../../components/ui";
import type { AnimationPartAsset, StableId } from "../../schemas";
import type { PartImportCommitDefinition } from "../animation-part-import";
import { useAnimationProject } from "../../store/animation";
import { useNavigation } from "../../store/navigation";
import { AnimationWorkspace } from "../animation-workspace";
import styles from "./AnimationProjectsView.module.css";

export interface AnimationWorkspaceLifecycleViewProps {
  readonly projectId?: StableId;
}

export function AnimationWorkspaceLifecycleView({
  projectId
}: AnimationWorkspaceLifecycleViewProps) {
  const {
    activeLoadError,
    activeLoadStatus,
    activeProject,
    activeProjectId,
    canSaveProject,
    imageDecoder,
    importPartAsset,
    loadPartAssets,
    openProject,
    rawProjectError,
    saveActiveProject,
    saveError,
    saveStatus
  } = useAnimationProject();
  const { navigateTo } = useNavigation();
  const attemptedProjectRef = useRef<StableId | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [partSources, setPartSources] = useState<Readonly<{
    status: "idle" | "loading" | "ready" | "failed";
    assets: readonly AnimationPartAsset[];
    missingAssetIds: readonly StableId[];
    error: string | null;
  }>>({ status: "idle", assets: [], missingAssetIds: [], error: null });

  useEffect(() => {
    if (!projectId) {
      attemptedProjectRef.current = null;
      return;
    }
    if (
      activeProjectId === projectId &&
      (activeLoadStatus === "loading" || activeLoadStatus === "ready")
    ) {
      return;
    }
    if (attemptedProjectRef.current === projectId) return;
    attemptedProjectRef.current = projectId;
    void openProject(projectId);
  }, [activeLoadStatus, activeProjectId, openProject, projectId]);

  useEffect(() => {
    if (activeLoadStatus !== "ready" || !activeProject) {
      setPartSources({ status: "idle", assets: [], missingAssetIds: [], error: null });
      return undefined;
    }
    let cancelled = false;
    const assetIds = activeProject.parts.map(({ assetId }) => assetId);
    if (assetIds.length === 0) {
      setPartSources({ status: "ready", assets: [], missingAssetIds: [], error: null });
      return undefined;
    }
    setPartSources({ status: "loading", assets: [], missingAssetIds: [], error: null });
    void loadPartAssets(assetIds).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        setPartSources({
          status: "ready",
          assets: result.value.assets,
          missingAssetIds: result.value.missingAssetIds,
          error: null
        });
      } else {
        setPartSources({
          status: "failed",
          assets: [],
          missingAssetIds: assetIds,
          error: result.message
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeLoadStatus, activeProject, loadPartAssets]);

  const explicitSave = async () => {
    setCommandError(null);
    const result = await saveActiveProject();
    if (result.status !== "ok") setCommandError(result.message);
  };

  const goToProjects = () => {
    navigateTo({ studio: "animation", view: "projects" });
  };

  const commitPartImport = async (definition: PartImportCommitDefinition) => {
    const result = await importPartAsset(definition);
    return result.status === "ok"
      ? { status: "ok" as const, partAsset: result.value.partAsset }
      : { status: "error" as const, message: result.message };
  };

  if (!projectId) {
    return (
      <div className={styles.view}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Animation Workspace</span>
            <h1 id="animation-workspace-view-title">Kein Animationsprojekt geöffnet.</h1>
            <p>
              Öffne ein vorhandenes Projekt oder lege bewusst ein neues an,
              bevor der Workspace geladen wird.
            </p>
          </div>
          <button className={styles.primaryButton} type="button" onClick={goToProjects}>
            Projekte öffnen
          </button>
        </header>
        <Surface className={styles.statePanel} tone="soft" role="note">
          <strong>Der Editor bleibt ohne Projekt geschlossen.</strong>
          <p>Es werden weder Beispieldaten erzeugt noch Projekte automatisch geöffnet.</p>
        </Surface>
      </div>
    );
  }

  if (
    activeProjectId !== projectId ||
    activeLoadStatus === "idle" ||
    activeLoadStatus === "loading"
  ) {
    return (
      <div className={styles.view}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Animation Workspace</span>
            <h1 id="animation-workspace-view-title">Animationsprojekt wird geladen …</h1>
            <p>Die Projekt-ID aus der Route bleibt während des Ladevorgangs unverändert.</p>
          </div>
        </header>
        <Surface className={styles.statePanel} tone="soft" role="status">
          <strong>Lokale Projektmetadaten werden gelesen.</strong>
        </Surface>
      </div>
    );
  }

  if (activeLoadStatus !== "ready" || !activeProject) {
    return (
      <div className={styles.view}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Animation Workspace</span>
            <h1 id="animation-workspace-view-title">
              {activeLoadStatus === "notFound"
                ? "Animationsprojekt wurde nicht gefunden."
                : "Animationsprojekt konnte nicht geöffnet werden."}
            </h1>
            <p>{activeLoadError ?? "Die lokalen Projektdaten sind nicht verfügbar."}</p>
          </div>
          <button className={styles.primaryButton} type="button" onClick={goToProjects}>
            Zur Projektübersicht
          </button>
        </header>
        <Surface className={styles.statePanel} tone="soft" role="alert">
          <strong>Die Route wurde nicht automatisch umgeschrieben.</strong>
          <p>
            Prüfe die Projektübersicht und wähle dort ein vorhandenes Projekt.
            Es entsteht keine Weiterleitungs- oder Ladeschleife.
          </p>
        </Surface>
      </div>
    );
  }

  return (
    <AnimationWorkspace
      key={activeProject.projectId}
      project={activeProject}
      canSave={canSaveProject}
      saveStatus={saveStatus}
      saveError={commandError ?? saveError}
      sourceError={rawProjectError?.message ?? null}
      onSave={() => void explicitSave()}
      partAssets={partSources.assets}
      missingPartAssetIds={partSources.missingAssetIds}
      partAssetLoadError={partSources.error}
      partAssetsLoading={partSources.status === "loading"}
      imageDecoder={imageDecoder}
      onImportPart={commitPartImport}
    />
  );
}
