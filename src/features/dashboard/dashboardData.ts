import type { AssetSubtype } from "../../domain/assets";
import type {
  MovingObjectAnchorMode,
  MovingObjectClass,
  MovingObjectCondition,
  MovingObjectMaterial
} from "../../domain/moving-objects";
import { getDefaultMovingObjectClass } from "../../domain/moving-objects";
import { resolveProfile, type ResolvedProfile } from "../../domain/profiles";
import type {
  AssetProfile,
  BaseProfile,
  ProfileLibrary,
  StableId,
  WizardDraft
} from "../../schemas";
import type { StorageReadResult, V2StorageAdapter } from "../../services";
import {
  MATERIAL_BADGE_IDS,
  formatSubtypeLabel,
  getDashboardCategory,
  type MaterialBadgeId
} from "./dashboardCatalog";

const RECENT_PROFILE_LIMIT = 3;
const FAVORITE_PROFILE_LIMIT = 3;
const BASE_PROFILE_LIMIT = 3;

export type DashboardStorage = Pick<
  V2StorageAdapter,
  "readDraft" | "readProfileLibrary"
>;

export interface DashboardProfileSummary {
  readonly id: StableId;
  readonly name: string;
  readonly category: AssetProfile["category"];
  readonly categoryLabel: string;
  readonly subtypeLabel: string;
  readonly baseProfileName: string;
  readonly baseProfileId: StableId;
  readonly compatibilityKey: string;
  readonly facts: readonly string[];
  readonly tags: readonly string[];
  readonly materials: readonly MaterialBadgeId[];
  readonly favorite: boolean;
  readonly updatedAt: string;
}

export interface DashboardBaseProfileSummary {
  readonly id: StableId;
  readonly name: string;
  readonly facts: readonly string[];
  readonly active: boolean;
  readonly updatedAt: string;
}

export type DashboardCollectionStatus = "ready" | "empty" | "invalid" | "unavailable";
export type DashboardDraftStatus = "ready" | "empty" | "invalid" | "unavailable";

export interface DashboardData {
  readonly collectionStatus: DashboardCollectionStatus;
  readonly recentProfiles: readonly DashboardProfileSummary[];
  readonly favoriteProfiles: readonly DashboardProfileSummary[];
  readonly baseProfiles: readonly DashboardBaseProfileSummary[];
  readonly skippedProfileCount: number;
  readonly draftStatus: DashboardDraftStatus;
  readonly draft: WizardDraft | null;
}

const pixelDensityLabels = {
  classicHd: "Classic-HD",
  modernHd: "Modern-HD",
  ultraHd: "Ultra-HD"
} as const;

const perspectiveLabels = {
  topdown: "Top-down",
  threeQuarter: "3/4-RPG",
  isometric: "Isometrisch",
  side: "Seitenansicht"
} as const;

const styleProfileLabels = {
  classic: "Stil A",
  dark: "Stil B",
  both: "Stil A + B"
} as const;

const movementTypeLabels = {
  roll: "Rollen",
  slide: "Gleiten",
  hover: "Schweben",
  walk: "Laufen",
  crawl: "Kriechen",
  fly: "Fliegen",
  rotate: "Rotieren"
} as const;

const movingObjectClassLabels: Readonly<Record<MovingObjectClass, string>> = {
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

const movingObjectAnchorLabels: Readonly<
  Record<MovingObjectAnchorMode, string>
> = {
  automatic: "Automatischer Anker",
  bottomCenter: "Anker unten mittig",
  footprintCenter: "Anker in Standflächenmitte",
  canvasCenter: "Anker in Canvas-Mitte"
};

const movingObjectMaterialLabels: Readonly<
  Record<MovingObjectMaterial, string>
> = {
  wood: "Holz",
  metal: "Metall",
  fabric: "Stoff",
  stone: "Stein",
  magic: "Magische Substanz",
  mixed: "Mischmaterial"
};

const movingObjectConditionLabels: Readonly<
  Record<MovingObjectCondition, string>
> = {
  new: "Neu",
  used: "Gebraucht",
  damaged: "Beschädigt",
  improvised: "Provisorisch"
};

const animationLabels = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  use: "Benutzen",
  interact: "Interaktion",
  talk: "Talk",
  attack: "Attack",
  hurt: "Hurt",
  special: "Spezial",
  move: "Bewegung",
  rotate: "Rotation",
  openClose: "Öffnen / Schließen",
  pulse: "Pulsieren",
  glow: "Leuchten",
  break: "Zerbrechen",
  custom: "Eigene Animation",
  wind: "Wind",
  magic: "Magie",
  water: "Wasser",
  lava: "Lava"
} as const;

const materialSubtypeMap: Readonly<
  Partial<Record<AssetSubtype, MaterialBadgeId>>
