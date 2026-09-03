import { z } from "zod";
import {
  ASSET_CATEGORY_IDS,
  ASSET_SUBTYPES,
  resolveCapabilities,
  type AssetCapabilities,
  type AssetCategory,
  type AssetSubtype
} from "../../domain/assets";
import { CHARACTER_ANIMATION_ACTION_IDS } from "../../domain/characters";
import {
  BaseProfileValuesSchema,
  CharacterAnswersSchema,
  type BaseProfileValues
} from "../../schemas";

const ProjectNameSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib einen Projektnamen ein.")
  .max(120);

const AssetSubtypeSchema = z.union([
  z.enum(ASSET_SUBTYPES.character),
  z.enum(ASSET_SUBTYPES.movingObject),
  z.enum(ASSET_SUBTYPES.staticObject),
  z.enum(ASSET_SUBTYPES.texture),
  z.enum(ASSET_SUBTYPES.nature),
  z.enum(ASSET_SUBTYPES.building),
  z.enum(ASSET_SUBTYPES.tileset),
  z.enum(ASSET_SUBTYPES.item),
  z.enum(ASSET_SUBTYPES.artwork)
]);

const AnimationTypeSchema = z.enum([
  "idle",
  "move",
  "rotate",
  "interact",
  "openClose",
  "pulse",
  "glow",
  "break",
  "wind",
  "magic",
  "water",
  "lava",
  "custom"
]);

const {
  animationAction: _legacyCharacterAnimationAction,
  animationActions: _characterAnimationActions,
  directionCount: _characterDirectionCount,
  framesPerDirection: _legacyCharacterFrames,
  ...characterDetailFormShape
} = CharacterAnswersSchema.unwrap().shape;
void _legacyCharacterAnimationAction;
void _characterAnimationActions;
void _characterDirectionCount;
void _legacyCharacterFrames;

const CharacterAnimationFramesSchema = z
  .partialRecord(
    z.enum(CHARACTER_ANIMATION_ACTION_IDS),
    z.number().int().min(1).max(8)
  )
  .optional();

export const WizardCoreFormSchema = z.strictObject({
  projectName: ProjectNameSchema,
  category: z.enum(ASSET_CATEGORY_IDS).optional(),
  subtype: AssetSubtypeSchema.optional(),
  baseProfileId: z
    .string()
    .min(3)
    .max(128)
    .regex(/^[a-z0-9][a-z0-9_-]*$/)
    .optional(),
  pixelDensity: z.enum(["classicHd", "modernHd", "ultraHd"]).optional(),
  styleProfile: z.enum(["classic", "dark", "both"]).optional(),
  tileSize: z.number().int().min(8).max(512).optional(),
  characterHeight: z.number().int().min(16).max(1024).optional(),
  perspectiveType: z
    .enum(["topdown", "threeQuarter", "isometric", "side"])
    .optional(),
  cameraAngle: z
    .union([z.literal(30), z.literal(45), z.literal(60)])
    .optional(),
  cameraDirection: z
    .enum(["southToNorth", "swToNe", "seToNw"])
    .optional(),
  projectionType: z.enum(["orthographic", "mildPerspective"]).optional(),
  outlineStyle: z.enum(["dark", "softSelective", "minimal"]).optional(),
  paletteMode: z
    .enum(["natural", "vivid", "desaturated", "byProfile"])
    .optional(),
  backgroundMode: z.enum(["transparent", "scene"]).optional(),
  alphaPadding: z.number().int().min(0).max(256).optional(),
  nearestNeighbor: z.boolean().optional(),
  lightingPolicy: z
    .enum([
      "adaptive",
      "neutralDay",
      "warmInterior",
      "gloomyDiffuse",
      "neutralNight",
      "coolNight",
      "custom"
    ])
    .optional(),
  lightingNotes: z.string().trim().max(2000).optional(),
  ...characterDetailFormShape,
  characterAnimationFrames: CharacterAnimationFramesSchema,
  directionCount: z.union([z.literal(4), z.literal(8)]).optional(),
  animationAction: z
    .enum(CHARACTER_ANIMATION_ACTION_IDS)
    .optional(),
  animationType: AnimationTypeSchema.optional(),
  movementType: z
    .enum(["roll", "slide", "hover", "walk", "crawl", "fly", "rotate"])
    .optional(),
  seamless: z.boolean().optional(),
  tileableAxes: z.enum(["horizontal", "vertical", "both", "none"]).optional()
});

export type WizardCoreFormValues = z.infer<typeof WizardCoreFormSchema>;
export type WizardCoreFieldPath = keyof WizardCoreFormValues;
export type WizardCoreStepId =
  | "project"
  | "category"
  | "baseProfile"
  | "characterDetails"
  | "directions"
  | "animation"
  | "tileability";

