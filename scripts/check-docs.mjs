import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, relative, extname } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const excluded = new Set([".git", "node_modules", "dist", "release", "test-results", "playwright-report", "coverage", ".vite"]);
function documents(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return excluded.has(entry.name) ? [] : documents(path);
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  });
}
function anchors(source) {
  const seen = new Map();
  return [...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
    const base = match[1].toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  });
}
const errors = [];
let checked = 0;
for (const file of documents(root)) {
  const source = readFileSync(file, "utf8").replace(/^```[\s\S]*?^```/gm, "");
  if (/PYGINDEX|PyGitIndex|(?:docs\/)?erledigt\/|(?:docs\/)?aufgaben\//.test(source))
    errors.push(`${relative(root, file)}: retired documentation reference`);
  for (const match of source.matchAll(/!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)) {
    const url = match[1] ?? match[2];
    if (/^[a-z][a-z\d+.-]*:/i.test(url)) continue;
    const [path, fragment] = decodeURIComponent(url).split("#");
    const target = path ? resolve(dirname(file), path) : file;
    checked++;
    if (!existsSync(target)) errors.push(`${relative(root, file)}: missing ${url}`);
    else if (fragment && statSync(target).isFile() && extname(target) === ".md" && !anchors(readFileSync(target, "utf8")).includes(fragment))
      errors.push(`${relative(root, file)}: missing heading ${url}`);
  }
}
for (const error of errors) console.error(error);
assert.equal(errors.length, 0, "documentation links and current sources must be valid");
console.log(`Documentation check passed: ${checked} local links; no retired indexes or archive references.`);
