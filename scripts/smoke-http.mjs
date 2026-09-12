import assert from "node:assert/strict";

const base = process.env.PIXELFORGE_TEST_URL ?? "http://127.0.0.1:8080";
const health = await fetch(`${base}/healthz`);
assert.equal(health.status, 200);
assert.equal((await health.text()).trim(), "ok");
for (const view of ["dashboard", "profiles", "wizard", "output", "settings"]) {
  const response = await fetch(`${base}/?studio=prompt&view=${view}`);
  assert.equal(response.status, 200, view);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-cache");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(await response.text(), /PixelForge Prompt Studio/);
}
const html = await (await fetch(base)).text();
const asset = html.match(/src="\.\/(assets\/[^" ]+\.js)"/)?.[1];
assert.ok(asset, "built JavaScript entry");
const response = await fetch(`${base}/${asset}`);
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type"), /javascript/);
assert.match(response.headers.get("cache-control"), /immutable/);
assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
assert.match(await (await fetch(`${base}/legacy-route`)).text(), /PixelForge Prompt Studio/);
console.log("HTTP smoke passed: health, five routes, fallback, MIME, CSP and cache policy.");
