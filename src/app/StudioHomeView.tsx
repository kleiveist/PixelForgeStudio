import { StudioLink } from "../components/navigation";
import { Badge, Surface } from "../components/ui";
import { BRAND } from "../config";
import type { StudioRoute } from "../domain/navigation";
import { ProfileCard } from "../features/dashboard/ProfileCard";
import { formatDashboardDate } from "../features/dashboard/dashboardData";
import type { StableId } from "../schemas";
import type { StudioHomeData } from "./studioHomeData";
import styles from "./StudioHomeView.module.css";

export interface StudioHomeViewProps {
  readonly animationRoute: StudioRoute;
  readonly data: StudioHomeData;
  readonly onOpenProfile: (profileId: StableId) => void;
  readonly onResumeDraft: (draftId: StableId) => void;
  readonly promptRoute: StudioRoute;
}

const collectionMessages = {
  empty: {
    title: "Noch keine Prompt-Profile gespeichert",
    description:
      "Erstelle im Prompt Studio dein erstes Assetprofil; es erscheint danach hier."
  },
  invalid: {
    title: "Prompt-Profile konnten nicht gelesen werden",
    description:
      "Die lokalen Daten bleiben unangetastet und können in den Einstellungen geprüft werden."
  },
  unavailable: {
    title: "Lokale Prompt-Profile sind nicht verfügbar",
    description:
      "Beide Studios bleiben erreichbar, gespeicherte Profile können momentan aber nicht zusammengefasst werden."
  }
} as const;

export function StudioHomeView({
  animationRoute,
  data,
  onOpenProfile,
  onResumeDraft,
  promptRoute
}: StudioHomeViewProps) {
  const draft = data.draft;
  const collectionMessage =
    data.collectionStatus === "ready"
      ? null
      : collectionMessages[data.collectionStatus];

  return (
    <div className={styles.home} data-studio-view="home">
      <header className={styles.hero}>
        <Badge tone="accent">Studio-Startseite · {BRAND.versionLabel}</Badge>
        <p className={styles.eyebrow}>Eine Dachoberfläche. Zwei Werkzeuge.</p>
        <h1 id="studio-home-title">{BRAND.productName}</h1>
        <p className={styles.intro}>{BRAND.tagline}.</p>
      </header>

      <nav className={styles.moduleNavigation} aria-label="Studios starten">
        <ul className={styles.moduleGrid}>
          <li>
            <StudioLink
              aria-label="Prompt Studio öffnen"
              className={styles.moduleCard}
              route={promptRoute}
            >
              <span className={styles.moduleIndex} aria-hidden="true">
                01
              </span>
              <span className={styles.moduleCopy}>
                <strong>{BRAND.modules.prompt.shortLabel}</strong>
                <span>
                  Pixelart-Produktion mit Profilen, Wizard, Prüfung und vier
                  Prompt-Ausgaben.
                </span>
              </span>
              <span className={styles.moduleAction} aria-hidden="true">
                Prompt Studio öffnen →
              </span>
            </StudioLink>
          </li>
          <li>
            <StudioLink
              aria-label="Animation Studio öffnen"
              className={styles.moduleCard}
              route={animationRoute}
            >
              <span className={styles.moduleIndex} aria-hidden="true">
                02
              </span>
              <span className={styles.moduleCopy}>
                <strong>{BRAND.modules.animation.shortLabel}</strong>
                <span>
                  Lokaler Einstieg für Projekte, Rig-Workspace, Character Kits
                  und Vorlagen.
                </span>
              </span>
              <span className={styles.moduleAction} aria-hidden="true">
                Animation Studio öffnen →
              </span>
            </StudioLink>
          </li>
        </ul>
      </nav>

      {draft ? (
        <section className={styles.section} aria-labelledby="home-draft-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Direkt weiterarbeiten</p>
            <h2 id="home-draft-title">Letzter Prompt-Entwurf</h2>
          </div>
          <button
            className={styles.draftCard}
            type="button"
            onClick={() => onResumeDraft(draft.id)}
          >
            <span>
              <strong>{draft.projectName}</strong>
              <span>
                {draft.categoryLabel
                  ? `${draft.categoryLabel} · `
                  : ""}
                Schritt {draft.currentStep}
              </span>
              <time dateTime={draft.savedAt}>
                Gesichert {formatDashboardDate(draft.savedAt)}
              </time>
            </span>
            <span className={styles.inlineAction}>Entwurf fortsetzen →</span>
          </button>
        </section>
      ) : data.draftStatus === "invalid" ||
        data.draftStatus === "unavailable" ? (
        <p className={styles.notice} role="note">
          {data.draftStatus === "invalid"
            ? "Der lokale Prompt-Entwurf ist ungültig und wurde nicht automatisch geöffnet."
            : "Der lokale Prompt-Entwurf kann derzeit nicht gelesen werden."}
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="home-profiles-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Prompt Studio</p>
          <h2 id="home-profiles-title">Letzte Profile</h2>
          <StudioLink route={{ studio: "prompt", view: "profiles" }}>
            Alle Profile öffnen →
          </StudioLink>
        </div>

        {data.recentProfiles.length > 0 ? (
          <ul className={styles.profileGrid}>
            {data.recentProfiles.map((profile) => (
              <li key={profile.id}>
                <ProfileCard profile={profile} onOpen={onOpenProfile} />
              </li>
            ))}
          </ul>
        ) : collectionMessage ? (
          <Surface className={styles.emptyState} tone="soft" role="note">
            <strong>{collectionMessage.title}</strong>
            <p>{collectionMessage.description}</p>
          </Surface>
        ) : (
          <Surface className={styles.emptyState} tone="soft" role="note">
            <strong>Keine kompatiblen Prompt-Profile</strong>
            <p>
              Vorhandene inkonsistente Profile bleiben gespeichert und werden
              hier nicht als produktionsbereit dargestellt.
            </p>
          </Surface>
        )}
        {data.skippedProfileCount > 0 ? (
          <p className={styles.notice} role="note">
            {data.skippedProfileCount} inkonsistente Profile wurden aus der
            Zusammenfassung ausgeblendet und nicht verändert.
          </p>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="home-animation-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Animation Studio</p>
          <h2 id="home-animation-title">Letzte Animationsprojekte</h2>
        </div>
        <Surface className={styles.emptyState} tone="soft" role="note">
          <strong>Noch keine Animationsprojekte verfügbar</strong>
          <p>
            Die Projektablage wird in Prompt 35 angeschlossen. Bis dahin zeigt
            die Startseite bewusst keine erfundenen Projekte.
          </p>
          <StudioLink route={{ studio: "animation", view: "projects" }}>
            Animationsbereich öffnen →
          </StudioLink>
        </Surface>
      </section>
    </div>
  );
}
