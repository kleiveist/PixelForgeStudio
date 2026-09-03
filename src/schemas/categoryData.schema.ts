import { z } from "zod";
import { ASSET_SUBTYPES } from "../domain/assets";
import {
  CHARACTER_AGE_IDS,
  CHARACTER_ANIMATION_ACTION_IDS,
  CHARACTER_BODY_BUILD_IDS,
  CHARACTER_CONDITION_IDS,
  CHARACTER_EXPRESSION_IDS,
  CHARACTER_EYE_VISIBILITY_IDS,
  CHARACTER_GENDER_PRESENTATION_IDS,
  CHARACTER_HEADWEAR_CONDITION_IDS,
  CHARACTER_PALETTE_SOURCE_IDS,
  CHARACTER_POSTURE_IDS,
  CHARACTER_RELATIVE_HEIGHT_IDS,
  CHARACTER_WEALTH_IDS
} from "../domain/characters";
import { validateCategoryDataCapabilities } from "./categoryData.refinement";
import { DirectionCountSchema, FootprintSchema } from "./common.schema";

const sharedAnswersShape = {
  subjectDescription: z.string().trim().min(1).max(4000).optional(),
  extraDetails: z.string().trim().max(4000).optional()
} as const;

const CharacterDescriptorSchema = z.string().trim().min(1).max(200);
const CharacterDetailSchema = z.string().trim().min(1).max(500);

export const CharacterAnimationActionSchema = z
  .strictObject({
    action: z.enum(CHARACTER_ANIMATION_ACTION_IDS),
    frames: z.number().int().min(1).max(8)
  })
  .readonly();

export const CharacterAnimationActionsSchema = z
  .array(CharacterAnimationActionSchema)
  .min(1)
  .max(CHARACTER_ANIMATION_ACTION_IDS.length)
  .superRefine((actions, context) => {
    const seen = new Set<string>();
    actions.forEach((entry, index) => {
      if (seen.has(entry.action)) {
        context.addIssue({
          code: "custom",
          path: [index, "action"],
          message: `Duplicate character animation action "${entry.action}".`
        });
      }
      seen.add(entry.action);
    });
  })
  .readonly();

export const CharacterAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    role: z.string().trim().min(1).max(100).optional(),
    variantCount: z.number().int().min(1).max(5).optional(),
    genderPresentation: z.enum(CHARACTER_GENDER_PRESENTATION_IDS).optional(),
    age: z.enum(CHARACTER_AGE_IDS).optional(),
    relativeHeight: z.enum(CHARACTER_RELATIVE_HEIGHT_IDS).optional(),
    bodyBuild: z.enum(CHARACTER_BODY_BUILD_IDS).optional(),
    posture: z.enum(CHARACTER_POSTURE_IDS).optional(),
    faceShape: CharacterDescriptorSchema.optional(),
    skinTone: CharacterDescriptorSchema.optional(),
    eyeVisibility: z.enum(CHARACTER_EYE_VISIBILITY_IDS).optional(),
    hair: CharacterDescriptorSchema.optional(),
    hairstyle: CharacterDescriptorSchema.optional(),
    beard: CharacterDescriptorSchema.optional(),
    hat: z.string().trim().min(1).max(100).optional(),
    headwearCondition: z.enum(CHARACTER_HEADWEAR_CONDITION_IDS).optional(),
    scarf: z.string().trim().min(1).max(100).optional(),
    outerwear: z.string().trim().min(1).max(120).optional(),
    lowerwear: CharacterDescriptorSchema.optional(),
    clothingLayers: CharacterDetailSchema.optional(),
    gloves: CharacterDescriptorSchema.optional(),
    handPose: CharacterDescriptorSchema.optional(),
    shoes: CharacterDescriptorSchema.optional(),
    beltBags: CharacterDetailSchema.optional(),
    accessories: CharacterDetailSchema.optional(),
    backItem: CharacterDescriptorSchema.optional(),
    equipment: CharacterDetailSchema.optional(),
    materials: CharacterDetailSchema.optional(),
    characterPaletteSource: z.enum(CHARACTER_PALETTE_SOURCE_IDS).optional(),
    primaryColor: CharacterDescriptorSchema.optional(),
    secondaryColor: CharacterDescriptorSchema.optional(),
    accentColor: CharacterDescriptorSchema.optional(),
    condition: z.enum(CHARACTER_CONDITION_IDS).optional(),
    expression: z.enum(CHARACTER_EXPRESSION_IDS).optional(),
    silhouette: CharacterDetailSchema.optional(),
    pose: CharacterDescriptorSchema.optional(),
    professionReadable: z.boolean().optional(),
    socialRole: CharacterDescriptorSchema.optional(),
    wealth: z.enum(CHARACTER_WEALTH_IDS).optional(),
    culturalFunction: CharacterDetailSchema.optional(),
    typicalActivity: CharacterDetailSchema.optional(),
    conversationGesture: CharacterDetailSchema.optional(),
    everydayTool: CharacterDescriptorSchema.optional(),
    frontBackDetails: CharacterDetailSchema.optional(),
    animationActions: CharacterAnimationActionsSchema.optional(),
    animationAction: z.enum(CHARACTER_ANIMATION_ACTION_IDS).optional(),
    directionCount: DirectionCountSchema.optional(),
    framesPerDirection: z.number().int().min(1).max(8).optional()
  })
  .readonly();

