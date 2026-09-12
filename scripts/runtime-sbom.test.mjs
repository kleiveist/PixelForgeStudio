import assert from "node:assert/strict";
import test from "node:test";
import { assertRuntimeSbom, selectRuntimeSbom } from "./runtime-sbom.mjs";

const lock = { lockfileVersion: 3, packages: {
  "": { dependencies: { react: "1.0.0" } },
  "node_modules/react": { version: "1.0.0" },
  "node_modules/scheduler": { version: "1.0.0", devOptional: true },
  "node_modules/test-tools": { version: "1.0.0", dev: true }
} };
const full = {
  metadata: { component: { "bom-ref": "studio@1.0.0" } },
  components: ["react@1.0.0", "scheduler@1.0.0", "test-tools@1.0.0"].map((ref) => ({ "bom-ref": ref })),
  dependencies: [
    { ref: "studio@1.0.0", dependsOn: ["react@1.0.0", "test-tools@1.0.0"] },
    { ref: "react@1.0.0", dependsOn: ["scheduler@1.0.0"] },
    { ref: "scheduler@1.0.0", dependsOn: [] },
    { ref: "test-tools@1.0.0", dependsOn: ["react@1.0.0"] }
  ]
};

test("retains runtime packages also reached through development dependencies", () => {
  const result = selectRuntimeSbom(full, lock);
  assert.deepEqual(result.components.map((c) => c["bom-ref"]), ["react@1.0.0", "scheduler@1.0.0"]);
  assert.deepEqual(result.dependencies[0].dependsOn, ["react@1.0.0"]);
  assert.equal(full.components.length, 3);
});

test("rejects npm inventories that silently omit a runtime package", () => {
  assert.throws(() => selectRuntimeSbom({ ...full, components: full.components.slice(1) }, lock), /every locked production dependency/);
});

test("rejects broken dependency edges even when all package names are present", () => {
  const result = selectRuntimeSbom(full, lock);
  result.dependencies[0].dependsOn = [];
  assert.throws(() => assertRuntimeSbom(result, lock), /omits a direct runtime dependency/);
  result.dependencies[0].dependsOn = ["not-in-the-inventory@1.0.0"];
  assert.throws(() => assertRuntimeSbom(result, lock), /dangling dependency/);
});
