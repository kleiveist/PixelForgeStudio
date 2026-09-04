import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject
} from "react";
import { useForm } from "react-hook-form";
import { Surface } from "../../components/ui";
import type { DirectionSourceMode } from "../../domain/animation";
import type { StableId } from "../../schemas";
import type { AnimationProjectSummary } from "../../services";
import { useAnimationProject } from "../../store/animation";
import { useNavigation } from "../../store/navigation";
import { AnimationProjectDialog } from "./AnimationProjectDialog";
import {
  AnimationProjectCreationSchema,
  DEFAULT_ANIMATION_PROJECT_CREATION_VALUES,
  RenameAnimationProjectSchema,
  toCreateAnimationProjectDefinition,
  type AnimationProjectCreationValues,
  type RenameAnimationProjectValues
} from "./animationProjectCreation.schema";
import {
  DIRECTION_SOURCE_MODE_LABELS,
  filterAndSortAnimationProjects,
  type AnimationProjectSort
} from "./animationProjectsData";
import styles from "./AnimationProjectsView.module.css";

type ProjectDialogState =
  | Readonly<{ type: "create" }>
  | Readonly<{ type: "rename"; project: AnimationProjectSummary }>
  | Readonly<{ type: "delete"; project: AnimationProjectSummary }>
  | null;

function fieldError(message: string | undefined) {
  return message ? (
    <span className={styles.fieldError} role="alert">
      {message}
    </span>
  ) : null;
}

function combineInputRef(
  formRef: (element: HTMLInputElement | null) => void,
  localRef: RefObject<HTMLInputElement | null>
) {
  return (element: HTMLInputElement | null) => {
    formRef(element);
    localRef.current = element;
  };
}