function subtypeMatchesCategory(
  category: AssetCategory,
  subtype: AssetSubtype
): boolean {
  const knownSubtypes: readonly string[] = ASSET_SUBTYPES[category];
  return knownSubtypes.includes(subtype);
}

interface WizardCoreSelection {
  readonly category: AssetCategory;
  readonly subtype: AssetSubtype;
  readonly capabilities: AssetCapabilities;
}

export const WIZARD_TECHNICAL_FIELD_PATHS = Object.freeze([
  "pixelDensity",
  "styleProfile",
  "tileSize",
  "characterHeight",
  "perspectiveType",
  "cameraAngle",
  "cameraDirection",
  "projectionType",
  "outlineStyle",
  "paletteMode",
  "backgroundMode",
  "alphaPadding",
  "nearestNeighbor",
  "lightingPolicy",
  "lightingNotes"
] as const satisfies readonly WizardCoreFieldPath[]);

export const WIZARD_CHARACTER_DETAIL_FIELD_PATHS = Object.freeze([
  "role",
  "subjectDescription",
  "variantCount",
  "genderPresentation",
  "age",
  "relativeHeight",
  "bodyBuild",
  "posture",
  "faceShape",
  "skinTone",
  "eyeVisibility",
  "hair",
  "hairstyle",
  "beard",
  "hat",
  "headwearCondition",
  "scarf",
  "outerwear",
  "lowerwear",
  "clothingLayers",
  "gloves",
  "handPose",
  "shoes",
  "beltBags",
  "accessories",
  "backItem",
  "equipment",
  "materials",
  "characterPaletteSource",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "condition",
  "expression",
  "silhouette",
  "pose",
  "professionReadable",
  "socialRole",
  "wealth",
  "culturalFunction",
  "typicalActivity",
  "conversationGesture",
  "everydayTool",
  "frontBackDetails",
  "extraDetails"
] as const satisfies readonly WizardCoreFieldPath[]);

const ANIMATION_TYPES_BY_CATEGORY: Readonly<
  Partial<Record<AssetCategory, readonly string[]>>
> = Object.freeze({
  movingObject: Object.freeze([
    "idle",
    "move",
    "rotate",
    "interact",
    "openClose",
    "pulse"
  ]),
  staticObject: Object.freeze(["openClose", "glow", "break", "custom"]),
  nature: Object.freeze(["wind", "magic", "custom"]),
  tileset: Object.freeze(["water", "lava", "magic", "custom"])
});

function resolveCoreCapabilities(
  category: AssetCategory,
  subtype: AssetSubtype
): AssetCapabilities {
  switch (category) {
    case "character":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.character)[number]
      );
    case "movingObject":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.movingObject)[number]
      );
    case "staticObject":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.staticObject)[number]
      );
    case "texture":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.texture)[number]
      );
    case "nature":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.nature)[number]
      );
    case "building":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.building)[number]
      );
    case "tileset":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.tileset)[number]
      );
    case "item":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.item)[number]
      );
    case "artwork":
      return resolveCapabilities(
        category,
        subtype as (typeof ASSET_SUBTYPES.artwork)[number]
      );
  }
}

function requireSelection(
  values: WizardCoreFormValues,
  context: z.RefinementCtx
): WizardCoreSelection | null {
  if (values.category === undefined) {
    context.addIssue({
      code: "custom",
      path: ["category"],
      message: "Bitte wähle zuerst eine Asset-Kategorie."
    });
    return null;
  }

  if (values.subtype === undefined) {
    context.addIssue({
      code: "custom",
      path: ["subtype"],
      message: "Bitte wähle einen Untertyp."
    });
    return null;
  }

  if (!subtypeMatchesCategory(values.category, values.subtype)) {
    context.addIssue({
      code: "custom",
      path: ["subtype"],
      message: "Der Untertyp gehört nicht zur gewählten Asset-Kategorie."
    });
    return null;
  }

  return {
    category: values.category,
    subtype: values.subtype,
    capabilities: resolveCoreCapabilities(values.category, values.subtype)
  };
}

function addFieldIssue(
  context: z.RefinementCtx,
  field: WizardCoreFieldPath,
  message: string
): void {
  context.addIssue({ code: "custom", path: [field], message });
}

