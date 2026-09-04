# PixelForge Studio

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

PixelForge Studio ist eine lokale React-Dachanwendung für Pixelart-Produktion.
Das release-abgenommene **PixelForge Prompt Studio** erstellt konsistente
Pixelart-Prompts. Das **PixelForge Animation Studio** besitzt bereits seine
zugängliche Modulfläche; Projekt-, Rig- und Renderingfunktionen folgen in den
offenen Phasen. Profile, Entwürfe und Einstellungen bleiben im Browser; ein
Backend ist nicht erforderlich.

Repository: [kleiveist/PixelForgeStudio](https://github.com/kleiveist/PixelForgeStudio)

## Schnellstart

Vorausgesetzt werden Node.js 20.19+ beziehungsweise 22.12+ und npm 10+.

```bash
npm install
npm run dev
```

Vite zeigt anschließend die lokale Entwicklungsadresse im Terminal an.

## Oberfläche

- Der Brandlink öffnet die Studio-Startseite.
- Der globale Umschalter wechselt per URL zwischen Prompt Studio und Animation
  Studio; Theme, Skip-Link und Fokusführung gelten für beide Module.
- Prompt Studio enthält Dashboard, Profile, Wizard, Prüfung, Ausgabe und
  Einstellungen. Animation Studio zeigt bis zur jeweiligen Fachphase
  kontrollierte Einstiege für Projekte, Workspace, Character Kits und
  Rig-Vorlagen.

## Einstiegspunkte

| Pfad | Zweck |
|---|---|
| `index.html` | HTML-Einstieg für Vite |
| `src/main.tsx` | React-Bootstrap und Browser-Initialisierung |
| `src/app/App.tsx` | Provider- und Anwendungs-Komposition |
| `src/app/StudioShell.tsx` | globale Dachoberfläche und Modulzuordnung |
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
