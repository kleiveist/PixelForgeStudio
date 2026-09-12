import { useI18n } from "../../i18n";
import { useState } from "react";
import { ForgeMarkIcon } from "../../components/icons";
import { ViewLink } from "../../components/navigation";
import { Badge, Surface } from "../../components/ui";
import { BRAND } from "../../config";
import type { AssetCategory } from "../../domain/assets";
import type { StableId, WizardDraft } from "../../schemas";
import type { StorageMutationResult } from "../../services";
import { CategoryIcon } from "./CategoryIcon";
import { MaterialBadge } from "./MaterialBadge";
import { ProfileCard } from "./ProfileCard";
import {
  DASHBOARD_CATEGORIES,
  MATERIAL_BADGE_IDS,
  getDashboardCategory
} from "./dashboardCatalog";
import {
  readDashboardData,
  type DashboardCollectionStatus,
  type DashboardStorage
} from "./dashboardData";
import styles from "./DashboardView.module.css";

export interface DashboardViewProps {
  readonly activeBaseProfileId: StableId | null;
  readonly storageAdapter: DashboardStorage;
  readonly onStartNewAsset: (category: AssetCategory | null) => void;
  readonly onOpenProfile: (profileId: StableId) => void;
  readonly onResumeDraft: (draftId: StableId) => void;
  readonly onSelectBaseProfile: (profileId: StableId) => StorageMutationResult;
}

const collectionMessages: Record<
  Exclude<DashboardCollectionStatus, "ready">,
  Readonly<{ title: string; description: string }>
> = {
  empty: {
    title: "Noch keine Profile gespeichert",
    description:
      "Starte mit einer Asset-Kategorie. Dein erstes Profil erscheint danach an dieser Stelle."
  },
  invalid: {
    title: "Gespeicherte Profile konnten nicht gelesen werden",
    description:
      "Die lokalen Daten bleiben unangetastet. Öffne die Profilverwaltung, um sie zu prüfen oder zu importieren."
  },
  unavailable: {
    title: "Lokaler Speicher ist nicht verfügbar",
    description:
      "Du kannst ein Asset beginnen, gespeicherte Profile können in dieser Sitzung aber nicht angezeigt werden."
  }
};

function ProfileCollectionState({
  status
}: Readonly<{ status: DashboardCollectionStatus }>) {
  const { t, tx } = useI18n();
  if (status === "ready") return null;
  const message = collectionMessages[status];
  return (
    <Surface className={styles.emptyState} tone="soft" role="note">
      <strong>{tx(message.title)}</strong>
      <p>{tx(message.description)}</p>
      <ViewLink view="profiles">{t("Profilverwaltung öffnen")}</ViewLink>
    </Surface>
  );
}

function NoResolvedProfilesState() {
  const { t } = useI18n();
  return (
    <Surface className={styles.emptyState} tone="soft" role="note">
      <strong>{t("Keine kompatiblen Profile für den Schnellzugriff")}</strong>
      <p>
        {t(
          "Vorhandene inkonsistente Profile bleiben gespeichert und können in der Profilverwaltung geprüft werden."
        )}
      </p>
      <ViewLink view="profiles">{t("Profile prüfen")}</ViewLink>
    </Surface>
  );
}

function DraftSummary({ draft }: Readonly<{ draft: WizardDraft }>) {
  const { date, t, tx } = useI18n();
  const category =
    "category" in draft ? getDashboardCategory(draft.category) : null;
  return (
    <>
      <span className={styles.draftMarker} aria-hidden="true">
        ↗
      </span>
      <span className={styles.draftCopy}>
        <span className={styles.eyebrow}>{t("Letzter Entwurf")}</span>
        <strong>{draft.projectName || t("Unbenanntes Projekt")}</strong>
        <span>
          {category ? `${tx(category.label)} · ` : ""}
          {t("Schritt")} {tx(draft.currentStep)}
        </span>
        <time dateTime={draft.savedAt}>
          {t("Gesichert")} {date(draft.savedAt)}
        </time>
      </span>
    </>
  );
}

