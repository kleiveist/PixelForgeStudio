import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = normalize(fileURLToPath(new URL("..", import.meta.url)));
const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
const port = Number.parseInt(portArgument?.split("=")[1] ?? process.env.PORT ?? "4173", 10);
const shouldOpen = process.argv.includes("--open");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function safeFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const candidate = normalize(join(root, requested));
  const relation = relative(root, candidate);
  if (relation.startsWith("..") || relation.includes(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    return null;
  }
  return candidate;
}

function openBrowser(url) {
  const commands = {
    darwin: ["open", [url]],
    win32: ["cmd", ["/c", "start", "", url]],
    linux: ["xdg-open", [url]]
  };
  const [command, args] = commands[process.platform] ?? commands.linux;
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

const server = createServer((request, response) => {
  let filePath = safeFilePath(request.url ?? "/");
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const mime = mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": mime,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  createReadStream(filePath).pipe(response);
});

server.on("error", (error) => {
  console.error(`Server konnte nicht gestartet werden: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Pixelart Prompt Studio läuft unter ${url}`);
  console.log("Beenden mit Strg+C");
  if (shouldOpen) openBrowser(url);
});
