import assert from "node:assert/strict";

export function runtimeRefs(lock) {
  assert(lock.lockfileVersion >= 2 && lock.packages, "A modern npm lockfile is required");
  return [...new Set(Object.entries(lock.packages)
    .filter(([path, pkg]) => path && !pkg.dev)
    .map(([path, pkg]) => `${pkg.name ?? path.split("node_modules/").at(-1)}@${pkg.version}`))].sort();
}

export function assertRuntimeSbom(sbom, lock) {
  const expected = runtimeRefs(lock);
  assert.deepEqual(sbom.components.map((component) => component["bom-ref"]).sort(), expected, "SBOM must contain every locked production dependency exactly once");
  const root = sbom.metadata.component["bom-ref"];
  const refs = new Set([root, ...expected]);
  assert.deepEqual(sbom.dependencies.map((node) => node.ref).sort(), [...refs].sort(), "SBOM dependency graph must describe every component");
  for (const node of sbom.dependencies) assert(node.dependsOn.every((ref) => refs.has(ref)), "SBOM contains a dangling dependency");
  const direct = Object.keys(lock.packages[""].dependencies ?? {}).map((name) => {
    const pkg = lock.packages[`node_modules/${name}`];
    assert(pkg, `Missing locked dependency ${name}`);
    return `${name}@${pkg.version}`;
  });
  const rootNode = sbom.dependencies.find((node) => node.ref === root);
  assert(direct.every((ref) => rootNode.dependsOn.includes(ref)), "SBOM root omits a direct runtime dependency");
}

export function selectRuntimeSbom(full, lock) {
  const refs = new Set([full.metadata.component["bom-ref"], ...runtimeRefs(lock)]);
  const selected = {
    ...full,
    components: full.components.filter((component) => refs.has(component["bom-ref"])),
    dependencies: full.dependencies.filter((node) => refs.has(node.ref)).map((node) => ({
      ...node, dependsOn: node.dependsOn.filter((ref) => refs.has(ref))
    }))
  };
  assertRuntimeSbom(selected, lock);
  return selected;
}
