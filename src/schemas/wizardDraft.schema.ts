import { z } from "zod";
import {
  ASSET_SUBTYPES,
  resolveCapabilities,
  type AssetCategory,
  type AssetSubtype
} from "../domain/assets";
import {
  ArtworkAnswersSchema,
  BuildingAnswersSchema,
  CharacterAnswersSchema,
  ItemAnswersSchema,
  MovingObjectAnswersSchema,
  NatureAnswersSchema,
  StaticObjectAnswersSchema,
  TextureAnswersSchema,
  TilesetAnswersSchema
} from "./categoryData.schema";
import {
  IsoDateTimeSchema,
  ProfileNameSchema,
  SchemaVersionSchema,
  StableIdSchema,
  ValidationMessagesSchema
} from "./common.schema";

const WizardDraftCommonSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  kind: z.literal("wizardDraft"),
  draftId: StableIdSchema,
  projectName: ProfileNameSchema,
  route: z.enum([
    "wizard/project",
    "wizard/category",
    "wizard/profile",
    "wizard/editor",
    "wizard/review"
  ]),
  currentStep: z.string().min(1).max(100),
  baseProfileId: StableIdSchema,
  categoryProfileId: StableIdSchema.optional(),
  validation: ValidationMessagesSchema,
  savedAt: IsoDateTimeSchema
});

const WizardDraftUnionSchema = z.discriminatedUnion("category", [
  WizardDraftCommonSchema.extend({
    category: z.literal("character"),
    subtype: z.enum(ASSET_SUBTYPES.character),
    answers: CharacterAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("movingObject"),
    subtype: z.enum(ASSET_SUBTYPES.movingObject),
    answers: MovingObjectAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("staticObject"),
    subtype: z.enum(ASSET_SUBTYPES.staticObject),
    answers: StaticObjectAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("texture"),
    subtype: z.enum(ASSET_SUBTYPES.texture),
    answers: TextureAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("nature"),
    subtype: z.enum(ASSET_SUBTYPES.nature),
    answers: NatureAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("building"),
    subtype: z.enum(ASSET_SUBTYPES.building),
    answers: BuildingAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("tileset"),
    subtype: z.enum(ASSET_SUBTYPES.tileset),
    answers: TilesetAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("item"),
    subtype: z.enum(ASSET_SUBTYPES.item),
    answers: ItemAnswersSchema
  }),
  WizardDraftCommonSchema.extend({
    category: z.literal("artwork"),
    subtype: z.enum(ASSET_SUBTYPES.artwork),
    answers: ArtworkAnswersSchema
  })
]);

export const WizardDraftSchema = WizardDraftUnionSchema.superRefine((value, context) => {
  const answers = value.answers as Readonly<Record<string, unknown>>;
  if (
    answers.directionCount !== undefined &&
    !resolveCapabilities(value.category as AssetCategory, value.subtype as AssetSubtype).directional
  ) {
    context.addIssue({
      code: "custom",
      path: ["answers", "directionCount"],
      message: "Direction counts are only valid for directional asset subtypes."
    });
  }
});

export function parseWizardDraft(input: unknown): WizardDraft {
  return WizardDraftSchema.parse(input);
}

export type WizardDraft = z.infer<typeof WizardDraftSchema>;
