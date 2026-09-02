import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE } from "../src/js/config/default-state.js";
import {
  buildProjectOutputs,
  getResolvedMetrics,
  mergeState
} from "../src/js/core/prompt-builder.js";

const fixtureUrl = (name) => new URL(`./fixtures/v1/${name}`, import.meta.url);
const readFixture = async (name) => JSON.parse(await readFile(fixtureUrl(name), "utf8"));
const stateKeys = Object.keys(DEFAULT_STATE).sort();
const outputFields = ["main", "negative", "technical", "combined"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("synthetisches V1-Autosave bildet einen vollständigen Directional-Character ab", async () => {
  const autosave = await readFixture("autosave-directional-character.json");

  assert.equal(autosave.savedAt, "2026-01-15T12:00:00.000Z");
  assert.deepEqual(Object.keys(autosave.state).sort(), stateKeys);

  const state = mergeState(autosave.state);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.assetType, "hero");
  assert.equal(state.outputMode, "directional8");
  assert.deepEqual(getResolvedMetrics(state), {
    frame: 128,
    columns: 4,
    rows: 2,
    canvasWidth: 512,
    canvasHeight: 256,
    directionCount: 8
  });
  assert.deepEqual(buildProjectOutputs(state).map(({ id }) => id), ["classic-en", "dark-en"]);
});

test("synthetischer V1-Preset bildet den unveränderten Storage-Vertrag ab", async () => {
  const presets = await readFixture("presets-storage.json");

  assert.equal(presets.length, 1);
  assert.equal(presets[0].name, "Synthetic Workshop · Single");
  assert.deepEqual(Object.keys(presets[0].state).sort(), stateKeys);

  const state = mergeState(presets[0].state);
  assert.equal(state.assetType, "building");
  assert.equal(state.outputMode, "single");
  assert.equal(state.sheetLayout, "4x2");
  assert.deepEqual(getResolvedMetrics(state), {
    frame: 256,
    columns: 4,
    rows: 2,
    canvasWidth: 1024,
    canvasHeight: 512,
    directionCount: 1
  });
});

test("V1-Standardausgaben stimmen mit der aufgezeichneten Signatur überein", async () => {
  const fixture = await readFixture("default-output-signatures.json");
  const outputs = buildProjectOutputs(DEFAULT_STATE);

  assert.equal(fixture.algorithm, "sha256");
  assert.deepEqual(getResolvedMetrics(DEFAULT_STATE), fixture.metrics);
  assert.deepEqual(
    outputs.map((output) => ({
      id: output.id,
      profile: output.profile,
      language: output.language,
      lengths: Object.fromEntries(outputFields.map((field) => [field, output[field].length])),
      sha256: Object.fromEntries(outputFields.map((field) => [field, sha256(output[field])]))
    })),
    fixture.outputs
  );
});
