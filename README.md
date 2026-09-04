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
Pixelart-Prompts. Eine produktive Studio-Startseite bündelt den letzten
Prompt-Entwurf, zuletzt verwendete Profile, zuletzt bearbeitete
Animationsprojekte und den Einstieg in beide Module. Das **PixelForge
Animation Studio** verwaltet lokale Projekte vollständig, importiert
validierte PNG-Körperteile und zeigt das versionierte Humanoid-80-Rig in fünf
eigenen Neutralposen; Ankerplatzierung und Rendering folgen in den offenen
Phasen. Profile, Entwürfe,
Einstellungen und Animationsprojekte bleiben im Browser; ein Backend ist nicht
erforderlich.

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
- Die Startseite bietet gleichwertige Einstiege in beide Module, vorhandene
  Prompt-Zusammenfassungen und echte zuletzt bearbeitete Animationsprojekte.
- Der globale Umschalter wechselt per URL zwischen Prompt Studio und Animation
  Studio; Theme, Skip-Link und Fokusführung gelten für beide Module.
- Prompt Studio enthält Dashboard, Profile, Wizard, Prüfung, Ausgabe und
  Einstellungen. Dort lassen sich Dach-, Prompt- und Animationsstart getrennt
  festlegen. Animation Studio kann Projekte anlegen, suchen, öffnen,
  umbenennen, duplizieren und bestätigt löschen. Der lokale IndexedDB-
  Speicher arbeitet über Autosave; der Workspace prüft PNGs, zeigt Alpha-Trim
  und Richtungs-Coverage und speichert bestätigte Parts mit ausstehenden
  Ankern. Das Built-in-Rig `humanoid-80-v1` zeigt Bones, Joints, Groundline und
  Pflichtslotbindungen als SVG; Character Kits und Partplatzierung bleiben bis
  zu ihren jeweiligen Fachphasen klar markiert.

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
