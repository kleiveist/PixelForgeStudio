import { useEffect, useRef, useState } from "react";
import { Surface } from "../../components/ui";
import type { StableId } from "../../schemas";
import { useAnimationProject } from "../../store/animation";
import { useNavigation } from "../../store/navigation";
import { DIRECTION_SOURCE_MODE_LABELS } from "./animationProjectsData";
import styles from "./AnimationProjectsView.module.css";

export interface AnimationWorkspaceLifecycleViewProps {
  readonly projectId?: StableId;
}

const saveStatusCopy = {
  idle: "Noch nicht gespeichert",
  dirty: "Ungespeicherte Änderungen",
  saving: "Änderungen werden gespeichert …",
  saved: "Alle Änderungen gespeichert",
  failed: "Speichern fehlgeschlagen"
} as const;

export function AnimationWorkspaceLifecycleView({
  projectId
}: AnimationWorkspaceLifecycleViewProps) {
  const {
    activeLoadError,
    activeLoadStatus,
    activeProject,
    activeProjectId,
    canSaveProject,
    openProject,
    rawProjectError,
    saveActiveProject,
    saveError,
    saveStatus
  } = useAnimationProject();
  const { navigateTo } = useNavigation();
  const attemptedProjectRef = useRef<StableId | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);

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

  const explicitSave = async () => {
    setCommandError(null);
    const result = await saveActiveProject();
    if (result.status !== "ok") setCommandError(result.message);
  };

  const goToProjects = () => {
    navigateTo({ studio: "animation", view: "projects" });
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
    <div className={styles.view}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Animation Workspace · Projekt geöffnet</span>
          <h1 id="animation-workspace-view-title">{activeProject.name}</h1>
          <p>
            Projektmetadaten und Speicherstatus sind aktiv. Rig-, Slot- und
            Animationseditoren werden in den folgenden Prompt-Phasen ergänzt.
          </p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!canSaveProject}
          onClick={() => void explicitSave()}
        >
          Jetzt speichern
        </button>
      </header>

      <div className={styles.workspaceGrid}>
        <Surface as="section" className={styles.workspacePanel} tone="raised" aria-labelledby="animation-project-status-title">
          <span className={styles.sectionIndex}>01 · Projektstatus</span>
          <h2 id="animation-project-status-title">{saveStatusCopy[saveStatus]}</h2>
          <dl className={styles.projectFacts}>
            <div><dt>Projekt-ID</dt><dd>{activeProject.projectId}</dd></div>
            <div><dt>Rig</dt><dd>{activeProject.rigTemplateId}</dd></div>
            <div><dt>Richtungen</dt><dd>{DIRECTION_SOURCE_MODE_LABELS[activeProject.directionSourceMode]}</dd></div>
            <div><dt>Frame</dt><dd>{activeProject.frameProfile.frameSize.width} × {activeProject.frameProfile.frameSize.height} px</dd></div>
            <div><dt>Figur</dt><dd>{activeProject.frameProfile.characterHeight} px · Fußanker {activeProject.frameProfile.footAnchor.x}/{activeProject.frameProfile.footAnchor.y}</dd></div>
          </dl>
          {saveError || commandError ? (
            <p className={styles.dialogError} role="alert">{commandError ?? saveError}</p>
          ) : null}
          {rawProjectError ? (
            <p className={styles.dialogError} role="alert">{rawProjectError.message}</p>
          ) : null}
        </Surface>

        <Surface as="section" className={styles.workspacePanel} tone="soft" aria-labelledby="animation-editor-placeholder-title">
          <span className={styles.sectionIndex}>02 · Editorgrenze</span>
          <h2 id="animation-editor-placeholder-title">Editorflächen folgen kontrolliert.</h2>
          <p>
            Character Kits, Import, Rig-Bearbeitung, Canvas und Frame-Editor
            bleiben hier bewusst Platzhalter. Prompt 35 verwaltet ausschließlich
            den validierten Projektlebenszyklus.
          </p>
        </Surface>
      </div>
    </div>
  );
}
