import { z } from "zod";
import { APP_VIEW_IDS, type PromptStudioView } from "../domain/navigation";
import { THEME_PREFERENCES } from "../domain/theme";
import {
  IsoDateTimeSchema,
  SchemaVersionSchema,
  StableIdSchema
} from "./common.schema";

export const ThemePreferenceSchema = z.enum(THEME_PREFERENCES);

const PromptStartViewSchema = z
  .union([z.enum(APP_VIEW_IDS), z.literal("review")])
  .transform((view): PromptStudioView => (view === "review" ? "output" : view));

// Compatibility-only fields from the retired roof shell. Existing Settings
// V2 and export bundles remain readable, but these values no longer route the
// Prompt-only application.
const LegacyStudioStartSchema = z
  .enum(["home", "prompt", "animation"])
  .default("home");
const LegacyAnimationStartViewSchema = z
  .enum(["projects", "workspace", "library", "rigs"])
  .default("projects");

export const AppSettingsSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  kind: z.literal("appSettings"),
  theme: ThemePreferenceSchema,
  locale: z.enum(["de", "en"]).default("de"),
  startStudio: LegacyStudioStartSchema,
  startView: PromptStartViewSchema,
  animationStartView: LegacyAnimationStartViewSchema,
  activeBaseProfileId: StableIdSchema.nullable(),
  updatedAt: IsoDateTimeSchema
});

export function parseAppSettings(input: unknown): AppSettings {
  return AppSettingsSchema.parse(input);
}

export type AppSettings = z.infer<typeof AppSettingsSchema>;
