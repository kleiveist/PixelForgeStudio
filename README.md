# PixelForge Prompt Studio

![PixelForge Prompt Studio logo](public/logo.svg)

Local-first prompt studio for consistent pixel-art production.

**v1.0.0 release candidate** · German / English · local-only data · MIT
See [product identity and versioning](docs/BRANDING.md). Publication is pending
the release checklist; schema and JSON export format remain V2.

<!-- PYGINDEX:README START -->
## Dokumentation
- [Dokumentationsübersicht](docs/index.md)
- [Aufgaben](docs/aufgaben/index.md)
- [Erledigt](docs/erledigt/index.md)

## Projektdateien
- [AGENTS.md — PixelForge Prompt Studio](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [PixelForge Prompt Studio — Arbeitsplan](PLANS.md)
<!-- PYGINDEX:README END -->

PixelForge Prompt Studio ist eine lokale React-Anwendung für konsistente
Pixelart-Prompt-Produktion ohne Backend. Es verwaltet technische
Produktionsprofile, führt durch neun Asset-Kategorien und erzeugt
Hauptprompt, Negativprompt, technische Spezifikation sowie eine kombinierte
Ausgabe.

Profile, Einstellungen und Entwürfe bleiben beim Schema- und Exportvertrag V2
in `localStorage`. Die Anwendung enthält keine Animationsprojekt-, Rig-,
Renderer- oder Engineexport-Funktion mehr.

Repository: [kleiveist/PixelForgeStudio](https://github.com/kleiveist/PixelForgeStudio)

## Schnellstart

Vorausgesetzt werden Node.js 20.19+ beziehungsweise 22.12+ und npm 10+.

```bash
npm ci
npm run dev
```

## Docker Compose

```bash
docker compose up --build -d --wait
```

Öffnen: `http://127.0.0.1:8080`. Siehe [Produktionscontainer](deploy/README.md).
Die Browserdaten bleiben lokal; es gibt kein Server-Datenvolume.

## Einstiegspunkte

| Pfad | Zweck |
|---|---|
| `index.html` | Vite-HTML-Einstieg |
| `src/main.tsx` | React-Bootstrap |
| `src/app/App.tsx` | Provider- und App-Komposition |
| `src/app/StudioShell.tsx` | Prompt-Navigation und gemeinsame App-Shell |
| `src/ARCHITECTURE.md` | Architektur und öffentliche Modulgrenzen |
| `docs/index.md` | Dokumentationsübersicht |

## npm-Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm start` | Entwicklungsserver starten und Browser öffnen |
| `npm run typecheck` | Strict-TypeScript prüfen |
| `npm test` | Vitest im Watch-Modus starten |
| `npm run test:run` | Unit-/Integrationstests einmalig ausführen |
| `npm run test:browser:install` | Chromium und Firefox für Playwright installieren |
| `npm run test:browser` | Release-Smokes in Chromium und Firefox ausführen |
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