export const MovingObjectAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    purpose: z.string().trim().min(1).max(200).optional(),
    movementType: z
      .enum(["roll", "slide", "hover", "walk", "crawl", "fly", "rotate"])
      .optional(),
    directionCount: DirectionCountSchema.optional(),
    animationType: z
      .enum(["idle", "move", "rotate", "interact", "openClose", "pulse"])
      .optional(),
    framesPerDirection: z.number().int().min(1).max(16).optional(),
    footprint: FootprintSchema.optional()
  })
  .readonly();

export const StaticObjectAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    purpose: z.enum(["decorative", "interactive", "walkable", "blocking"]).optional(),
    interaction: z.enum(["none", "open", "tilt", "glow", "break"]).optional(),
    animationType: z.enum(["openClose", "glow", "break", "custom"]).optional(),
    footprint: FootprintSchema.optional()
  })
  .readonly();

export const TextureAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    usage: z.enum(["floor", "wall", "roof", "surface", "clothing", "decor"]).optional(),
    seamless: z.boolean().optional(),
    orientation: z
      .enum(["horizontal", "vertical", "radial", "unordered", "grainAligned"])
      .optional(),
    structure: z.enum(["fine", "medium", "coarse"]).optional(),
    condition: z
      .enum(["new", "polished", "rough", "old", "wet", "frosted", "damaged", "dirty"])
      .optional()
  })
  .readonly();

export const NatureAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    climate: z
      .enum(["temperate", "mountain", "snow", "swamp", "dry", "dark", "magical"])
      .optional(),
    season: z.enum(["spring", "summer", "autumn", "winter", "timeless"]).optional(),
    age: z.enum(["young", "mature", "ancient", "dead"]).optional(),
    animationType: z.enum(["wind", "magic", "custom"]).optional(),
    footprint: FootprintSchema.optional()
  })
  .readonly();

export const BuildingAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    purpose: z.string().trim().min(1).max(200).optional(),
    floors: z.number().int().min(1).max(20).optional(),
    condition: z
      .enum(["maintained", "used", "weathered", "damaged", "abandoned", "overgrown"])
      .optional(),
    modular: z.boolean().optional(),
    footprint: FootprintSchema.optional()
  })
  .readonly();

export const TilesetAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    tileUsage: z.enum(["floor", "wall", "roof", "transition", "decor"]).optional(),
    tileableAxes: z.enum(["horizontal", "vertical", "both", "none"]).optional(),
    animationType: z.enum(["water", "lava", "magic", "custom"]).optional(),
    variantCount: z.number().int().min(1).max(64).optional()
  })
  .readonly();

