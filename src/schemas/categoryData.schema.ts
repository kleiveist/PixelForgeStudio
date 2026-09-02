import { z } from "zod";
import { ASSET_SUBTYPES } from "../domain/assets";
import { DirectionCountSchema, FootprintSchema } from "./common.schema";

const sharedAnswersShape = {
  subjectDescription: z.string().trim().min(1).max(4000).optional(),
  extraDetails: z.string().trim().max(4000).optional()
} as const;

export const CharacterAnswersSchema = z
  .strictObject({
    ...sharedAnswersShape,
    role: z.string().trim().min(1).max(100).optional(),
    variantCount: z.number().int().min(1).max(5).optional(),
    hat: z.string().trim().min(1).max(100).optional(),
    scarf: z.string().trim().min(1).max(100).optional(),
    outerwear: z.string().trim().min(1).max(120).optional(),
    animationAction: z
      .enum(["idle", "walk", "run", "interact", "talk", "attack", "hurt", "special"])
      .optional(),
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

export const AssetCategoryDataSchema = z.discriminatedUnion("category", [
  CharacterCategoryDataSchema,
  MovingObjectCategoryDataSchema,
  StaticObjectCategoryDataSchema,
  TextureCategoryDataSchema,
  NatureCategoryDataSchema,
  BuildingCategoryDataSchema,
  TilesetCategoryDataSchema,
  ItemCategoryDataSchema,
  ArtworkCategoryDataSchema
]);

export type CharacterAnswers = z.infer<typeof CharacterAnswersSchema>;
export type MovingObjectAnswers = z.infer<typeof MovingObjectAnswersSchema>;
export type StaticObjectAnswers = z.infer<typeof StaticObjectAnswersSchema>;
export type TextureAnswers = z.infer<typeof TextureAnswersSchema>;
export type NatureAnswers = z.infer<typeof NatureAnswersSchema>;
export type BuildingAnswers = z.infer<typeof BuildingAnswersSchema>;
export type TilesetAnswers = z.infer<typeof TilesetAnswersSchema>;
export type ItemAnswers = z.infer<typeof ItemAnswersSchema>;
export type ArtworkAnswers = z.infer<typeof ArtworkAnswersSchema>;
export type AssetCategoryData = z.infer<typeof AssetCategoryDataSchema>;
