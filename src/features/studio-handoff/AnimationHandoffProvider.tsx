import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  createAnimationProjectSeedFromCharacterProfile,
  type AnimationHandoffDecisions
} from "../../domain/studio-handoff";
import {
  resolveProfile,
  type ProfileResolutionResult,
  type ResolvedProfile
} from "../../domain/profiles";
import { HUMANOID_80_FRAME_PROFILE } from "../../domain/animation";
import type { ProfileLibrary, StableId } from "../../schemas";
import { useAnimationProject } from "../../store/animation";
import { useNavigation } from "../../store/navigation";
import { useProfileLibrary } from "../../store/profiles";
import styles from "./AnimationHandoffProvider.module.css";

export interface AnimationHandoffContextValue {
  readonly prepareProfile: (profileId: StableId) => void;
  readonly prepareResolvedProfile: (profile: ResolvedProfile) => void;
}

const NOOP_CONTEXT: AnimationHandoffContextValue = Object.freeze({
  prepareProfile: () => undefined,
  prepareResolvedProfile: () => undefined
});

const AnimationHandoffContext =
  createContext<AnimationHandoffContextValue>(NOOP_CONTEXT);

function resolveLibraryProfile(
  library: ProfileLibrary,
  profileId: StableId
): ProfileResolutionResult | null {
  const assetProfile = library.assetProfiles.find(({ id }) => id === profileId);
  if (!assetProfile) return null;
  const baseProfile = library.baseProfiles.find(
    ({ id }) => id === assetProfile.baseProfileId
  );
  const categoryProfile = assetProfile.categoryProfileId
    ? library.categoryProfiles.find(({ id }) => id === assetProfile.categoryProfileId)
    : undefined;
  return resolveProfile({
    assetProfile,
    ...(baseProfile ? { baseProfile } : {}),
    ...(categoryProfile ? { categoryProfile } : {})
  });
}

function resolvedResult(profile: ResolvedProfile): ProfileResolutionResult {
  return Object.freeze({
    status: "resolved",
    profile,
    conflicts: Object.freeze([] as const),
    notices: Object.freeze([])
  });
}

function blockerLabel(code: string): string {
  switch (code) {
    case "profileConflict":
      return "Die Profilkette enthält Konflikte und ist nicht produktionsbereit.";
    case "wrongCategory":
      return "Nur Character-Profile können ein Humanoid-Projekt vorbereiten.";
    case "nonHumanoid":
      return "Tier- und Kreaturenprofile passen nicht zur Humanoid-Rigvorlage.";
    case "missingCharacterHeight":
      return "Die wirksame Figurenhöhe fehlt.";
    case "missingDirectionCount":
      return "Im Profil muss eine Richtungszahl gewählt sein.";
    default:
      return "Das Profil kann nicht sicher übertragen werden.";
  }
}

