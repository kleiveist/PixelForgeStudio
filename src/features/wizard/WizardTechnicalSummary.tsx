import type { AssetCategory } from "../../domain/assets";
import type { ResolvedProfile } from "../../domain/profiles";
import type {
  BaseProfile,
  ProfileLibrary,
  WizardDraft
} from "../../schemas";
import { getDashboardCategory } from "../dashboard/dashboardCatalog";
import { resolveWizardDraftSnapshot } from "./wizardLifecycle";
import styles from "./WizardView.module.css";

const PIXEL_DENSITY_LABELS = {
  classicHd: "Classic-HD",
  modernHd: "Modern-HD",
  ultraHd: "Ultra-HD"
} as const;

const STYLE_PROFILE_LABELS = {
  classic: "Stil A · klassische Fantasy",
  dark: "Stil B · düstere Fantasy",
  both: "Stil A + B"
} as const;

const PERSPECTIVE_LABELS = {
  topdown: "Top-down",
  threeQuarter: "3/4-RPG",
  isometric: "Isometrisch",
  side: "Seitenansicht"
} as const;

const PROJECTION_LABELS = {
  orthographic: "Orthografisch",
  mildPerspective: "Leichte Perspektive"
} as const;

const OUTLINE_LABELS = {
  dark: "Dunkel",
  softSelective: "Selektiv",
  minimal: "Minimal"
} as const;

const BACKGROUND_LABELS = {
  transparent: "Transparent",
  scene: "Vollständige Szene"
} as const;

const LIGHTING_LABELS = {
  adaptive: "Kontextabhängig",
  neutralDay: "Neutrales Tageslicht",
  warmInterior: "Warmes Innenlicht",
  gloomyDiffuse: "Diffus und gedämpft",
  neutralNight: "Neutrales Nachtlicht",
  coolNight: "Kühles Nachtlicht",
  custom: "Individuell"
} as const;

interface SummaryProfile {
  readonly base: BaseProfile | null;
  readonly resolved: ResolvedProfile | null;
  readonly sourceName: string | null;
}

function sourceAssetProfileId(draft: WizardDraft): string | null {
  if (!("sourceAssetProfileId" in draft)) return null;
  return typeof draft.sourceAssetProfileId === "string"
    ? draft.sourceAssetProfileId
    : null;
}

function findSummaryProfile(
  draft: WizardDraft,
  library: ProfileLibrary | null
): SummaryProfile {
  if (!library || !("baseProfileId" in draft)) {
    return { base: null, resolved: null, sourceName: null };
  }

  const base = library.baseProfiles.find(
    (profile) => profile.id === draft.baseProfileId
  );
  if (!base) return { base: null, resolved: null, sourceName: null };

  const sourceId = sourceAssetProfileId(draft);
  const sourceAsset = sourceId
    ? library.assetProfiles.find((profile) => profile.id === sourceId)
    : undefined;
  const resolution = resolveWizardDraftSnapshot(draft, library);

  return {
    base,
    resolved:
      resolution?.status === "resolved" ? resolution.profile : null,
    sourceName: sourceAsset?.name ?? null
  };
}

function summaryCategory(
  draft: WizardDraft,
  categoryHint: AssetCategory | null
): AssetCategory | null {
  return "category" in draft ? draft.category : categoryHint;
}

function SummaryFact({
  label,
  value
}: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export interface WizardTechnicalSummaryProps {
  readonly categoryHint: AssetCategory | null;
  readonly draft: WizardDraft;
  readonly library: ProfileLibrary | null;
  readonly projectName: string;
}

export function WizardTechnicalSummary({
  categoryHint,
  draft,
  library,
  projectName
}: WizardTechnicalSummaryProps) {
  const category = summaryCategory(draft, categoryHint);
  const profile = findSummaryProfile(draft, library);
  const values =
    "category" in draft
      ? profile.resolved?.values ?? null
      : profile.base?.values ?? null;
  const isFreeComposition =
    profile.resolved?.capabilities.freeComposition === true;
  const usesCharacterScale =
    profile.resolved?.capabilities.scaledCharacter === true;

  return (
    <aside
      className={styles.technicalSummary}
      aria-labelledby="wizard-technical-summary-title"
    >
      <p className={styles.eyebrow}>Live-Überblick</p>
      <h2 id="wizard-technical-summary-title">Technische Zusammenfassung</h2>
      <dl className={styles.summaryList}>
        <SummaryFact
          label="Projekt"
          value={projectName.trim() || "Noch nicht benannt"}
        />
        {category ? (
          <SummaryFact
            label="Asset-Kategorie"
            value={getDashboardCategory(category).label}
          />
        ) : null}
        {profile.sourceName ? (
          <SummaryFact label="Assetprofil" value={profile.sourceName} />
        ) : null}
        {profile.base ? (
          <SummaryFact label="Basisprofil" value={profile.base.name} />
        ) : null}
        {values ? (
          <>
            <SummaryFact
              label="Pixelstil"
              value={PIXEL_DENSITY_LABELS[values.pixelDensity]}
            />
            <SummaryFact
              label="Stilprofil"
              value={STYLE_PROFILE_LABELS[values.styleProfile]}
            />
            {!isFreeComposition ? (
              <>
                <SummaryFact label="Tile-Raster" value={`${values.tileSize} × ${values.tileSize} px`} />
                <SummaryFact
                  label="Perspektive"
                  value={PERSPECTIVE_LABELS[values.perspectiveType]}
                />
                <SummaryFact
                  label="Projektion"
                  value={PROJECTION_LABELS[values.projectionType]}
                />
                <SummaryFact
                  label="Kameraneigung"
                  value={`${values.cameraAngle}°`}
                />
              </>
            ) : null}
            {usesCharacterScale && values.characterHeight !== undefined ? (
              <SummaryFact
                label="Figurenhöhe"
                value={`${values.characterHeight} px`}
              />
            ) : null}
            <SummaryFact
              label="Outline"
              value={OUTLINE_LABELS[values.outlineStyle]}
            />
            <SummaryFact
              label="Hintergrund"
              value={BACKGROUND_LABELS[values.backgroundMode]}
            />
            <SummaryFact
              label="Lichtlogik"
              value={LIGHTING_LABELS[values.lightingDefaults.policy]}
            />
          </>
        ) : null}
      </dl>
      {!values ? (
        <p className={styles.summaryHint}>
          Technische Werte erscheinen, sobald ein Basisprofil Teil des
          Entwurfs ist.
        </p>
      ) : null}
    </aside>
  );
}