> = {
  wood: "wood",
  stone: "stone",
  snow: "snow",
  ice: "ice",
  metal: "metal",
  fabric: "cloth",
  leather: "leather"
};

const materialBadgeIconMap: Readonly<Record<string, MaterialBadgeId>> = {
  "material-wood": "wood",
  "material-stone": "stone",
  "material-snow": "snow",
  "material-ice": "ice",
  "material-metal": "metal",
  "material-cloth": "cloth",
  "material-fabric": "cloth",
  "material-leather": "leather"
};

export function compareUpdatedAtThenId(
  left: Readonly<{ updatedAt: string; id: StableId }>,
  right: Readonly<{ updatedAt: string; id: StableId }>
): number {
  if (left.updatedAt !== right.updatedAt) {
    return left.updatedAt > right.updatedAt ? -1 : 1;
  }
  return left.id.localeCompare(right.id);
}

function animationFact(
  animation: keyof typeof animationLabels,
  framesPerDirection?: number
): string {
  const label = animationLabels[animation];
  return framesPerDirection === undefined
    ? `Animation: ${label}`
    : `${label} · ${framesPerDirection} Frames`;
}

function profileActivityFacts(profile: ResolvedProfile): readonly string[] {
  switch (profile.categoryData.category) {
    case "character": {
      const {
        animationAction,
        animationActions,
        directionCount,
        framesPerDirection,
        role
      } = profile.categoryData.answers;
      const animationFacts =
        animationActions === undefined
          ? animationAction === undefined
            ? []
            : [animationFact(animationAction, framesPerDirection)]
          : animationActions.map((animation) =>
              animationFact(animation.action, animation.frames)
            );
      return [
        ...(role === undefined ? [] : [`Rolle: ${role}`]),
        ...(directionCount === undefined
          ? []
          : [`${directionCount} Richtungen`]),
        ...animationFacts
      ];
    }
    case "movingObject": {
      const {
        anchorMode,
        animationSequences,
        animationType,
        condition,
        directionCount,
        footprint,
        framesPerDirection,
        material,
        objectClass,
        movementType
      } = profile.categoryData.answers;
      const animationFacts =
        animationSequences === undefined
          ? animationType === undefined
            ? []
            : [animationFact(animationType, framesPerDirection)]
          : animationSequences.map((sequence) =>
              animationFact(sequence.type, sequence.frames)
            );
      return [
        `Klasse: ${
          movingObjectClassLabels[
            objectClass ??
              getDefaultMovingObjectClass(profile.categoryData.subtype)
          ]
        }`,
        ...(movementType === undefined
          ? []
          : [`Bewegung: ${movementTypeLabels[movementType]}`]),
        ...(footprint === undefined
          ? []
          : [`Standfläche: ${footprint.widthTiles} × ${footprint.depthTiles} Tiles`]),
        ...(anchorMode === undefined
          ? []
          : [movingObjectAnchorLabels[anchorMode]]),
        ...(!profile.capabilities.directional || directionCount === undefined
          ? []
          : [`${directionCount} Richtungen`]),
        ...animationFacts,
        ...(material === undefined
          ? []
          : [`Material: ${movingObjectMaterialLabels[material]}`]),
        ...(condition === undefined
          ? []
          : [`Zustand: ${movingObjectConditionLabels[condition]}`])
      ];
    }
    case "staticObject":
    case "nature":
    case "tileset": {
      const { animationType } = profile.categoryData.answers;
      return animationType === undefined
        ? []
        : [animationFact(animationType)];
    }
    case "texture":
    case "building":
    case "item":
    case "artwork":
      return [];
  }
}

function backgroundFact(profile: ResolvedProfile): string | null {
  if (!profile.capabilities.transparent) return null;
  if (profile.categoryData.category === "artwork") {
    switch (profile.categoryData.answers.background) {
      case "transparent":
        return "Transparent";
      case "simple":
        return "Einfacher Hintergrund";
      case "complete":
        return "Vollständiger Hintergrund";
      case undefined:
        break;
    }
  }
  return profile.values.backgroundMode === "transparent"
    ? "Transparent"
    : "Szenenhintergrund";
}

function profileFacts(profile: ResolvedProfile): readonly string[] {
  const facts: string[] = [pixelDensityLabels[profile.values.pixelDensity]];

  if (!profile.capabilities.freeComposition) {
    facts.push(`${profile.values.tileSize} px Tile`);
    facts.push(perspectiveLabels[profile.values.perspectiveType]);
  }
  if (
    profile.capabilities.scaledCharacter &&
    profile.values.characterHeight !== undefined
  ) {
    facts.push(`${profile.values.characterHeight} px Figur`);
  }
  const background = backgroundFact(profile);
  if (background) facts.push(background);
  facts.push(...profileActivityFacts(profile));
  facts.push(styleProfileLabels[profile.values.styleProfile]);

  return facts;
}

