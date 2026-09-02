import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "index.html"), join(dist, "index.html"));
await cp(join(root, "src"), join(dist, "src"), { recursive: true });
await cp(join(root, "public"), join(dist, "public"), { recursive: true });
await writeFile(
  join(dist, "BUILD-INFO.txt"),
  [
    "Pixelart Prompt Studio – statischer Build",
    `Erzeugt: ${new Date().toISOString()}`,
    "Zum Starten im Projektordner: npm run dev",
    "Alternativ den dist-Ordner über einen beliebigen statischen Webserver bereitstellen."
  ].join("\n") + "\n",
  "utf8"
);

console.log(`Build erstellt: ${dist}`);
