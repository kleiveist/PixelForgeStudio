<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Studio 3.0 — Dach-Stack und Modulverträge

## Status und Versionsgrenzen

Dieses Dokument ist der verbindliche technische Dachvertrag für PixelForge
Studio 3.0. Die Produktversion ist von den gespeicherten Datenverträgen
getrennt:

| Bereich | Vertrag | Persistenz |
|---|---|---|
| Prompt Studio | Schema und Exportformat V2 | sechs stabile `pixelforge:v2:*`-Namespaces in `localStorage` |
| Animation Studio | Schema, Manifest und Bundleformat V1 | IndexedDB `pixelforge-studio` plus `.pfanim` |
| Godot-Export | Godot 4 | abgeleitete Dateien; kein Projektzustand |

Die Prompt-Studio-Regeln bleiben in
[`TECHNOLOGIE-STACK-V2.md`](TECHNOLOGIE-STACK-V2.md) und
[`PROMPT-SPECIFICATION.md`](PROMPT-SPECIFICATION.md) verbindlich. Ein
Produktrelease darf diese Versionsnummern, Storage-Keys oder stabilen
Applikations-Identifier nicht still erhöhen oder umbenennen.

## Laufzeit und Werkzeuge

- TypeScript im Strict-Modus
- React 19 als UI-Schicht
- Vite 8 und npm
- React Hook Form und Zod an Formular-/Datengrenzen
- React Context und `useReducer`
- CSS Modules, semantische CSS Custom Properties und lokale SVG-Komponenten
- native IndexedDB und `localStorage` hinter Adaptern
- Web Worker und OffscreenCanvas mit kontrolliertem asynchronem Fallback
- `fflate` für lokale, validierte ZIP-Bundles
- Vitest, React Testing Library und jsdom
- Playwright-Release-Smokes in Chromium und Firefox
- kein Backend und kein Python in der Hauptanwendung

Node.js 20.19+ beziehungsweise 22.12+ und npm 10+ sind erforderlich.

## Architektur

```text
Studio Shell und typisierte Navigation
├── Prompt Studio UI → Prompt-Domain → localStorage-/JSON-Adapter (V2)
└── Animation Studio UI → Animation-Domain → IndexedDB-/Bundle-Adapter (V1)
                                  └── Worker → RGBA/PNG/ZIP/Godot-Ableitungen
```

React komponiert Oberflächen und Ports, besitzt aber nicht die fachlichen
Modelle. Promptauflösung, Rig-/Walk-Mathematik, Layering, Spiegelregeln,
Framekorrekturen, Sheetlayout, Exportprojektion und Migration bleiben pure
TypeScript-Grenzen. Persistierte Werte beginnen als `unknown` und werden vor
Verwendung validiert.

Das Animation Studio rendert 128×128-Nativframes ohne Interpolation. Der
Produktionsvertrag `humanoid-80-v1` besitzt fünf eigenständig definierte
Quellrichtungen; drei westliche Richtungen werden nur nach den dokumentierten
Coverage-, Mirror- und Reviewregeln abgeleitet. Ein kompletter Walk enthält
acht Frames je Richtung und erzeugt ein 1024×1024-SpriteSheet.

## Ressourcen- und Fehlerregeln

- 64-Frame-Rendering, Sheetkomposition, Encoding und Packaging laufen
  inkrementell hinter dem versionierten Workerprotokoll.
- Job-ID, Projekt-ID und Revision verwerfen veraltete Resultate.
- Abbruch erzeugt keinen Teildownload.
- Source- und Frame-Caches sind begrenzt, revisionsgebunden und werden beim
  Projektwechsel freigegeben.
- Object URLs werden nach Preview oder Download immer widerrufen.
- IndexedDB-, Decoder-, Worker- und Exportfehler bleiben strukturiert und
  sichtbar; ein letzter valider In-Memory-Projektstand bleibt erhalten.
- Der Produktionsbuild trennt React, Formulare, Archivcode, Animation und
  Promptfeatures in fachliche Chunks.

## Verifikation

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify
npm run test:browser:install
npm run test:browser
```

Die vollständige Release-Matrix, Umgebungsdaten und verbleibenden manuellen
Prüfungen stehen in der
[`V3-Release-Abnahme`](PIXELFORGE-STUDIO-V3-RELEASE-ACCEPTANCE.md).

## Nicht Bestandteil von 3.0

Weitere Clip- oder Rigfamilien, Tauri, Cloud-Synchronisierung und
KI-Bildanalyse bleiben Roadmap. Sie dürfen nicht als bereits implementiert
oder abgenommen beschrieben werden.