function profileMaterials(profile: AssetProfile): readonly MaterialBadgeId[] {
  const selected = new Set<MaterialBadgeId>();
  const subtypeMaterial = materialSubtypeMap[profile.subtype];
  if (subtypeMaterial) selected.add(subtypeMaterial);

  for (const iconId of profile.badgeIconIds) {
    const material = materialBadgeIconMap[iconId];
    if (material) selected.add(material);
  }

  return MATERIAL_BADGE_IDS.filter((material) => selected.has(material));
}

export function resolveProfileSummary(
  profile: AssetProfile,
  library: ProfileLibrary
): DashboardProfileSummary | null {
  const baseProfile = library.baseProfiles.find(
    (candidate) => candidate.id === profile.baseProfileId
  );
  if (!baseProfile) return null;

  const categoryProfile = profile.categoryProfileId
    ? library.categoryProfiles.find(
        (candidate) => candidate.id === profile.categoryProfileId
      )
    : undefined;
  const result = resolveProfile({
    baseProfile,
    assetProfile: profile,
    ...(categoryProfile ? { categoryProfile } : {})
  });
  if (result.status !== "resolved") return null;

  return {
    id: profile.id,
    name: profile.name,
    category: profile.category,
    categoryLabel: getDashboardCategory(profile.category).label,
    subtypeLabel: formatSubtypeLabel(profile.subtype),
    baseProfileName: baseProfile.name,
    baseProfileId: baseProfile.id,
    compatibilityKey: result.profile.compatibilityKey,
    facts: profileFacts(result.profile),
    tags: profile.tags.slice(0, 4),
    materials: profileMaterials(profile),
    favorite: profile.favorite,
    updatedAt: profile.updatedAt
  };
}

function baseProfileFacts(profile: BaseProfile): readonly string[] {
  return [
    pixelDensityLabels[profile.values.pixelDensity],
    `${profile.values.tileSize} px`,
    ...(profile.values.characterHeight === undefined
      ? []
      : [`${profile.values.characterHeight} px Figur`]),
    perspectiveLabels[profile.values.perspectiveType]
  ];
}

function selectBaseProfiles(
  profiles: readonly BaseProfile[],
  activeBaseProfileId: StableId | null
): readonly DashboardBaseProfileSummary[] {
  return profiles
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      facts: baseProfileFacts(profile),
      active: profile.id === activeBaseProfileId,
      updatedAt: profile.updatedAt
    }))
    .sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      return compareUpdatedAtThenId(left, right);
    })
    .slice(0, BASE_PROFILE_LIMIT);
}

function collectionStatus(
  result: StorageReadResult<ProfileLibrary>
): DashboardCollectionStatus {
  if (result.status !== "valid") return result.status;
  return result.value.assetProfiles.length === 0 ? "empty" : "ready";
}

function draftData(result: StorageReadResult<WizardDraft>): Readonly<{
  status: DashboardDraftStatus;
  draft: WizardDraft | null;
}> {
  return result.status === "valid"
    ? { status: "ready", draft: result.value }
    : { status: result.status, draft: null };
}

export function createDashboardData(
  profileResult: StorageReadResult<ProfileLibrary>,
  draftResult: StorageReadResult<WizardDraft>,
  activeBaseProfileId: StableId | null
): DashboardData {
  const resolvedProfiles =
    profileResult.status === "valid"
      ? profileResult.value.assetProfiles
          .map((profile) => resolveProfileSummary(profile, profileResult.value))
          .filter(
            (profile): profile is DashboardProfileSummary => profile !== null
          )
          .sort(compareUpdatedAtThenId)
      : [];
  const selectedDraft = draftData(draftResult);

  return {
    collectionStatus: collectionStatus(profileResult),
    recentProfiles: resolvedProfiles.slice(0, RECENT_PROFILE_LIMIT),
    favoriteProfiles: resolvedProfiles
      .filter((profile) => profile.favorite)
      .slice(0, FAVORITE_PROFILE_LIMIT),
    baseProfiles:
      profileResult.status === "valid"
        ? selectBaseProfiles(
            profileResult.value.baseProfiles,
            activeBaseProfileId
          )
        : [],
    skippedProfileCount:
      profileResult.status === "valid"
        ? profileResult.value.assetProfiles.length - resolvedProfiles.length
        : 0,
    draftStatus: selectedDraft.status,
    draft: selectedDraft.draft
  };
}

export function readDashboardData(
  storage: DashboardStorage,
  activeBaseProfileId: StableId | null
): DashboardData {
  return createDashboardData(
    storage.readProfileLibrary(),
    storage.readDraft(),
    activeBaseProfileId
  );
}

export function formatDashboardDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
