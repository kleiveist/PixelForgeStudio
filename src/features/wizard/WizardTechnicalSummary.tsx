import type {
  AssetCapabilities,
  AssetCategory,
  AssetSubtype
} from "../../domain/assets";
import {
  CHARACTER_ANIMATION_ACTION_IDS,
  type CharacterAnimationActionId
} from "../../domain/characters";
import {
  MOVING_OBJECT_ANIMATION_TYPE_IDS,
  getDefaultMovingObjectClass,
  type MovingObjectAnchorMode,
  type MovingObjectAnimationType,
  type MovingObjectClass,
  type MovingObjectCondition,
  type MovingObjectMaterial,
  type MovingObjectMovementType,
  type MovingObjectSubtype
} from "../../domain/moving-objects";
import {
  getDefaultTextureMaterialType,
  type TextureCondition,
  type TextureIcing,
  type TextureLighting,
  type TextureMaterialType,
  type TextureMoisture,
  type TextureOrientation,
  type TextureStructure,
  type TextureSubtype,
  type TextureSurface,
  type TextureUsage
} from "../../domain/textures";
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

const MOVING_OBJECT_CLASS_LABELS: Readonly<Record<MovingObjectClass, string>> = {
  cart: "Karren / Wagen",
  rollingObject: "Rollendes Objekt",
  floatingObject: "Schwebendes Objekt",
  slidingObject: "Gleitendes Objekt",
  mechanicalConstruct: "Mechanische Konstruktion",
  boat: "Boot",
  platform: "Plattform",
  magicObject: "Magisches Objekt",
  nonHumanoidUnit: "Nicht-humanoide Einheit"
};

const MOVING_OBJECT_MOVEMENT_LABELS: Readonly<
  Record<MovingObjectMovementType, string>
> = {
  roll: "Rollen",
  slide: "Gleiten",
  hover: "Schweben",
  walk: "Laufen",
  crawl: "Kriechen",
  fly: "Fliegen",
  rotate: "Rotieren"
};

const MOVING_OBJECT_ANCHOR_LABELS: Readonly<
  Record<MovingObjectAnchorMode, string>
> = {
  automatic: "Automatisch",
  bottomCenter: "Unten mittig",
  footprintCenter: "Mitte der Standfläche",
  canvasCenter: "Canvas-Mitte"
};

const MOVING_OBJECT_MATERIAL_LABELS: Readonly<
  Record<MovingObjectMaterial, string>
> = {
  wood: "Holz",
  metal: "Metall",
  fabric: "Stoff",
  stone: "Stein",
  magic: "Magische Substanz",
  mixed: "Mischmaterial"
};

const MOVING_OBJECT_CONDITION_LABELS: Readonly<
  Record<MovingObjectCondition, string>
> = {
  new: "Neu",
  used: "Gebraucht",
  damaged: "Beschädigt",
  improvised: "Provisorisch"
};

const MOVING_OBJECT_ANIMATION_LABELS: Readonly<
  Record<MovingObjectAnimationType, string>
> = {
  idle: "Idle",
  move: "Bewegung",
  rotate: "Rotation",
  interact: "Interaktion",
  openClose: "Öffnen / Schließen",
  pulse: "Pulsieren"
};

const TEXTURE_MATERIAL_LABELS: Readonly<Record<TextureMaterialType, string>> = {
  wood: "Holz",
  stone: "Stein",
  snow: "Schnee",
  ice: "Eis",
  earth: "Erde",
  sand: "Sand",
  grass: "Gras",
  moss: "Moos",
  metal: "Metall",
  fabric: "Stoff",
  leather: "Leder",
  brick: "Ziegel",
  paving: "Pflaster",
  clay: "Lehm",
  ceramic: "Keramik",
  customMaterial: "Eigenes Material"
};

const TEXTURE_USAGE_LABELS: Readonly<Record<TextureUsage, string>> = {
  floor: "Boden",
  wall: "Wand",
  roof: "Dach",
  surface: "Objektoberfläche",
  clothing: "Kleidung",
  decor: "Dekor"
};

const TEXTURE_STRUCTURE_LABELS: Readonly<Record<TextureStructure, string>> = {
  fine: "Fein",
  medium: "Mittel",
  coarse: "Grob"
};

const TEXTURE_CONDITION_LABELS: Readonly<Record<TextureCondition, string>> = {
  new: "Neu",
  polished: "Poliert",
  rough: "Rau",
  old: "Alt",
  wet: "Nass",
  frosted: "Frostig",
  damaged: "Beschädigt",
  dirty: "Verschmutzt"
};

const TEXTURE_SURFACE_LABELS: Readonly<Record<TextureSurface, string>> = {
  continuous: "Durchgehend",
  planked: "Planken",
  jointed: "Mit Fugen",
  cracked: "Rissig",
  granular: "Körnig",
  layered: "Geschichtet",
  woven: "Gewebt",
  organic: "Organisch"
};

const TEXTURE_MOISTURE_LABELS: Readonly<Record<TextureMoisture, string>> = {
  dry: "Trocken",
  damp: "Feucht",
  wet: "Nass"
};

