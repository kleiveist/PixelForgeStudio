import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { selectRuntimeSbom } from "./runtime-sbom.mjs";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
assert(process.env.ALLOW_DIRTY_RELEASE === "1" || git("status", "--porcelain") === "", "Release requires a clean checkout (ALLOW_DIRTY_RELEASE=1 is for local tests only).");
const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
assert.match(version, /^\d+\.\d+\.\d+$/);
const revision = git("rev-parse", "HEAD");
const epoch = git("show", "-s", "--format=%ct", "HEAD");
const timestamp = new Date(Number(epoch) * 1000).toISOString();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const output = resolve(root, "release");
mkdirSync(output, { recursive: true });
const staging = mkdtempSync(resolve(output, ".site-"));
const metadata = `${JSON.stringify({ name: "PixelForge Prompt Studio", version, revision, timestamp, schemaVersion: 2, formatVersion: 2 }, null, 2)}\n`;
const files = ["LICENSE", "THIRD_PARTY_NOTICES.md", "release.json", "sbom.cdx.json", `pixelforge-prompt-studio-${version}.tar.gz`];
try {
  cpSync(resolve(root, "dist"), staging, { recursive: true });
  for (const filename of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) {
    cpSync(resolve(root, filename), resolve(staging, filename));
    cpSync(resolve(root, filename), resolve(output, filename));
  }
  writeFileSync(resolve(staging, "release.json"), metadata);
  writeFileSync(resolve(output, "release.json"), metadata);
  const tar = execFileSync("tar", ["--sort=name", `--mtime=@${epoch}`, "--owner=0", "--group=0", "--numeric-owner", "--format=gnu", "-cf", "-", "-C", staging, "."], { maxBuffer: 32 * 1024 * 1024 });
  writeFileSync(resolve(output, `pixelforge-prompt-studio-${version}.tar.gz`), gzipSync(tar, { level: 9 }));
  // npm's --omit=dev SBOM traversal can lose runtime packages that are also
  // reached through development dependencies. Select from the full inventory
  // using production flags in the committed lockfile, then verify completeness.
  const fullSbom = JSON.parse(execFileSync("npm", ["sbom", "--sbom-format=cyclonedx"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }));
  const sbom = selectRuntimeSbom(fullSbom, JSON.parse(readFileSync("package-lock.json", "utf8")));
  const id = hash(revision).slice(0, 32);
  sbom.serialNumber = `urn:uuid:${id.slice(0, 8)}-${id.slice(8, 12)}-5${id.slice(13, 16)}-a${id.slice(17, 20)}-${id.slice(20)}`;
  sbom.metadata.timestamp = timestamp;
  sbom.metadata.component.name = name; // npm otherwise uses the local checkout directory's name.
  writeFileSync(resolve(output, "sbom.cdx.json"), `${JSON.stringify(sbom, null, 2)}\n`);
  writeFileSync(resolve(output, "SHA256SUMS"), files.sort().map((file) => `${hash(readFileSync(resolve(output, file)))}  ${file}\n`).join(""));
} finally {
  rmSync(staging, { recursive: true }); // Only the unique staging directory created above.
}
console.log(`Packaged ${version} from ${revision} in release/.`);
