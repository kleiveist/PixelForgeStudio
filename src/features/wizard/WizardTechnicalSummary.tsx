import type {
  AssetCapabilities,
  AssetCategory,
  AssetSubtype
} from "../../domain/assets";
import {
  CHARACTER_ANIMATION_ACTION_IDS,
  type CharacterAnimationActionId
} from "../../domain/characters";
import type { ResolvedProfile } from "../../domain/profiles";
import type {
  BaseProfile,
  ProfileLibrary,
  WizardDraft
} from "../../schemas";
import {
  formatSubtypeLabel,
  getDashboardCategory
} from "../dashboard/dashboardCatalog";
import { resolveWizardDraftSnapshot } from "./wizardLifecycle";
import type { WizardCoreFormValues } from "./wizardSteps";
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

const CHARACTER_ANIMATION_LABELS: Readonly<
  Record<CharacterAnimationActionId, string>
> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  attack: "Attack",
  use: "Use",
  talk: "Talk",
  interact: "Interact",
  hurt: "Hurt",
  special: "Spezialaktion"
};

function characterAnimationSummary(
  frames: WizardCoreFormValues["characterAnimationFrames"]
): string {
  if (frames === undefined) return "Noch nicht ausgewählt";

  const selected = CHARACTER_ANIMATION_ACTION_IDS.flatMap((action) => {
    const frameCount = frames[action];
    if (frameCount === undefined) return [];
    return [
      `${CHARACTER_ANIMATION_LABELS[action]} · ${frameCount} ${
        frameCount === 1 ? "Frame" : "Frames"
      }`
    ];
  });

  return selected.length === 0
    ? "Noch nicht ausgewählt"
    : selected.join("; ");
}

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
  categoryHint: AssetCategory | null,
  activeCategory: AssetCategory | null
): AssetCategory | null {
  return activeCategory ?? ("category" in draft ? draft.category : categoryHint);
}

export interface WizardSelectionSummary {
  readonly category: AssetCategory;
  readonly subtype: AssetSubtype;
  readonly capabilities: AssetCapabilities;
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
  readonly activeCategory: AssetCategory | null;
  readonly activeSubtype: AssetSubtype | null;
  readonly selection: WizardSelectionSummary | null;
  readonly formValues: WizardCoreFormValues;
}

export function WizardTechnicalSummary({
  categoryHint,
  draft,
  library,
  projectName,
  activeCategory,
  activeSubtype,
  selection,
  formValues
}: WizardTechnicalSummaryProps) {
  const category = summaryCategory(draft, categoryHint, activeCategory);
  const draftMatchesActiveSelection =
    !("category" in draft) ||
    (draft.category === activeCategory && draft.subtype === activeSubtype);
  const profile = draftMatchesActiveSelection
    ? findSummaryProfile(draft, library)
    : { base: null, resolved: null, sourceName: null };
  const technicalValues =
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
        {selection ? (
          <>
            <SummaryFact
              label="Untertyp"
              value={formatSubtypeLabel(selection.subtype)}
            />
            <SummaryFact
              label="Asset-Logik"
              value={[
                selection.capabilities.movable ? "beweglich" : null,
                selection.capabilities.directional ? "richtungsfähig" : null,
                selection.capabilities.animated ? "Animation" : null,
                selection.capabilities.tileable ? "kachelbar" : null,
                selection.capabilities.scaledCharacter ? "Figurenmaßstab" : null,
                selection.capabilities.freeComposition ? "freie Komposition" : null
              ]
                .filter((value): value is string => value !== null)
                .join(" · ") || "statisches Einzelasset"}
            />
          </>
        ) : null}
        {profile.sourceName ? (
          <SummaryFact label="Assetprofil" value={profile.sourceName} />
        ) : null}
        {profile.base ? (
          <SummaryFact label="Basisprofil" value={profile.base.name} />
        ) : null}
        {selection?.category === "character" ? (
          <>
            {formValues.role?.trim() ? (
              <SummaryFact
                label="Rolle / Beruf"
                value={formValues.role.trim()}
              />
            ) : null}
            {selection.capabilities.directional ? (
              <SummaryFact
                label="Richtungsset"
                value={
                  formValues.directionCount === undefined
                    ? "Noch nicht ausgewählt"
                    : `${formValues.directionCount} Richtungen`
                }
              />
            ) : null}
            {selection.capabilities.animated ? (
              <SummaryFact
                label="Animationen"
                value={characterAnimationSummary(
                  formValues.characterAnimationFrames
                )}
              />
            ) : null}
            {formValues.silhouette?.trim() ? (
              <SummaryFact
                label="Silhouette"
                value={formValues.silhouette.trim()}
              />
            ) : null}
          </>
        ) : null}
        {technicalValues ? (
          <>
            <SummaryFact
              label="Pixelstil"
              value={PIXEL_DENSITY_LABELS[technicalValues.pixelDensity]}
            />
            <SummaryFact
              label="Stilprofil"
              value={STYLE_PROFILE_LABELS[technicalValues.styleProfile]}
            />
            {!isFreeComposition ? (
              <>
                <SummaryFact
                  label="Tile-Raster"
                  value={`${technicalValues.tileSize} × ${technicalValues.tileSize} px`}
                />
                <SummaryFact
                  label="Perspektive"
                  value={PERSPECTIVE_LABELS[technicalValues.perspectiveType]}
                />
                <SummaryFact
                  label="Projektion"
                  value={PROJECTION_LABELS[technicalValues.projectionType]}
                />
                <SummaryFact
                  label="Kameraneigung"
                  value={`${technicalValues.cameraAngle}°`}
                />
              </>
            ) : null}
            {usesCharacterScale &&
            technicalValues.characterHeight !== undefined ? (
              <SummaryFact
                label="Figurenhöhe"
                value={`${technicalValues.characterHeight} px`}
              />
            ) : null}
            <SummaryFact
              label="Outline"
              value={OUTLINE_LABELS[technicalValues.outlineStyle]}
            />
            <SummaryFact
              label="Hintergrund"
              value={BACKGROUND_LABELS[technicalValues.backgroundMode]}
            />
            <SummaryFact
              label="Lichtlogik"
              value={
                LIGHTING_LABELS[technicalValues.lightingDefaults.policy]
              }
            />
          </>
        ) : null}
      </dl>
      {!technicalValues ? (
        <p className={styles.summaryHint}>
          Technische Werte erscheinen, sobald ein Basisprofil Teil des
          Entwurfs ist.
        </p>
      ) : null}
    </aside>
  );
}