export function AnimationHandoffProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { libraryResult } = useProfileLibrary();
  const { createProject } = useAnimationProject();
  const { navigateTo } = useNavigation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [resolution, setResolution] = useState<ProfileResolutionResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [acceptWalkFrames, setAcceptWalkFrames] = useState(false);
  const [directionDecision, setDirectionDecision] = useState<
    AnimationHandoffDecisions["directionDecision"]
  >();
  const [creating, setCreating] = useState(false);

  const resetDecisions = useCallback(() => {
    setAcceptWalkFrames(false);
    setDirectionDecision(undefined);
    setRequestError(null);
    setCreating(false);
  }, []);

  const openResolution = useCallback(
    (next: ProfileResolutionResult) => {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      resetDecisions();
      setResolution(next);
    },
    [resetDecisions]
  );

  const prepareProfile = useCallback(
    (profileId: StableId) => {
      if (libraryResult.status !== "valid") {
        setResolution(null);
        setRequestError("Die Profilbibliothek ist derzeit nicht lesbar.");
        return;
      }
      const next = resolveLibraryProfile(libraryResult.value, profileId);
      if (!next) {
        setResolution(null);
        setRequestError("Das ausgewählte Profil wurde nicht gefunden.");
        return;
      }
      openResolution(next);
    },
    [libraryResult, openResolution]
  );

  const prepareResolvedProfile = useCallback(
    (profile: ResolvedProfile) => openResolution(resolvedResult(profile)),
    [openResolution]
  );

  const visible = resolution !== null || requestError !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible && !dialog.open) {
      try {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      } catch {
        dialog.setAttribute("open", "");
      }
      cancelButtonRef.current?.focus();
    }
    if (!visible && dialog.open) {
      try {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      } catch {
        dialog.removeAttribute("open");
      }
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    }
  }, [visible]);

  const decisions = useMemo<AnimationHandoffDecisions>(
    () => ({
      ...(acceptWalkFrames ? { acceptEightFrameWalkTemplate: true } : {}),
      ...(directionDecision ? { directionDecision } : {})
    }),
    [acceptWalkFrames, directionDecision]
  );
  const result = resolution
    ? createAnimationProjectSeedFromCharacterProfile(resolution, decisions)
    : null;

  const close = () => {
    if (creating) return;
    setResolution(null);
    setRequestError(null);
    resetDecisions();
  };

  const confirm = async () => {
    if (!result || result.status !== "ready") return;
    setCreating(true);
    setRequestError(null);
    const { seed } = result;
    const frameHeight = Math.max(
      HUMANOID_80_FRAME_PROFILE.frameSize.height,
      seed.characterHeight + 48
    );
    const project = await createProject({
      name: seed.displayName,
      frameProfile: Object.freeze({
        frameSize: Object.freeze({
          width: HUMANOID_80_FRAME_PROFILE.frameSize.width,
          height: frameHeight
        }),
        characterHeight: seed.characterHeight,
        footAnchor: Object.freeze({
          x: HUMANOID_80_FRAME_PROFILE.footAnchor.x,
          y: frameHeight - 16
        })
      }),
      directionSourceMode: "fiveAuthoredPlusMirror",
      directionRequirement: seed.directionRequirement,
      walk: Object.freeze({
        enabled: seed.walkTemplate.enabled,
        frameCount: seed.walkTemplate.templateFrames,
        fps: 10
      }),
      sourcePrompt: Object.freeze({
        assetProfileId: seed.sourcePromptProfileId,
        profileName: seed.displayName,
        compatibilityKey: seed.baseCompatibilityKey,
        requestedDirectionCount: seed.requestedDirectionCount,
        directionDecision: seed.directionDecision,
        requestedActions: seed.requestedClips
      })
    });
    if (project.status !== "ok") {
      setCreating(false);
      setRequestError(project.message);
      return;
    }
    setResolution(null);
    setCreating(false);
    navigateTo({
      studio: "animation",
      view: "workspace",
      projectId: project.value.projectId
    });
  };

  const value = useMemo<AnimationHandoffContextValue>(
    () => ({ prepareProfile, prepareResolvedProfile }),
    [prepareProfile, prepareResolvedProfile]
  );

  const frameConflict =
    result?.status === "confirmationRequired"
      ? result.confirmations.find(({ code }) => code === "walkFrameMismatch")
      : undefined;
  const directionConflict =
    result?.status === "confirmationRequired"
      ? result.confirmations.find(({ code }) => code === "fourDirectionDecision")
      : undefined;

  return (
    <AnimationHandoffContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="animation-handoff-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            )
          ];
          const first = controls[0];
          const last = controls.at(-1);
          if (!first || !last) return;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className={styles.content}>
          <h2 id="animation-handoff-title">Animationsprojekt vorbereiten</h2>
          <p>
            Übertragen werden nur Profil-ID, Bezeichnung, Figurenhöhe,
            Compatibility Key sowie Richtungs- und Animationswünsche. Prompttexte
            und Bilder bleiben im Prompt Studio.
          </p>

          {requestError ? <p className={styles.error} role="alert">{requestError}</p> : null}
          {result?.status === "blocked" ? (
            <ul className={styles.blockers} role="alert">
              {result.blockers.map((blocker) => (
                <li key={blocker.code}>{blockerLabel(blocker.code)}</li>
              ))}
            </ul>
          ) : null}

          {frameConflict && frameConflict.code === "walkFrameMismatch" ? (
            <label className={styles.choice}>
              <input
                type="checkbox"
                checked={acceptWalkFrames}
                onChange={(event) => setAcceptWalkFrames(event.currentTarget.checked)}
              />
              <span>
                Gewünscht: {frameConflict.requestedFrames} Walk-Frames. Das
                Built-in-Template besitzt {frameConflict.templateFrames}. Ich
                übernehme bewusst das 8-Frame-Template.
              </span>
            </label>
          ) : null}

          {directionConflict ? (
            <fieldset className={styles.choices}>
              <legend>Vier Richtungen bewusst behandeln</legend>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="handoff-directions"
                  checked={directionDecision === "retainFourDirectionRequirement"}
                  onChange={() => setDirectionDecision("retainFourDirectionRequirement")}
                />
                <span>Als 4-Richtungsanforderung markieren; 8-Richtungs-Export bleibt gesperrt.</span>
              </label>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="handoff-directions"
                  checked={directionDecision === "upgradeToEightDirectionMvp"}
                  onChange={() => setDirectionDecision("upgradeToEightDirectionMvp")}
                />
                <span>Bewusst auf den 8-Richtungs-MVP hochstufen.</span>
              </label>
            </fieldset>
          ) : null}

          {result?.status === "ready" ? (
            <p role="status">
              Der Seed ist bereit. Danach importierst du die Körperteil-PNGs;
              aus dem Textprompt wird kein Bild erzeugt oder übertragen.
            </p>
          ) : null}

          <div className={styles.actions}>
            <button ref={cancelButtonRef} type="button" onClick={close} disabled={creating}>Abbrechen</button>
            <button
              className={styles.primary}
              type="button"
              disabled={result?.status !== "ready" || creating}
              onClick={() => void confirm()}
            >
              {creating ? "Projekt wird angelegt …" : "Projekt anlegen"}
            </button>
          </div>
        </div>
      </dialog>
    </AnimationHandoffContext.Provider>
  );
}

export function useAnimationHandoff(): AnimationHandoffContextValue {
  return useContext(AnimationHandoffContext);
}