export function parseWizardTechnicalFormValues(
  values: WizardCoreFormValues
): BaseProfileValues | null {
  const result = BaseProfileValuesSchema.safeParse({
    pixelDensity: values.pixelDensity,
    styleProfile: values.styleProfile,
    tileSize: values.tileSize,
    ...(values.characterHeight === undefined
      ? {}
      : { characterHeight: values.characterHeight }),
    perspectiveType: values.perspectiveType,
    cameraAngle: values.cameraAngle,
    cameraDirection: values.cameraDirection,
    projectionType: values.projectionType,
    outlineStyle: values.outlineStyle,
    paletteMode: values.paletteMode,
    backgroundMode: values.backgroundMode,
    alphaPadding: values.alphaPadding,
    nearestNeighbor: values.nearestNeighbor,
    lightingDefaults: {
      policy: values.lightingPolicy,
      notes: values.lightingNotes
    }
  });

  return result.success ? result.data : null;
}

function validateCapabilityFields(
  values: WizardCoreFormValues,
  selection: WizardCoreSelection,
  context: z.RefinementCtx
): void {
  const { capabilities, category } = selection;

  if (values.directionCount !== undefined && !capabilities.directional) {
    addFieldIssue(
      context,
      "directionCount",
      "Richtungen sind für diesen Untertyp nicht verfügbar."
    );
  }
  if (
    values.animationAction !== undefined &&
    (category !== "character" || !capabilities.animated)
  ) {
    addFieldIssue(
      context,
      "animationAction",
      "Figurenaktionen sind für diesen Untertyp nicht verfügbar."
    );
  }
  if (
    values.characterAnimationFrames !== undefined &&
    (category !== "character" || !capabilities.animated)
  ) {
    addFieldIssue(
      context,
      "characterAnimationFrames",
      "Figurenaktionen sind für diesen Untertyp nicht verfügbar."
    );
  }
  if (
    values.movementType !== undefined &&
    (category !== "movingObject" || !capabilities.movable)
  ) {
    addFieldIssue(
      context,
      "movementType",
      "Diese Bewegungsart gehört nicht zum gewählten Untertyp."
    );
  }
  if (values.animationType !== undefined) {
    const allowedAnimationTypes = ANIMATION_TYPES_BY_CATEGORY[category];
    if (
      !capabilities.animated ||
      allowedAnimationTypes === undefined ||
      !allowedAnimationTypes.includes(values.animationType)
    ) {
      addFieldIssue(
        context,
        "animationType",
        "Diese Animationsart gehört nicht zum gewählten Untertyp."
      );
    }
  }
  if (
    values.seamless !== undefined &&
    (category !== "texture" || !capabilities.tileable)
  ) {
    addFieldIssue(
      context,
      "seamless",
      "Nahtlose Wiederholung ist für diesen Untertyp nicht verfügbar."
    );
  }
  if (
    values.tileableAxes !== undefined &&
    (category !== "tileset" || !capabilities.tileable)
  ) {
    addFieldIssue(
      context,
      "tileableAxes",
      "Kachelbare Achsen gehören nicht zum gewählten Untertyp."
    );
  }
}

function refineSelectedValues(
  values: WizardCoreFormValues,
  context: z.RefinementCtx,
  requiredCapability?: "directional" | "animated" | "tileable",
  requireBaseProfile = false
): void {
  const selection = requireSelection(values, context);
  if (!selection) return;

  validateCapabilityFields(values, selection, context);
  if (requireBaseProfile) {
    if (values.baseProfileId === undefined) {
      addFieldIssue(
        context,
        "baseProfileId",
        "Bitte wähle ein Basisprofil oder lege eine neue Produktionsfamilie an."
      );
    }
    if (parseWizardTechnicalFormValues(values) === null) {
      addFieldIssue(
        context,
        "baseProfileId",
        "Das Basisprofil benötigt vollständige gültige Produktionswerte."
      );
    }
    if (
      selection.capabilities.scaledCharacter &&
      values.characterHeight === undefined
    ) {
      addFieldIssue(
        context,
        "characterHeight",
        "Für Figuren und figurähnliche Assets ist eine Figurenhöhe erforderlich."
      );
    }
  }
  if (
    requiredCapability !== undefined &&
    !selection.capabilities[requiredCapability]
  ) {
    context.addIssue({
      code: "custom",
      path: ["category"],
      message: `Dieser Untertyp unterstützt den Schritt „${requiredCapability}“ nicht.`
    });
  }
}

export const WizardProjectStepSchema = WizardCoreFormSchema;
export const WizardCategoryStepSchema = WizardCoreFormSchema.superRefine(
  (values, context) => refineSelectedValues(values, context)
);
export const WizardBaseProfileStepSchema = WizardCoreFormSchema.superRefine(
  (values, context) => refineSelectedValues(values, context, undefined, true)
);
export const WizardCharacterDetailsStepSchema =
  WizardCoreFormSchema.superRefine((values, context) => {
    refineSelectedValues(values, context, undefined, true);
    if (values.category !== undefined && values.category !== "character") {
      addFieldIssue(
        context,
        "category",
        "Der Figuren-Editor ist nur für Charaktere verfügbar."
      );
    }
  });