export function DashboardView({
  activeBaseProfileId,
  storageAdapter,
  onStartNewAsset,
  onOpenProfile,
  onResumeDraft,
  onSelectBaseProfile
}: DashboardViewProps) {
  const { date, t, tx } = useI18n();
  const [baseSelectionStatus, setBaseSelectionStatus] = useState<
    "saved" | "session" | "invalid" | null
  >(null);
  const data = readDashboardData(storageAdapter, activeBaseProfileId);

  const selectBaseProfile = (profileId: StableId) => {
    const result = onSelectBaseProfile(profileId);
    setBaseSelectionStatus(
      result.status === "ok"
        ? "saved"
        : result.status === "unavailable"
          ? "session"
          : "invalid"
    );
  };

  return (
    <div className={styles.dashboard}>
      <Surface
        as="section"
        className={styles.hero}
        tone="raised"
        aria-labelledby="dashboard-view-title"
      >
        <div className={styles.heroCopy}>
          <Badge tone="accent">
            {t("Produktionszentrale ·")} {BRAND.versionLabel}
          </Badge>
          <p className={styles.eyebrow}>{t("Asset zuerst. Prompt danach.")}</p>
          <h1 id="dashboard-view-title">
            {t("Pixelart-Produktion beginnt mit der richtigen Asset-Art.")}
          </h1>
          <p className={styles.intro}>
            {tx(BRAND.tagline)}
            {t(
              ". Wähle zuerst, was du bauen möchtest – das Studio öffnet anschließend nur die passenden Regeln und Fragen."
            )}
          </p>
          <div className={styles.heroActions}>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => onStartNewAsset(null)}
            >
              <span aria-hidden="true">+</span>
              {t("Neues Asset")}
            </button>
            <ViewLink className={styles.secondaryAction} view="profiles">
              {t("Profil laden")}
            </ViewLink>
          </div>
          <dl
            className={styles.heroFacts}
            aria-label={t("Studio-Leistungsumfang")}
          >
            <div>
              <dt>9</dt>
              <dd>{t("Asset-Kategorien")}</dd>
            </div>
            <div>
              <dt>4</dt>
              <dd>{t("Prompt-Ausgaben")}</dd>
            </div>
            <div>
              <dt>{t("Lokal")}</dt>
              <dd>{t("Profile & Entwürfe")}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <span className={styles.heroGrid} />
          <span className={styles.heroMark}>
            <ForgeMarkIcon />
          </span>
          <span className={styles.heroLabel}>
            {t("CHOOSE · SHAPE · FORGE")}
          </span>
        </div>
      </Surface>

      {data.draftStatus === "ready" && data.draft ? (
        <button
          className={styles.draftButton}
          type="button"
          onClick={() => onResumeDraft(data.draft!.draftId)}
        >
          <DraftSummary draft={data.draft} />
          <span className={styles.draftAction}>
            {t("Entwurf fortsetzen →")}
          </span>
        </button>
      ) : data.draftStatus === "invalid" ||
        data.draftStatus === "unavailable" ? (
        <p className={styles.storageNotice} role="note">
          {data.draftStatus === "invalid"
            ? t(
                "Der lokale Entwurf ist beschädigt und wurde nicht automatisch geöffnet."
              )
            : t("Ein lokaler Entwurf kann derzeit nicht gelesen werden.")}
        </p>
      ) : null}

      <section
        className={styles.section}
        aria-labelledby="asset-categories-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{t("Neues Asset")}</p>
            <h2 id="asset-categories-title">
              {t("Was möchtest du erschaffen?")}
            </h2>
            <p>
              {t(
                "Jede Auswahl startet den Wizard direkt mit der passenden Kategorie – ohne fachfremde Formularfelder."
              )}
            </p>
          </div>
        </div>

        <ul className={styles.categoryGrid}>
          {DASHBOARD_CATEGORIES.map((category) => (
            <li key={category.id}>
              <button
                className={styles.categoryCard}
                data-accent={category.accent}
                type="button"
                onClick={() => onStartNewAsset(category.id)}
                aria-labelledby={`dashboard-category-${category.id}-title`}
                aria-describedby={`dashboard-category-${category.id}-description dashboard-category-${category.id}-meta`}
              >
                <span
                  className={styles.visuallyHidden}
                  id={`dashboard-category-${category.id}-title`}
                >
                  {t("{0} als neues Asset erstellen", tx(category.label))}
                </span>
                <span className={styles.categoryIcon}>
                  <CategoryIcon category={category.id} />
                </span>
                <span className={styles.categoryCopy}>
                  <strong>{tx(category.label)}</strong>
                  <span id={`dashboard-category-${category.id}-description`}>
                    {tx(category.shortDescription)}
                  </span>
                </span>
                <span
                  className={styles.categoryMeta}
                  id={`dashboard-category-${category.id}-meta`}
                >
                  <span>{tx(category.examples)}</span>
                  <Badge>{tx(category.capabilityLabel)}</Badge>
                </span>
                <span className={styles.categoryArrow} aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Surface
        as="section"
        className={styles.materialStrip}
        tone="soft"
        aria-labelledby="materials-title"
      >
        <div>
          <p className={styles.eyebrow}>{t("Materialsprache")}</p>
          <h2 id="materials-title">{t("Vom Werkstoff zum präzisen Preset")}</h2>
          <p>
            {t(
              "Materialangaben werden im passenden Textur- oder Asset-Editor konkretisiert und bleiben auf Profilkarten sofort erkennbar."
            )}
          </p>
        </div>
        <div
          className={styles.materialBadges}
          role="group"
          aria-label={t("Unterstützte Materialien")}
        >
          {MATERIAL_BADGE_IDS.map((material) => (
            <MaterialBadge key={material} material={material} />
          ))}
        </div>
      </Surface>

      <section
        className={styles.section}
        aria-labelledby="recent-profiles-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{t("Direkt weiterarbeiten")}</p>
            <h2 id="recent-profiles-title">{t("Letzte Profile")}</h2>
            <p>{t("Zuletzt geänderte, kompatibel aufgelöste Assetprofile.")}</p>
          </div>
          <ViewLink className={styles.textLink} view="profiles">
            {t("Profile durchsuchen & filtern →")}
          </ViewLink>
        </div>

        {data.recentProfiles.length > 0 ? (
          <ul className={styles.profileGrid}>
            {data.recentProfiles.map((profile) => (
              <li key={profile.id}>
                <ProfileCard profile={profile} onOpen={onOpenProfile} />
              </li>
            ))}
          </ul>
        ) : data.collectionStatus === "ready" ? (
          <NoResolvedProfilesState />
        ) : (
          <ProfileCollectionState status={data.collectionStatus} />
        )}
        {data.skippedProfileCount > 0 ? (
          <p className={styles.storageNotice} role="note">
            {data.skippedProfileCount}{" "}
            {t(
              "inkonsistente Profile wurden aus der Schnellansicht ausgeblendet und nicht verändert."
            )}
          </p>
        ) : null}
      </section>

      <section
        className={styles.section}
        aria-labelledby="favorite-profiles-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{t("Schnellzugriff")}</p>
            <h2 id="favorite-profiles-title">{t("Favoriten")}</h2>
            <p>
              {t("Deine markierten Profile für den direkten Wiedereinstieg.")}
            </p>
          </div>
        </div>

        {data.favoriteProfiles.length > 0 ? (
          <ul className={styles.profileGrid}>
            {data.favoriteProfiles.map((profile) => (
              <li key={profile.id}>
                <ProfileCard profile={profile} onOpen={onOpenProfile} />
              </li>
            ))}
          </ul>
        ) : data.collectionStatus === "invalid" ||
          data.collectionStatus === "unavailable" ? (
          <ProfileCollectionState status={data.collectionStatus} />
        ) : (
          <Surface className={styles.emptyState} tone="soft" role="note">
            <strong>{t("Noch keine Favoriten")}</strong>
            <p>
              {t(
                "Favorisierte Profile erscheinen hier, sobald sie in der Profilbibliothek markiert wurden."
              )}
            </p>
            <ViewLink view="profiles">{t("Zur Profilbibliothek")}</ViewLink>
          </Surface>
        )}
      </section>

      <section className={styles.section} aria-labelledby="base-profiles-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{t("Vererbte Produktionsregeln")}</p>
            <h2 id="base-profiles-title">{t("Basisprofile im Überblick")}</h2>
            <p>
              {t(
                "Wähle hier das aktive Produktionsfundament. Bearbeitung und neue Profile bleiben in der Profilverwaltung gebündelt."
              )}
            </p>
          </div>
          <ViewLink className={styles.textLink} view="profiles">
            {t("Basisprofile verwalten →")}
          </ViewLink>
        </div>

        {data.baseProfiles.length > 0 ? (
          <ul className={styles.baseGrid}>
            {data.baseProfiles.map((profile) => (
              <li key={profile.id}>
                <button
                  className={styles.baseCard}
                  type="button"
                  aria-labelledby={`dashboard-base-${profile.id}-title`}
                  aria-describedby={`dashboard-base-${profile.id}-description`}
                  aria-pressed={profile.active}
                  disabled={profile.active}
                  onClick={() => selectBaseProfile(profile.id)}
                >
                  <span
                    className={styles.visuallyHidden}
                    id={`dashboard-base-${profile.id}-title`}
                  >
                    {profile.active
                      ? t("{0}, aktives Basisprofil", profile.name)
                      : t("{0} als Basisprofil verwenden", profile.name)}
                  </span>
                  <span className={styles.baseTopline}>
                    <span className={styles.baseMonogram} aria-hidden="true">
                      BP
                    </span>
                    {profile.active ? (
                      <Badge tone="success">{t("Aktiv")}</Badge>
                    ) : null}
                  </span>
                  <strong>{profile.name}</strong>
                  <span
                    className={styles.baseDescription}
                    id={`dashboard-base-${profile.id}-description`}
                  >
                    <span className={styles.baseFacts}>
                      {profile.facts.map(tx).join(" · ")}
                    </span>
                    <time dateTime={profile.updatedAt}>
                      {t("Aktualisiert")} {date(profile.updatedAt)}
                    </time>
                  </span>
                  <span className={styles.baseAction} aria-hidden="true">
                    {profile.active
                      ? t("Aktives Profil")
                      : t("Als Basis verwenden →")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : data.collectionStatus === "invalid" ||
          data.collectionStatus === "unavailable" ? (
          <ProfileCollectionState status={data.collectionStatus} />
        ) : (
          <Surface className={styles.emptyState} tone="soft" role="note">
            <strong>{t("Kein Basisprofil verfügbar")}</strong>
            <p>
              {t(
                "Lege in der Profilverwaltung ein technisches Fundament für Tile, Perspektive und Pixelstil an."
              )}
            </p>
            <ViewLink view="profiles">{t("Basisprofil anlegen")}</ViewLink>
          </Surface>
        )}
        {baseSelectionStatus ? (
          <p className={styles.storageNotice} role="status">
            {baseSelectionStatus === "saved"
              ? t("Basisprofil aktiviert und lokal gespeichert.")
              : baseSelectionStatus === "session"
                ? t(
                    "Basisprofil ist für diese Sitzung aktiv; lokales Speichern ist nicht verfügbar."
                  )
                : t(
                    "Basisprofil konnte wegen ungültiger Einstellungen nicht aktiviert werden."
                  )}
          </p>
        ) : null}
      </section>
    </div>
  );
}
