import { z } from "zod";
import { AppSettingsSchema } from "./appSettings.schema";
import {
  IsoDateTimeSchema,
  SchemaVersionSchema,
  StableIdSchema
} from "./common.schema";
import {
  AssetProfileSchema,
  BaseProfileSchema,
  CategoryProfileSchema
} from "./profiles.schema";
import { WizardDraftSchema } from "./wizardDraft.schema";

export const ExportBundleSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  formatVersion: z.literal(2),
  kind: z.literal("exportBundle"),
  application: z.literal("PixelForge Prompt Studio"),
  bundleId: StableIdSchema,
  exportedAt: IsoDateTimeSchema,
  baseProfiles: z.array(BaseProfileSchema).max(500).readonly(),
  categoryProfiles: z.array(CategoryProfileSchema).max(2000).readonly(),
  assetProfiles: z.array(AssetProfileSchema).max(10_000).readonly(),
  appSettings: AppSettingsSchema.optional(),
  wizardDrafts: z.array(WizardDraftSchema).max(100).readonly()
});

export function parseExportBundle(input: unknown): ExportBundle {
  return ExportBundleSchema.parse(input);
}

export type ExportBundle = z.infer<typeof ExportBundleSchema>;
