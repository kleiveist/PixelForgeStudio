import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE } from "../src/js/config/default-state.js";
import {
  buildProjectOutputs,
  getResolvedMetrics,
  mergeState,
  validateState
} from "../src/js/core/prompt-builder.js";

test("Standardkonfiguration erzeugt zwei getrennte englische Stilprofile", () => {
  const outputs = buildProjectOutputs(DEFAULT_STATE);
  assert.equal(outputs.length, 2);
  assert.deepEqual(outputs.map((output) => output.profile), ["classic", "dark"]);
  assert.ok(outputs.every((output) => output.language === "en"));
  assert.notEqual(outputs[0].main, outputs[1].main);
});

test("Standardprompt enthält die verbindliche Kamerasperre und Maßstäbe", () => {
  const [output] = buildProjectOutputs(DEFAULT_STATE);
  assert.match(output.main, /fixed frontal oblique top-down 3\/4 RPG view/i);
  assert.match(output.main, /camera centered exactly south/i);
  assert.match(output.main, /32 × 32px tile grid/i);
  assert.match(output.main, /target character height 80px/i);
  assert.match(output.main, /rotate only the subject/i);
});

test("Acht Richtungen ergeben ein 4×2-Sheet mit 512×256 Pixeln", () => {
  const metrics = getResolvedMetrics(DEFAULT_STATE);
  assert.deepEqual(metrics, {
    frame: 128,
    columns: 4,
    rows: 2,
    canvasWidth: 512,
    canvasHeight: 256,
    directionCount: 8
  });
});

test("Negativprompt schützt Perspektive, Transparenz und Richtungsstabilität", () => {
  const [output] = buildProjectOutputs(DEFAULT_STATE);
  assert.match(output.negative, /isometric view/i);
  assert.match(output.negative, /opaque background/i);
  assert.match(output.negative, /missing direction/i);
  assert.match(output.negative, /direct game names/i);
});

test("Deutsche Einzelausgabe funktioniert", () => {
  const state = {
    ...DEFAULT_STATE,
    promptLanguage: "de",
    profileOutputMode: "selected",
    selectedProfile: "dark"
  };
  const outputs = buildProjectOutputs(state);
  assert.equal(outputs.length, 1);
  assert.equal(outputs[0].language, "de");
  assert.equal(outputs[0].profile, "dark");
  assert.match(outputs[0].combined, /^HAUPTPROMPT/m);
  assert.match(outputs[0].technical, /FIGURENHÖHE/);
});

test("Validierung erkennt ein zu kleines Sheet", () => {
  const result = validateState({
    ...DEFAULT_STATE,
    outputMode: "directional8",
    sheetLayout: "2x2"
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("benötigt werden 8")));
});

test("Unbekannte Importfelder werden beim Zusammenführen verworfen", () => {
  const merged = mergeState({ projectName: "Test", unknownField: "ignored" });
  assert.equal(merged.projectName, "Test");
  assert.equal(Object.prototype.hasOwnProperty.call(merged, "unknownField"), false);
});