const TEXTURE_ICING_LABELS: Readonly<Record<TextureIcing, string>> = {
  none: "Keine Vereisung",
  lightFrost: "Leichter Frost",
  frosted: "Bereift",
  iceCrusted: "Eiskruste"
};

const TEXTURE_LIGHTING_LABELS: Readonly<Record<TextureLighting, string>> = {
  neutralEven: "Neutral und gleichmäßig",
  contextual: "Kontextabhängig",
  worldAligned: "An Weltlicht ausgerichtet"
};

const TEXTURE_ORIENTATION_LABELS: Readonly<Record<TextureOrientation, string>> = {
  horizontal: "Horizontal",
  vertical: "Vertikal",
  radial: "Radial",
  unordered: "Ungeordnet",
  grainAligned: "Entlang der Maserung"
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

function movingObjectAnimationSummary(
  frames: WizardCoreFormValues["movingObjectAnimationFrames"]
): string {
  if (frames === undefined) return "Noch nicht ausgewählt";

  const selected = MOVING_OBJECT_ANIMATION_TYPE_IDS.flatMap((type) => {
    const frameCount = frames[type];
    return frameCount === undefined
      ? []
      : [
          `${MOVING_OBJECT_ANIMATION_LABELS[type]} · ${frameCount} ${
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
        {selection?.category === "movingObject" ? (
          <>
            <SummaryFact
              label="Objektklasse"
              value={
                MOVING_OBJECT_CLASS_LABELS[
                  formValues.movingObjectClass ??
                    getDefaultMovingObjectClass(
                      selection.subtype as MovingObjectSubtype
                    )
                ]
              }
            />
            {formValues.movementType !== undefined ? (
              <SummaryFact
                label="Bewegungsart"
                value={MOVING_OBJECT_MOVEMENT_LABELS[formValues.movementType]}
              />
            ) : null}
            {formValues.movingObjectFootprintWidthTiles !== undefined &&
            formValues.movingObjectFootprintDepthTiles !== undefined ? (
              <SummaryFact
                label="Standfläche"
                value={`${formValues.movingObjectFootprintWidthTiles} × ${formValues.movingObjectFootprintDepthTiles} Tiles`}
              />
            ) : null}
            {formValues.movingObjectAnchorMode !== undefined ? (
              <SummaryFact
                label="Ausrichtungsanker"
                value={
                  MOVING_OBJECT_ANCHOR_LABELS[
                    formValues.movingObjectAnchorMode
                  ]
                }
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
                value={movingObjectAnimationSummary(
                  formValues.movingObjectAnimationFrames
                )}
              />
            ) : null}
            {formValues.movingObjectMaterial !== undefined ? (
              <SummaryFact
                label="Material"
                value={
                  MOVING_OBJECT_MATERIAL_LABELS[formValues.movingObjectMaterial]
                }
              />
            ) : null}
            {formValues.movingObjectCondition !== undefined ? (
              <SummaryFact
                label="Zustand"
                value={
                  MOVING_OBJECT_CONDITION_LABELS[
                    formValues.movingObjectCondition
                  ]
                }
              />
            ) : null}
          </>
        ) : null}
        {selection?.category === "texture" ? (
          <>
            <SummaryFact
              label="Material"
              value={
                TEXTURE_MATERIAL_LABELS[
                  formValues.textureMaterialType ??
                    getDefaultTextureMaterialType(
                      selection.subtype as TextureSubtype
                    )
                ]
              }
            />
            {formValues.textureUsage !== undefined ? (
              <SummaryFact
                label="Einsatz"
                value={TEXTURE_USAGE_LABELS[formValues.textureUsage]}
              />
            ) : null}
            {formValues.seamless !== undefined ? (
              <SummaryFact
                label="Kachelbarkeit"
                value={formValues.seamless ? "Nahtlos" : "Nicht nahtlos"}
              />
            ) : null}
            {formValues.textureStructure !== undefined ? (
              <SummaryFact
                label="Strukturgrad"
                value={TEXTURE_STRUCTURE_LABELS[formValues.textureStructure]}
              />
            ) : null}
            {formValues.textureSurface !== undefined ? (
              <SummaryFact
                label="Oberfläche"
                value={TEXTURE_SURFACE_LABELS[formValues.textureSurface]}
              />
            ) : null}
            {formValues.textureCondition !== undefined ? (
              <SummaryFact
                label="Zustand"
                value={TEXTURE_CONDITION_LABELS[formValues.textureCondition]}
              />
            ) : null}
            {formValues.textureMoisture !== undefined ? (
              <SummaryFact
                label="Feuchtigkeit"
                value={TEXTURE_MOISTURE_LABELS[formValues.textureMoisture]}
              />
            ) : null}
            {formValues.textureIcing !== undefined ? (
              <SummaryFact
                label="Vereisung"
                value={TEXTURE_ICING_LABELS[formValues.textureIcing]}
              />
            ) : null}
            {formValues.textureOrientation !== undefined ? (
              <SummaryFact
                label="Ausrichtung"
                value={
                  TEXTURE_ORIENTATION_LABELS[formValues.textureOrientation]
                }
              />
            ) : null}
            {formValues.textureLighting !== undefined ? (
              <SummaryFact
                label="Materiallicht"
                value={TEXTURE_LIGHTING_LABELS[formValues.textureLighting]}
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
