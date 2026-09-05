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
eigenen Neutralposen. Originalbildanker, reproduzierbare Bone-Platzierung,
Live-Vorschau und projektweite Feinjustierung sind produktiv; der finale
nearest-neighbor Pixelrenderer setzt freigegebene Parts bereits
browserunabhängig zur Neutralpose zusammen. Profile, Entwürfe,
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
- Prompt Studio enthält Dashboard, Profile, Wizard, Ausgabe und Einstellungen.
  Frühere Prüfungs-Links werden kompatibel auf die Ausgabe weitergeführt. Dort
  lassen sich Dach-, Prompt- und Animationsstart getrennt
  festlegen. Animation Studio kann Projekte anlegen, suchen, öffnen,
  umbenennen, duplizieren und bestätigt löschen. Der lokale IndexedDB-
  Speicher arbeitet über Autosave; der Workspace prüft PNGs, zeigt Alpha-Trim
  und Richtungs-Coverage. Im Viewport lassen sich proximale/distale
  Originalanker per Pointer oder Zahlenfeld setzen, korrigieren, zurücksetzen
  und mit einer Live-Bone-Vorschau prüfen. Das Built-in-Rig
  `humanoid-80-v1` zeigt Bones, Joints, Groundline und Pflichtslotbindungen als
  SVG. Der Software-Rasterizer erzeugt den RGBA-Projektframe; das Canvas ist
  ausschließlich eine pixelgenaue Anzeige. Acht versionierte Richtungs-Layer
  ordnen Körperteile und Ausrüstung vor dem Rendern; der Inspector verwaltet
  kleine projektweite Layer-Deltas und der Viewport erklärt Clippingkanten.
  Ein vollständiges Fünf- oder Acht-Richtungs-Partset erzeugt über
  `walk-humanoid-8-v1` exakt 64 reproduzierbare Walk-Frames. Timeline,
  Playback und Onion Skin funktionieren für jede Richtung; eine statische
  Achtfachübersicht erleichtert den Vergleich. Die vollständige
  Slot-mal-acht-Coverage leitet West, Nordwest und Südwest kontrolliert zur
  Renderzeit ab, blockiert verbotene Spiegelungen und verlangt für
  asymmetrische Parts eine ausdrückliche Reviewentscheidung. Details stehen
  unter [Acht-Richtungs-Walk](docs/ANIMATION-EIGHT-DIRECTION-WALK.md).
  Der Frameinspektor legt Root-, Joint-, Part- und Layerkorrekturen als
  rekonstruierbare Deltas ab; Pointer- und Zahlenfeldbearbeitung,
  Frame-/Richtungsreset sowie eine auf 100 Metadatenstände begrenzte
  Undo-/Redo-History sind unter
  [Framekorrekturen und History](docs/ANIMATION-FRAME-CORRECTIONS.md)
  beschrieben. Die lokale Character-Kit-Bibliothek speichert vollständige
  Partsets referenzbasiert, blockiert inkompatible Rigs und verbindet das
  Slotinventar mit Einsetzen, Ersetzen und Entfernen von Ausrüstung. Details:
  [Character Kits und Ausrüstungsinventar](docs/ANIMATION-CHARACTER-KITS.md).
  Der vollständige Walk lässt sich neutral oder als versioniertes Godot-4-ZIP
  exportieren; Paketstruktur und Import stehen unter
  [Godot-4-Export](docs/ANIMATION-GODOT-4-EXPORT.md).

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
