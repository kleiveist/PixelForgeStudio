import { z } from "zod";
import {
  ANIMATION_STUDIO_VIEW_IDS,
  APP_VIEW_IDS,
  STUDIO_IDS
} from "../domain/navigation";
import { THEME_PREFERENCES } from "../domain/theme";
import {
  IsoDateTimeSchema,
  SchemaVersionSchema,
  StableIdSchema
} from "./common.schema";

export const ThemePreferenceSchema = z.enum(THEME_PREFERENCES);

export const AppSettingsSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  kind: z.literal("appSettings"),
  theme: ThemePreferenceSchema,
  locale: z.enum(["de", "en"]),
  startStudio: z.enum(STUDIO_IDS).default("home"),
  startView: z.enum(APP_VIEW_IDS),
  animationStartView: z.enum(ANIMATION_STUDIO_VIEW_IDS).default("projects"),
  activeBaseProfileId: StableIdSchema.nullable(),
  updatedAt: IsoDateTimeSchema
});

export function parseAppSettings(input: unknown): AppSettings {
  return AppSettingsSchema.parse(input);
}

export type AppSettings = z.infer<typeof AppSettingsSchema>;
