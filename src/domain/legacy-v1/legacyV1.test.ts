import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import autosaveFixture from "../../../legacy/v1/tests/fixtures/v1/autosave-directional-character.json";
import defaultOutputSignatures from "../../../legacy/v1/tests/fixtures/v1/default-output-signatures.json";
import presetsFixture from "../../../legacy/v1/tests/fixtures/v1/presets-storage.json";
import {
  buildProjectOutputs as buildReferenceOutputs,
  getResolvedMetrics as getReferenceMetrics,
  validateState as validateReferenceState
} from "../../../legacy/v1/src/js/core/prompt-builder.js";
import {
  buildLegacyV1ProjectOutputs,
  getLegacyV1ResolvedMetrics,
  LEGACY_V1_DEFAULT_STATE,
  mergeLegacyV1State,
  validateLegacyV1State
} from "./index";

const PROMPT_FIELDS = ["main", "negative", "technical", "combined"] as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describe("Legacy-V1-Domainport", () => {
  it("reproduziert Standardmetriken und Promptsignaturen bytegenau", () => {
    const outputs = buildLegacyV1ProjectOutputs(LEGACY_V1_DEFAULT_STATE);

    expect(getLegacyV1ResolvedMetrics(LEGACY_V1_DEFAULT_STATE)).toEqual(
      defaultOutputSignatures.metrics
    );
    expect(
      outputs.map((output) => ({
        id: output.id,
        profile: output.profile,
        language: output.language,
        lengths: Object.fromEntries(
          PROMPT_FIELDS.map((field) => [field, output[field].length])
        ),
        sha256: Object.fromEntries(PROMPT_FIELDS.map((field) => [field, sha256(output[field])]))
      }))
    ).toEqual(defaultOutputSignatures.outputs);
    expect(outputs).toEqual(buildReferenceOutputs());
  });

  it("reproduziert das Directional-Character-Autosave aus der V1-Baseline", () => {
    const state = mergeLegacyV1State(autosaveFixture.state);

    expect(getLegacyV1ResolvedMetrics(state)).toEqual({
      frame: 128,
      columns: 4,
      rows: 2,
      canvasWidth: 512,
      canvasHeight: 256,
      directionCount: 8
    });
    expect(getLegacyV1ResolvedMetrics(state)).toEqual(getReferenceMetrics(state));
    expect(buildLegacyV1ProjectOutputs(state)).toEqual(buildReferenceOutputs(state));
  });

  it("behält den historischen 4×2-Layoutvertrag des Gebäude-Presets bei", () => {
    const preset = presetsFixture[0];

    expect(preset).toBeDefined();
    if (preset === undefined) throw new Error("V1-Preset-Fixture fehlt.");

    const state = mergeLegacyV1State(preset.state);
    expect(getLegacyV1ResolvedMetrics(state)).toEqual({
      frame: 256,
      columns: 4,
      rows: 2,
      canvasWidth: 1024,
      canvasHeight: 512,
      directionCount: 1
    });
    expect(getLegacyV1ResolvedMetrics(state)).toEqual(getReferenceMetrics(state));
    expect(buildLegacyV1ProjectOutputs(state)).toEqual(buildReferenceOutputs(state));
  });

  it("portiert Validierung und Whitelist-Merge ohne unbekannte Importfelder", () => {
    const invalidState = {
      ...LEGACY_V1_DEFAULT_STATE,
      outputMode: "directional8",
      sheetLayout: "2x2"
    } as const;
    const validation = validateLegacyV1State(invalidState);

    expect(validation).toEqual(validateReferenceState(invalidState));
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(
      "Das gewählte Sheet-Layout bietet nur 4 Frames, benötigt werden 8."
    );

    const merged = mergeLegacyV1State({ projectName: "Test", unknownField: "ignored" });
    expect(merged.projectName).toBe("Test");
    expect(merged).not.toHaveProperty("unknownField");
  });
});