function CreateProjectDialog({
  onCancel,
  onCreated
}: Readonly<{
  onCancel: () => void;
  onCreated: (projectId: StableId) => void;
}>) {
  const { createProject } = useAnimationProject();
  const nameRef = useRef<HTMLInputElement>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch
  } = useForm<AnimationProjectCreationValues>({
    resolver: zodResolver(AnimationProjectCreationSchema),
    defaultValues: DEFAULT_ANIMATION_PROJECT_CREATION_VALUES
  });
  const nameRegistration = register("name");
  const walkEnabled = watch("walkEnabled");

  const submit = handleSubmit(async (values) => {
    setCommandError(null);
    const result = await createProject(toCreateAnimationProjectDefinition(values));
    if (result.status === "ok") {
      onCreated(result.value.projectId);
      return;
    }
    setCommandError(result.message);
  });

  return (
    <AnimationProjectDialog
      title="Neues Animationsprojekt"
      description="Lege die technische Ausgangsbasis fest. Alle Werte bleiben später als Projektmetadaten nachvollziehbar."
      initialFocusRef={nameRef}
      onCancel={onCancel}
    >
      <form className={styles.dialogForm} onSubmit={submit} noValidate>
        <label className={styles.fullField}>
          <span>Projektname</span>
          <input
            {...nameRegistration}
            ref={combineInputRef(nameRegistration.ref, nameRef)}
            autoComplete="off"
            aria-invalid={errors.name ? "true" : undefined}
          />
          {fieldError(errors.name?.message)}
        </label>

        <label className={styles.fullField}>
          <span>Rig-Vorlage</span>
          <input {...register("rigTemplateId")} readOnly />
        </label>

        <fieldset className={styles.fieldGroup}>
          <legend>Frame-Profil</legend>
          <label>
            <span>Framebreite</span>
            <input
              type="number"
              {...register("frameWidth", { valueAsNumber: true })}
              aria-invalid={errors.frameWidth ? "true" : undefined}
            />
            {fieldError(errors.frameWidth?.message)}
          </label>
          <label>
            <span>Framehöhe</span>
            <input
              type="number"
              {...register("frameHeight", { valueAsNumber: true })}
              aria-invalid={errors.frameHeight ? "true" : undefined}
            />
            {fieldError(errors.frameHeight?.message)}
          </label>
          <label>
            <span>Figurenhöhe</span>
            <input
              type="number"
              {...register("characterHeight", { valueAsNumber: true })}
              aria-invalid={errors.characterHeight ? "true" : undefined}
            />
            {fieldError(errors.characterHeight?.message)}
          </label>
          <label>
            <span>Fußanker X</span>
            <input
              type="number"
              {...register("footAnchorX", { valueAsNumber: true })}
              aria-invalid={errors.footAnchorX ? "true" : undefined}
            />
            {fieldError(errors.footAnchorX?.message)}
          </label>
          <label>
            <span>Fußanker Y</span>
            <input
              type="number"
              {...register("footAnchorY", { valueAsNumber: true })}
              aria-invalid={errors.footAnchorY ? "true" : undefined}
            />
            {fieldError(errors.footAnchorY?.message)}
          </label>
        </fieldset>

        <label className={styles.fullField}>
          <span>Richtungsquellen</span>
          <select {...register("directionSourceMode")}>
            {(Object.keys(DIRECTION_SOURCE_MODE_LABELS) as DirectionSourceMode[]).map(
              (mode) => (
                <option key={mode} value={mode}>
                  {DIRECTION_SOURCE_MODE_LABELS[mode]}
                </option>
              )
            )}
          </select>
        </label>

        <fieldset className={styles.fieldGroup}>
          <legend>Startclip</legend>
          <label className={styles.checkboxField}>
            <input type="checkbox" {...register("walkEnabled")} />
            <span>Walk aktiv anlegen</span>
          </label>
          <label>
            <span>Frames</span>
            <input
              type="number"
              readOnly={!walkEnabled}
              {...register("walkFrameCount", { valueAsNumber: true })}
              aria-invalid={errors.walkFrameCount ? "true" : undefined}
            />
            {fieldError(errors.walkFrameCount?.message)}
          </label>
          <label>
            <span>FPS</span>
            <input
              type="number"
              readOnly={!walkEnabled}
              {...register("walkFps", { valueAsNumber: true })}
              aria-invalid={errors.walkFps ? "true" : undefined}
            />
            {fieldError(errors.walkFps?.message)}
          </label>
        </fieldset>

        {commandError ? (
          <p className={styles.dialogError} role="alert">
            {commandError}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <button className={styles.secondaryButton} type="button" onClick={onCancel}>
            Abbrechen
          </button>
          <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Projekt wird angelegt …" : "Projekt anlegen"}
          </button>
        </div>
      </form>
    </AnimationProjectDialog>
  );
}

function RenameProjectDialog({
  onCancel,
  onRenamed,
  project
}: Readonly<{
  onCancel: () => void;
  onRenamed: (name: string) => void;
  project: AnimationProjectSummary;
}>) {
  const { renameProject } = useAnimationProject();
  const nameRef = useRef<HTMLInputElement>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register
  } = useForm<RenameAnimationProjectValues>({
    resolver: zodResolver(RenameAnimationProjectSchema),
    defaultValues: { name: project.name }
  });
  const nameRegistration = register("name");

  const submit = handleSubmit(async ({ name }) => {
    setCommandError(null);
    const result = await renameProject(project.projectId, name);
    if (result.status === "ok") {
      onRenamed(result.value.name);
      return;
    }
    setCommandError(result.message);
  });

  return (
    <AnimationProjectDialog
      title={`„${project.name}“ umbenennen`}
      description="Nur der Anzeigename wird geändert; Projekt-ID und Inhalte bleiben unverändert."
      initialFocusRef={nameRef}
      onCancel={onCancel}
    >
      <form className={styles.dialogForm} onSubmit={submit} noValidate>
        <label className={styles.fullField}>
          <span>Projektname</span>
          <input
            {...nameRegistration}
            ref={combineInputRef(nameRegistration.ref, nameRef)}
            autoComplete="off"
            aria-invalid={errors.name ? "true" : undefined}
          />
          {fieldError(errors.name?.message)}
        </label>
        {commandError ? (
          <p className={styles.dialogError} role="alert">
            {commandError}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <button className={styles.secondaryButton} type="button" onClick={onCancel}>
            Abbrechen
          </button>
          <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Name wird gespeichert …" : "Namen speichern"}
          </button>
        </div>
      </form>
    </AnimationProjectDialog>
  );
}

function DeleteProjectDialog({
  error,
  onCancel,
  onConfirm,
  project,
  submitting
}: Readonly<{
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  project: AnimationProjectSummary;
  submitting: boolean;
}>) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AnimationProjectDialog
      title={`„${project.name}“ endgültig löschen?`}
      description="Das lokale Animationsprojekt wird entfernt. Dieser Schritt kann nicht rückgängig gemacht werden."
      initialFocusRef={cancelRef}
      onCancel={onCancel}
      tone="danger"
    >
      {error ? (
        <p className={styles.dialogError} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.dialogActions}>
        <button ref={cancelRef} className={styles.secondaryButton} type="button" onClick={onCancel}>
          Abbrechen
        </button>
        <button className={styles.dangerButton} type="button" disabled={submitting} onClick={onConfirm}>
          {submitting ? "Projekt wird gelöscht …" : "Projekt endgültig löschen"}
        </button>
      </div>
    </AnimationProjectDialog>
  );
}

const saveStatusLabels = {
  idle: "Nicht geöffnet",
  dirty: "Ungespeichert",
  saving: "Wird gespeichert …",
  saved: "Gespeichert",
  failed: "Speichern fehlgeschlagen"
} as const;

function preventSearchSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

export function AnimationProjectsView() {
  const {
    activeProjectId,
    deleteProject,
    duplicateProject,
    openProject,
    projectListError,
    projectListStatus,
    projectSummaries,
    refreshProjects,
    saveStatus
  } = useAnimationProject();
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<AnimationProjectSort>("updatedDesc");
  const [dialog, setDialog] = useState<ProjectDialogState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreDialogFocus, setRestoreDialogFocus] = useState(false);
  const [focusResults, setFocusResults] = useState(false);
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const visibleProjects = useMemo(
    () => filterAndSortAnimationProjects(projectSummaries, query, sort),
    [projectSummaries, query, sort]
  );

  useEffect(() => {
    if (!restoreDialogFocus || dialog !== null) return;
    dialogTriggerRef.current?.focus();
    setRestoreDialogFocus(false);
  }, [dialog, restoreDialogFocus]);

  useEffect(() => {
    if (!focusResults) return;
    resultsHeadingRef.current?.focus();
    setFocusResults(false);
  }, [focusResults]);

  const closeDialog = () => {
    setMutationError(null);
    setDialog(null);
    setRestoreDialogFocus(true);
  };

  const requestDialog = (
    nextDialog: Exclude<ProjectDialogState, null>,
    trigger: HTMLButtonElement
  ) => {
    dialogTriggerRef.current = trigger;
    setNotice(null);
    setMutationError(null);
    setDialog(nextDialog);
  };

  const open = async (projectId: StableId) => {
    setNotice(null);
    setMutationError(null);
    const result = await openProject(projectId);
    if (result.status !== "ok") {
      setMutationError(result.message);
      return;
    }
    navigateTo({ studio: "animation", view: "workspace", projectId });
  };

  const duplicate = async (project: AnimationProjectSummary) => {
    setNotice(null);
    setMutationError(null);
    const result = await duplicateProject(project.projectId);
    if (result.status !== "ok") {
      setMutationError(result.message);
      return;
    }
    setNotice(`„${result.value.name}“ wurde als eigenständiges Projekt angelegt.`);
  };

  const confirmDelete = async () => {
    if (dialog?.type !== "delete") return;
    setIsDeleting(true);
    setMutationError(null);
    const result = await deleteProject(dialog.project.projectId);
    setIsDeleting(false);
    if (result.status !== "ok") {
      setMutationError(result.message);
      return;
    }
    setNotice(`„${dialog.project.name}“ wurde gelöscht.`);
    setDialog(null);
    setFocusResults(true);
  };

  const listUnavailable =
    projectListStatus === "invalid" ||
    projectListStatus === "unavailable" ||
    projectListStatus === "failed";

  return (
    <div className={styles.view}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Animation Studio</span>
          <h1 id="animation-projects-view-title">Animationsprojekte organisieren.</h1>
          <p>
            Lege lokale Projekte an, finde vorhandene Produktionen und öffne
            ihren stabil adressierten Workspace.
          </p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={(event) => requestDialog({ type: "create" }, event.currentTarget)}
        >
          <span aria-hidden="true">+</span> Neues Projekt
        </button>
      </header>

      <Surface as="section" tone="raised" className={styles.filterPanel} aria-labelledby="animation-project-filter-title">
        <div>
          <span className={styles.sectionIndex}>01 · Auswahl</span>
          <h2 id="animation-project-filter-title">Projektliste eingrenzen</h2>
        </div>
        <form className={styles.filters} role="search" onSubmit={preventSearchSubmit}>
          <label>
            <span>Animationsprojekte durchsuchen</span>
            <input
              type="search"
              value={query}
              placeholder="Name, Rig oder Richtungsmodus"
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
          </label>
          <label>
            <span>Sortierung</span>
            <select value={sort} onChange={(event) => setSort(event.currentTarget.value as AnimationProjectSort)}>
              <option value="updatedDesc">Zuletzt bearbeitet</option>
              <option value="updatedAsc">Älteste zuerst</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </label>
        </form>
      </Surface>

      {notice ? <p className={styles.successNotice} role="status">{notice}</p> : null}
      {mutationError && dialog?.type !== "delete" ? (
        <p className={styles.errorNotice} role="alert">{mutationError}</p>
      ) : null}

      <section className={styles.results} aria-labelledby="animation-project-results-title">
        <div className={styles.resultsHeading}>
          <div>
            <span className={styles.sectionIndex}>02 · Projekte</span>
            <h2 id="animation-project-results-title" ref={resultsHeadingRef} tabIndex={-1}>
              Lokale Projekte
            </h2>
          </div>
          <p>{visibleProjects.length} von {projectSummaries.length}</p>
        </div>

        {projectListStatus === "idle" || projectListStatus === "loading" ? (
          <Surface className={styles.statePanel} tone="soft" role="status">
            <strong>Projektliste wird geladen …</strong>
          </Surface>
        ) : null}

        {listUnavailable ? (
          <Surface className={styles.statePanel} tone="soft" role="alert">
            <strong>
              {projectListStatus === "unavailable"
                ? "Lokaler Animationsspeicher ist nicht verfügbar"
                : "Animationsprojekte konnten nicht gelesen werden"}
            </strong>
            <p>{projectListError}</p>
            <button className={styles.secondaryButton} type="button" onClick={() => void refreshProjects()}>
              Erneut versuchen
            </button>
          </Surface>
        ) : null}

        {projectListStatus === "ready" && visibleProjects.length > 0 ? (
          <ul className={styles.projectGrid}>
            {visibleProjects.map((project) => {
              const isActive = activeProjectId === project.projectId;
              return (
                <li key={project.projectId}>
                  <article className={styles.projectCard} data-active={isActive ? "true" : undefined}>
                    <div className={styles.projectCardHeader}>
                      <span className={styles.projectGlyph} aria-hidden="true">◇</span>
                      <div>
                        <span className={styles.cardEyebrow}>{isActive ? "Geöffnet" : "Animationsprojekt"}</span>
                        <h3>{project.name}</h3>
                      </div>
                    </div>
                    <dl className={styles.projectFacts}>
                      <div><dt>Richtungen</dt><dd>{DIRECTION_SOURCE_MODE_LABELS[project.directionSourceMode]}</dd></div>
                      <div><dt>Rig</dt><dd>{project.rigTemplateId}</dd></div>
                      <div><dt>Inhalt</dt><dd>{project.partCount} Teile · {project.clipCount} Clips</dd></div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          {isActive
                            ? saveStatusLabels[saveStatus]
                            : "Lokal gespeichert"}
                        </dd>
                      </div>
                    </dl>
                    <div className={styles.cardActions}>
                      <button className={styles.primaryButton} type="button" onClick={() => void open(project.projectId)}>
                        Öffnen
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={(event) => requestDialog({ type: "rename", project }, event.currentTarget)}>
                        Umbenennen
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={() => void duplicate(project)}>
                        Duplizieren
                      </button>
                      <button className={styles.dangerTextButton} type="button" onClick={(event) => requestDialog({ type: "delete", project }, event.currentTarget)}>
                        Löschen
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}

        {projectListStatus === "ready" && visibleProjects.length === 0 ? (
          <Surface className={styles.statePanel} tone="soft" role="note">
            <strong>{projectSummaries.length === 0 ? "Noch keine Animationsprojekte" : "Keine passenden Projekte"}</strong>
            <p>
              {projectSummaries.length === 0
                ? "Lege bewusst dein erstes Projekt über „Neues Projekt“ an."
                : "Passe Suchbegriff oder Sortierung an; gespeicherte Projekte bleiben unverändert."}
            </p>
          </Surface>
        ) : null}
      </section>

      {dialog?.type === "create" ? (
        <CreateProjectDialog
          onCancel={closeDialog}
          onCreated={(projectId) => {
            setDialog(null);
            navigateTo({ studio: "animation", view: "workspace", projectId });
          }}
        />
      ) : null}
      {dialog?.type === "rename" ? (
        <RenameProjectDialog
          project={dialog.project}
          onCancel={closeDialog}
          onRenamed={(name) => {
            setNotice(`Projektname als „${name}“ gespeichert.`);
            setDialog(null);
            setRestoreDialogFocus(true);
          }}
        />
      ) : null}
      {dialog?.type === "delete" ? (
        <DeleteProjectDialog
          project={dialog.project}
          error={mutationError}
          submitting={isDeleting}
          onCancel={closeDialog}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
