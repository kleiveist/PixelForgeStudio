# PixelForge Prompt Studio V2

<!-- PYGINDEX:README START -->
## Dokumentation
- [Dokumentationsübersicht](docs/index.md)
- [Aufgaben](docs/aufgaben/index.md)
- [Erledigt](docs/erledigt/index.md)

## Projektdateien
- [AGENTS.md — PixelForge Prompt Studio V2](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [PixelForge Studio — Arbeitsplan](PLANS.md)
<!-- PYGINDEX:README END -->

PixelForge Prompt Studio ist eine lokale React-Anwendung zur strukturierten
Erstellung konsistenter Pixelart-Prompts. Profile, Entwürfe und Einstellungen
bleiben im Browser und können als JSON importiert oder exportiert werden; ein
Backend ist nicht erforderlich.

## Schnellstart

Vorausgesetzt werden Node.js 20.19+ beziehungsweise 22.12+ und npm 10+.

```bash
npm install
npm run dev
```

Vite zeigt anschließend die lokale Entwicklungsadresse im Terminal an.

## Einstiegspunkte

| Pfad | Zweck |
|---|---|
| `index.html` | HTML-Einstieg für Vite |
| `src/main.tsx` | React-Bootstrap und Browser-Initialisierung |
| `src/app/App.tsx` | zentrale Anwendungsoberfläche |
| `src/ARCHITECTURE.md` | öffentliche Modulgrenzen |
| `docs/index.md` | vollständige Dokumentationsübersicht |

## npm-Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm start` | Entwicklungsserver starten und Browser öffnen |
| `npm run typecheck` | Strict-TypeScript prüfen |
| `npm test` | Vitest im Watch-Modus starten |
| `npm run test:run` | Tests einmalig ausführen |
| `npm run build` | Typecheck und Produktionsbuild ausführen |
| `npm run preview` | Produktionsbuild lokal anzeigen |
| `npm run verify` | Typecheck, Tests und Build vollständig ausführen |

## Dokumentationsindex

Die Navigation in dieser README und unter `docs/` wird mit **PyGitIndex**
erzeugt. Inhalte zwischen `PYGINDEX`-Markern nicht manuell pflegen.

```bash
PyGitIndex --root .
PyGitIndex --root . --check
```

## Lizenz

MIT, siehe `LICENSE`.
