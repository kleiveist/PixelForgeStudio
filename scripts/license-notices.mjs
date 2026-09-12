import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const paths = execFileSync("npm", ["ls", "--omit=dev", "--all", "--parseable"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter((path) => path !== root);
const notices = paths.map((path) => {
  const pkg = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"));
  const license = readdirSync(path).find((name) => /^licen[sc]e(?:\.(?:md|txt))?$/i.test(name));
  assert.ok(license, `License text required for ${pkg.name}`);
  return { name: pkg.name, version: pkg.version, license: pkg.license, text: readFileSync(resolve(path, license), "utf8").trim() };
}).sort((a, b) => a.name.localeCompare(b.name, "en"));
const output = "# Third-party runtime notices\n\nGenerated from the locked production dependency tree with `node scripts/license-notices.mjs`.\nKeep these notices with redistributed client bundles. Build/test tools retain their own licenses;\ncontainer OS/server licenses and SBOM are separate release artifacts. The project license is [MIT](LICENSE).\n\n" + notices.map((entry) => `## ${entry.name} ${entry.version}\n\nLicense: ${entry.license}\n\n\`\`\`text\n${entry.text}\n\`\`\`\n`).join("\n");
if (process.argv.includes("--check")) {
  assert.equal(readFileSync(resolve(root, "THIRD_PARTY_NOTICES.md"), "utf8"), output, "Regenerate notices after dependency updates");
  console.log(`License notices match ${notices.length} runtime packages.`);
} else {
  process.stdout.write(output);
}
