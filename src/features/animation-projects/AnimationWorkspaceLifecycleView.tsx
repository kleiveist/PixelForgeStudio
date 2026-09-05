import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Surface } from "../../components/ui";
import type { AnimationPartAsset, StableId } from "../../schemas";
import type { PartImportCommitDefinition } from "../animation-part-import";
import type { AnchorEditorCommitDefinition } from "../animation-anchor-editor";
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
    activeProjectRevision,
    canRedoProject,
    canSaveProject,
    canUndoProject,
    confirmDirectionMirrorReview,
    configurePartAsset,
    imageDecoder,
    importPartAsset,
    loadPartImageBlob,
    loadPartAssets,
    openProject,
    redoActiveProject,
    removeActiveFrameOverride,
    resetActiveDirectionOverrides,
    rawProjectError,
    saveActiveProject,
    saveError,
    saveStatus,
    setActiveFrameOverride,
    updatePartLayerOffset,
    updatePartMirrorPolicy,
    updateProjectMirrorPolicy,
    undoActiveProject
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

  const loadPartBlob = async (blobId: StableId) => {
    const result = await loadPartImageBlob(blobId);
    return result.status === "ok"
      ? { status: "ok" as const, blob: result.value }
      : { status: "error" as const, message: result.message };
  };

  const commitPartSetup = async (definition: AnchorEditorCommitDefinition) => {
    const result = await configurePartAsset(definition);
    return result.status === "ok"
      ? { status: "ok" as const, partAsset: result.value.partAsset }
      : { status: "error" as const, message: result.message };
  };

  const commitPartLayerOffset = async (
    assetId: StableId,
    layerOffset: number
  ) => {
    const result = updatePartLayerOffset(assetId, layerOffset);
    return result.status === "ok"
      ? { status: "ok" as const }
      : { status: "error" as const, message: result.message };
  };

  const commitProjectMirrorPolicy: NonNullable<
    ComponentProps<typeof AnimationWorkspace>["onSetProjectMirrorPolicy"]
  > = async (mirrorPolicy) => {
    const result = updateProjectMirrorPolicy(mirrorPolicy);
    return result.status === "ok"
      ? { status: "ok" as const }
      : { status: "error" as const, message: result.message };
  };

  const commitPartMirrorPolicy: NonNullable<
    ComponentProps<typeof AnimationWorkspace>["onSetPartMirrorPolicy"]
  > = async (assetId, mirrorPolicy) => {
    const result = updatePartMirrorPolicy(assetId, mirrorPolicy);
    return result.status === "ok"
      ? { status: "ok" as const }
      : { status: "error" as const, message: result.message };
  };

  const commitMirrorReview: NonNullable<
    ComponentProps<typeof AnimationWorkspace>["onConfirmMirrorReview"]
  > = async (assetId, sourceUpdatedAt, targetDirection) => {
    const result = confirmDirectionMirrorReview({
      assetId,
      sourceUpdatedAt,
      targetDirection
    });
    return result.status === "ok"
      ? { status: "ok" as const }
      : { status: "error" as const, message: result.message };
  };

  const commitFrameOverride: NonNullable<
    ComponentProps<typeof AnimationWorkspace>["onCommitFrameOverride"]
  > = async (address, override) => {
    const result = override
      ? setActiveFrameOverride(override)
      : removeActiveFrameOverride(address);
    return result.status === "ok"
      ? { status: "ok" as const }
      : { status: "error" as const, message: result.message };
  };

  const resetDirectionFrameOverrides: NonNullable<
    ComponentProps<typeof AnimationWorkspace>["onResetDirectionOverrides"]
  > = async (clipId, direction) => {
    const result = resetActiveDirectionOverrides(clipId, direction);
    return result.status === "ok"
      ? { status: "ok" as const }
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
      projectRevision={activeProjectRevision}
      canSave={canSaveProject}
      saveStatus={saveStatus}
      saveError={commandError ?? saveError}
      sourceError={rawProjectError?.message ?? null}
      onSave={() => void explicitSave()}
      canUndo={canUndoProject}
      canRedo={canRedoProject}
      onUndo={() => undoActiveProject()}
      onRedo={() => redoActiveProject()}
      partAssets={partSources.assets}
      missingPartAssetIds={partSources.missingAssetIds}
      partAssetLoadError={partSources.error}
      partAssetsLoading={partSources.status === "loading"}
      imageDecoder={imageDecoder}
      onImportPart={commitPartImport}
      onLoadPartBlob={loadPartBlob}
      onConfigurePart={commitPartSetup}
      onSetPartLayerOffset={commitPartLayerOffset}
      onSetProjectMirrorPolicy={commitProjectMirrorPolicy}
      onSetPartMirrorPolicy={commitPartMirrorPolicy}
      onConfirmMirrorReview={commitMirrorReview}
      onCommitFrameOverride={commitFrameOverride}
      onResetDirectionOverrides={resetDirectionFrameOverrides}
    />
  );
}
