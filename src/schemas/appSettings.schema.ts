import { z } from "zod";
import {
  IsoDateTimeSchema,
  SchemaVersionSchema,
  StableIdSchema
} from "./common.schema";

export const AppSettingsSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  kind: z.literal("appSettings"),
  theme: z.enum(["light", "dark", "system"]),
  locale: z.enum(["de", "en"]),
  startView: z.enum(["dashboard", "profiles", "wizard", "review", "output", "settings"]),
  activeBaseProfileId: StableIdSchema.nullable(),
  updatedAt: IsoDateTimeSchema
});

export function parseAppSettings(input: unknown): AppSettings {
  return AppSettingsSchema.parse(input);
}

export type AppSettings = z.infer<typeof AppSettingsSchema>;
