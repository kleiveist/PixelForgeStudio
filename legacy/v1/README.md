# Pixelart Prompt Studio V1 — frozen migration source

Dieser Ordner enthält die vor Prompt 01 inventarisierte Vanilla-JavaScript-V1.
Sie bleibt als ausführbare Referenz für Promptregeln, Storage-Formate, Presets,
Migrationsfixtures und Regressionstests erhalten. Neue Produktfunktionen gehören
nicht hierher.

Vom Repository-Root aus:

```bash
npm run check:legacy
npm run test:legacy
npm run dev:legacy
npm run build:legacy
```

Die reproduzierbare Bestandsaufnahme steht in
`docs/LEGACY-V1-BASELINE.md`. Der Legacy-Build schreibt ausschließlich nach
`legacy/v1/dist/`.
