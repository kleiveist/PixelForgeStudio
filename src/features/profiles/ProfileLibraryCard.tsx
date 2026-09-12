import { useI18n } from "../../i18n";
import { useId } from "react";
import { Badge } from "../../components/ui";
import type { StableId } from "../../schemas";
import { CategoryIcon } from "../dashboard/CategoryIcon";
import { MaterialBadge } from "../dashboard/MaterialBadge";
import { type DashboardProfileSummary } from "../dashboard/dashboardData";
import styles from "./ProfileLibraryCard.module.css";

export interface ProfileLibraryCardProps {
  readonly profile: DashboardProfileSummary;
  readonly onLoad: (profileId: StableId) => void;
  readonly onToggleFavorite: (profile: DashboardProfileSummary) => void;
  readonly onDuplicate: (profileId: StableId) => void;
  readonly onRequestDelete: (
    profile: DashboardProfileSummary,
    trigger: HTMLButtonElement
  ) => void;
}

export function ProfileLibraryCard({
  profile,
  onLoad,
  onToggleFavorite,
  onDuplicate,
  onRequestDelete
}: ProfileLibraryCardProps) {
  const { date, t, tx } = useI18n();
  const titleId = useId();

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <CategoryIcon category={profile.category} />
        </span>
        <span className={styles.headingCopy}>
          <span className={styles.category}>{tx(profile.categoryLabel)}</span>
          <h4 id={titleId}>{profile.name}</h4>
          <span className={styles.subtype}>{tx(profile.subtypeLabel)}</span>
        </span>
        {profile.favorite ? (
          <span
            className={styles.favorite}
            title={t("Favorit")}
            aria-hidden="true"
          >
            ★
          </span>
        ) : null}
      </header>

      <div className={styles.metadata}>
        <span>
          {t("Basis:")} {profile.baseProfileName}
        </span>
        <time dateTime={profile.updatedAt}>
          {t("Aktualisiert")} {date(profile.updatedAt)}
        </time>
      </div>

      {profile.facts.length > 0 ? (
        <div
          className={styles.badges}
          role="group"
          aria-label={t("Technische Merkmale")}
        >
          {profile.facts.map((fact, index) => (
            <Badge key={`${fact}-${index}`}>{tx(fact)}</Badge>
          ))}
        </div>
      ) : null}

      {profile.materials.length > 0 ? (
        <div
          className={styles.badges}
          role="group"
          aria-label={t("Materialien")}
        >
          {profile.materials.map((material) => (
            <MaterialBadge key={material} material={material} />
          ))}
        </div>
      ) : null}

      {profile.tags.length > 0 ? (
        <div
          className={styles.tags}
          role="group"
          aria-label={t("Schlagwörter")}
        >
          {profile.tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>#{tag}</span>
          ))}
        </div>
      ) : null}

      <div
        className={styles.actions}
        role="group"
        aria-label={t("Aktionen für {0}", profile.name)}
      >
        <button
          className={styles.loadAction}
          type="button"
          aria-label={t("Profil „{0}“ im Wizard laden", profile.name)}
          onClick={() => onLoad(profile.id)}
        >
          {t("Profil laden")}
          <span aria-hidden="true">→</span>
        </button>
        <button
          className={styles.action}
          type="button"
          aria-pressed={profile.favorite}
          aria-label={
            profile.favorite
              ? t("Profil „{0}“ aus Favoriten entfernen", profile.name)
              : t("Profil „{0}“ als Favorit markieren", profile.name)
          }
          onClick={() => onToggleFavorite(profile)}
        >
          <span aria-hidden="true">{profile.favorite ? "★" : "☆"}</span>
          {t("Favorit")}
        </button>
        <button
          className={styles.action}
          type="button"
          aria-label={t("Profil „{0}“ duplizieren", profile.name)}
          onClick={() => onDuplicate(profile.id)}
        >
          {t("Duplizieren")}
        </button>
        <button
          className={styles.deleteAction}
          type="button"
          aria-label={t("Profil „{0}“ löschen", profile.name)}
          onClick={(event) => onRequestDelete(profile, event.currentTarget)}
        >
          <span aria-hidden="true">×</span>
          {t("Löschen")}
        </button>
      </div>
    </article>
  );
}
