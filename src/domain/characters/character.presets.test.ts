import { describe, expect, it } from "vitest";
import { CharacterAnswersSchema } from "../../schemas";
import {
  CHARACTER_TEXT_PRESET_FIELD_IDS,
  CHARACTER_TEXT_PRESETS_DE
} from "./index";

describe("German Character text presets", () => {
  it("covers every published text field with immutable, distinct choices", () => {
    expect(Object.isFrozen(CHARACTER_TEXT_PRESET_FIELD_IDS)).toBe(true);
    expect(Object.isFrozen(CHARACTER_TEXT_PRESETS_DE)).toBe(true);
    expect(Object.keys(CHARACTER_TEXT_PRESETS_DE)).toEqual(
      CHARACTER_TEXT_PRESET_FIELD_IDS
    );

    for (const field of CHARACTER_TEXT_PRESET_FIELD_IDS) {
      const presets = CHARACTER_TEXT_PRESETS_DE[field];
      expect(Object.isFrozen(presets)).toBe(true);
      expect(presets.length).toBeGreaterThanOrEqual(6);
      expect(new Set(presets).size).toBe(presets.length);
      expect(presets.every((preset) => preset === preset.trim())).toBe(true);
    }
  });

  it("keeps every suggestion valid at the existing Character schema boundary", () => {
    for (const field of CHARACTER_TEXT_PRESET_FIELD_IDS) {
      for (const preset of CHARACTER_TEXT_PRESETS_DE[field]) {
        expect(
          CharacterAnswersSchema.safeParse({ [field]: preset }).success,
          `${field}: ${preset}`
        ).toBe(true);
      }
    }
  });
});
