import { describe, expect, it } from "vitest";
import {
  GUIDED_TEXT_PRESET_FIELD_IDS,
  GUIDED_TEXT_PRESETS_DE
} from "./guidedTextPresets";

describe("guided German text presets", () => {
  it("provides several immutable, unique choices for every declared field", () => {
    expect(Object.isFrozen(GUIDED_TEXT_PRESET_FIELD_IDS)).toBe(true);
    expect(Object.isFrozen(GUIDED_TEXT_PRESETS_DE)).toBe(true);
    expect(Object.keys(GUIDED_TEXT_PRESETS_DE)).toEqual(
      GUIDED_TEXT_PRESET_FIELD_IDS
    );

    for (const field of GUIDED_TEXT_PRESET_FIELD_IDS) {
      const presets = GUIDED_TEXT_PRESETS_DE[field];
      expect(Object.isFrozen(presets), field).toBe(true);
      expect(presets.length, field).toBeGreaterThanOrEqual(4);
      expect(new Set(presets).size, field).toBe(presets.length);
      expect(
        presets.every(
          (preset) =>
            preset === preset.trim() &&
            preset.length > 0 &&
            preset.length <= 500
        ),
        field
      ).toBe(true);
    }
  });
});