export const WizardDirectionStepSchema = WizardCoreFormSchema.superRefine(
  (values, context) =>
    refineSelectedValues(values, context, "directional", true)
);
export const WizardAnimationStepSchema = WizardCoreFormSchema.superRefine(
  (values, context) =>
    refineSelectedValues(values, context, "animated", true)
);
export const WizardTileabilityStepSchema = WizardCoreFormSchema.superRefine(
  (values, context) =>
    refineSelectedValues(values, context, "tileable", true)
);

export interface WizardCoreStep {
  readonly id: WizardCoreStepId;
  readonly route:
    | "wizard/project"
    | "wizard/category"
    | "wizard/profile"
    | "wizard/editor";
  readonly title: string;
  readonly description: string;
  readonly fieldPaths: readonly WizardCoreFieldPath[];
  readonly schema: z.ZodType<WizardCoreFormValues, WizardCoreFormValues>;
}

export const WIZARD_CORE_STEPS = Object.freeze([
  Object.freeze({
    id: "project",
    route: "wizard/project",
    title: "Projekt",
    description: "Benenne den Entwurf, damit du ihn später eindeutig wiederfindest.",
    fieldPaths: Object.freeze(["projectName"] as const),
    schema: WizardProjectStepSchema
  }),
  Object.freeze({
    id: "category",
    route: "wizard/category",
    title: "Bildart",
    description:
      "Wähle zuerst die Hauptkategorie und danach genau den passenden Untertyp.",
    fieldPaths: Object.freeze(["category", "subtype"] as const),
    schema: WizardCategoryStepSchema
  }),
  Object.freeze({
    id: "baseProfile",
    route: "wizard/profile",
    title: "Basisprofil",
    description:
      "Wähle die globale Produktionsfamilie und prüfe geerbte technische Werte sowie Locks.",
    fieldPaths: Object.freeze([
      "baseProfileId",
      ...WIZARD_TECHNICAL_FIELD_PATHS
    ] as const),
    schema: WizardBaseProfileStepSchema
  }),
  Object.freeze({
    id: "characterDetails",
    route: "wizard/editor",
    title: "Figur und Rolle",
    description:
      "Beschreibe Identität, Körper, Kleidung, Ausrüstung und die lesbare Silhouette der Figur.",
    fieldPaths: WIZARD_CHARACTER_DETAIL_FIELD_PATHS,
    schema: WizardCharacterDetailsStepSchema
  }),
  Object.freeze({
    id: "directions",
    route: "wizard/editor",
    title: "Richtungen",
    description:
      "Lege nur für richtungsabhängig bewegliche Assets ein 4- oder 8-Richtungsset fest.",
    fieldPaths: Object.freeze(["directionCount"] as const),
    schema: WizardDirectionStepSchema
  }),
  Object.freeze({
    id: "animation",
    route: "wizard/editor",
    title: "Bewegung und Animation",
    description:
      "Beschreibe zeitliche Bewegung, ohne Animation automatisch mit Richtungen gleichzusetzen.",
    fieldPaths: Object.freeze(
      [
        "movementType",
        "animationAction",
        "animationType",
        "characterAnimationFrames"
      ] as const
    ),
    schema: WizardAnimationStepSchema
  }),
  Object.freeze({
    id: "tileability",
    route: "wizard/editor",
    title: "Kachelbarkeit",
    description:
      "Definiere die Wiederholbarkeit nur für Assets mit Tileability-Capability.",
    fieldPaths: Object.freeze(["seamless", "tileableAxes"] as const),
    schema: WizardTileabilityStepSchema
  })
] as const satisfies readonly WizardCoreStep[]);

export function isWizardCoreStepId(value: string): value is WizardCoreStepId {
  return WIZARD_CORE_STEPS.some((step) => step.id === value);
}

export function getWizardCoreStep(stepId: WizardCoreStepId): WizardCoreStep {
  const step = WIZARD_CORE_STEPS.find((candidate) => candidate.id === stepId);
  if (step === undefined) {
    throw new Error(`Unknown wizard core step "${stepId}".`);
  }
  return step;
}

export function getWizardCoreStepIndex(stepId: WizardCoreStepId): number {
  return WIZARD_CORE_STEPS.findIndex((step) => step.id === stepId);
}

export function getWizardCoreFallbackStepId(route: string): WizardCoreStepId {
  if (route === "wizard/project") return "project";
  if (route === "wizard/category") return "category";
  return "baseProfile";
}