export const ItemAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    purpose: z.enum(["practical", "decorative", "wearable", "usable"]).optional(),
    presentation: z.enum(["icon", "worldAsset", "equipped"]).optional(),
    wearPosition: z
      .enum(["head", "neck", "hand", "body", "back", "belt"])
      .optional(),
    iconSize: z.number().int().min(8).max(512).optional()
  })
  .readonly();

export const ArtworkAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    purpose: z.enum(["concept", "presentation", "productionReference"]).optional(),
    composition: z.enum(["singleSubject", "group", "scene"]).optional(),
    format: z.enum(["square", "portrait", "landscape", "free"]).optional(),
    background: z.enum(["transparent", "simple", "complete"]).optional(),
    focus: z.enum(["form", "material", "mood", "story", "scale"]).optional()
  })
  .readonly();

export const CharacterCategoryDataSchema = z.strictObject({
  category: z.literal("character"),
  subtype: z.enum(ASSET_SUBTYPES.character),
  answers: CharacterAnswersSchema
});

export const MovingObjectCategoryDataSchema = z.strictObject({
  category: z.literal("movingObject"),
  subtype: z.enum(ASSET_SUBTYPES.movingObject),
  answers: MovingObjectAnswersSchema
});

export const StaticObjectCategoryDataSchema = z.strictObject({
  category: z.literal("staticObject"),
  subtype: z.enum(ASSET_SUBTYPES.staticObject),
  answers: StaticObjectAnswersSchema
});

export const TextureCategoryDataSchema = z.strictObject({
  category: z.literal("texture"),
  subtype: z.enum(ASSET_SUBTYPES.texture),
  answers: TextureAnswersSchema
});

export const NatureCategoryDataSchema = z.strictObject({
  category: z.literal("nature"),
  subtype: z.enum(ASSET_SUBTYPES.nature),
  answers: NatureAnswersSchema
});

export const BuildingCategoryDataSchema = z.strictObject({
  category: z.literal("building"),
  subtype: z.enum(ASSET_SUBTYPES.building),
  answers: BuildingAnswersSchema
});

export const TilesetCategoryDataSchema = z.strictObject({
  category: z.literal("tileset"),
  subtype: z.enum(ASSET_SUBTYPES.tileset),
  answers: TilesetAnswersSchema
});

export const ItemCategoryDataSchema = z.strictObject({
  category: z.literal("item"),
  subtype: z.enum(ASSET_SUBTYPES.item),
  answers: ItemAnswersSchema
});

export const ArtworkCategoryDataSchema = z.strictObject({
  category: z.literal("artwork"),
  subtype: z.enum(ASSET_SUBTYPES.artwork),
  answers: ArtworkAnswersSchema
});

export const AssetCategoryDataSchema = z
  .discriminatedUnion("category", [
    CharacterCategoryDataSchema,
    MovingObjectCategoryDataSchema,
    StaticObjectCategoryDataSchema,
    TextureCategoryDataSchema,
    NatureCategoryDataSchema,
    BuildingCategoryDataSchema,
    TilesetCategoryDataSchema,
    ItemCategoryDataSchema,
    ArtworkCategoryDataSchema
  ])
  .superRefine((value, context) => {
    validateCategoryDataCapabilities(value, "answers", context);
  });

export type CharacterAnswers = z.infer<typeof CharacterAnswersSchema>;
export type CharacterAnimationActionConfig = z.infer<
  typeof CharacterAnimationActionSchema
>;
export type MovingObjectAnswers = z.infer<typeof MovingObjectAnswersSchema>;
export type StaticObjectAnswers = z.infer<typeof StaticObjectAnswersSchema>;
export type TextureAnswers = z.infer<typeof TextureAnswersSchema>;
export type NatureAnswers = z.infer<typeof NatureAnswersSchema>;
export type BuildingAnswers = z.infer<typeof BuildingAnswersSchema>;
export type TilesetAnswers = z.infer<typeof TilesetAnswersSchema>;
export type ItemAnswers = z.infer<typeof ItemAnswersSchema>;
export type ArtworkAnswers = z.infer<typeof ArtworkAnswersSchema>;
export type AssetCategoryData = z.infer<typeof AssetCategoryDataSchema>;
