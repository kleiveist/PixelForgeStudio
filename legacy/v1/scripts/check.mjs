import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_STATE } from "../src/js/config/default-state.js";
import { FORM_SECTIONS } from "../src/js/config/form-schema.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const rootsToCheck = [join(root, "src"), join(root, "scripts"), join(root, "tests")];

async function collectJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScript(target)));
    } else if ([".js", ".mjs"].includes(extname(entry.name))) {
      files.push(target);
    }
  }
  return files;
}

const files = (await Promise.all(rootsToCheck.map(collectJavaScript))).flat();
for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
}

const schemaKeys = FORM_SECTIONS.flatMap((section) => section.fields.map((field) => field.key));
const duplicateKeys = schemaKeys.filter((key, index) => schemaKeys.indexOf(key) !== index);
if (duplicateKeys.length) {
  throw new Error(`Doppelte Formularfelder: ${[...new Set(duplicateKeys)].join(", ")}`);
}

const missingDefaults = schemaKeys.filter((key) => !Object.prototype.hasOwnProperty.call(DEFAULT_STATE, key));
if (missingDefaults.length) {
  throw new Error(`Standardwerte fehlen: ${missingDefaults.join(", ")}`);
}

const unusedDefaults = Object.keys(DEFAULT_STATE).filter(
  (key) => key !== "schemaVersion" && !schemaKeys.includes(key)
);
if (unusedDefaults.length) {
  throw new Error(`Standardwerte ohne Formularfeld: ${unusedDefaults.join(", ")}`);
}

console.log(`${files.length} JavaScript-Dateien syntaktisch geprüft.`);
console.log(`${schemaKeys.length} Formularfelder sind eindeutig und vollständig konfiguriert.`);
