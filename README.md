# PixelForge Studio 3.0

<!-- PYGINDEX:README START -->
## Dokumentation
- [Dokumentationsübersicht](docs/index.md)
- [Aufgaben](docs/aufgaben/index.md)
- [Erledigt](docs/erledigt/index.md)

## Projektdateien
- [AGENTS.md — PixelForge Studio](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [PixelForge Studio — Arbeitsplan](PLANS.md)
<!-- PYGINDEX:README END -->

PixelForge Studio ist eine lokale React-Anwendung für konsistente
Pixelart-Produktion ohne Backend. Das **Prompt Studio** verwaltet Profile,
führt durch die Asset-Erstellung und erzeugt Prompt-Pakete. Das **Animation
Studio** baut aus validierten PNG-Teilen einen `humanoid-80-v1`, erzeugt den
Walk mit acht Richtungen und exportiert SpriteSheets, `.pfanim`-Projektbundles
und Godot-4-Pakete.

Prompt-Daten bleiben beim Schema- und Exportvertrag V2 in `localStorage`;
Animationsdaten verwenden das getrennte Format V1 in IndexedDB. Details und
Release-Nachweise stehen in der
[V3-Release-Abnahme](docs/PIXELFORGE-STUDIO-V3-RELEASE-ACCEPTANCE.md).

Repository: [kleiveist/PixelForgeStudio](https://github.com/kleiveist/PixelForgeStudio)

## Schnellstart

Vorausgesetzt werden Node.js 20.19+ beziehungsweise 22.12+ und npm 10+.

```bash
npm install
npm run dev
```

## Einstiegspunkte

| Pfad | Zweck |
|---|---|
| `index.html` | Vite-HTML-Einstieg |
| `src/main.tsx` | React-Bootstrap |
| `src/app/App.tsx` | Provider- und App-Komposition |
| `src/app/StudioShell.tsx` | Dachnavigation und Modulzuordnung |
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
