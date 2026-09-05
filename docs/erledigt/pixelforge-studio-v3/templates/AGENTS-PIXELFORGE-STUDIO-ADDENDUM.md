<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Vorgeschlagener AGENTS.md-Zusatz — PixelForge Studio V3

> Dieser Text ist als geprüfte Grundlage für Prompt 28/51 gedacht. Er muss an
> den tatsächlichen Repository-Stand angepasst und darf nicht blind doppelt in
> AGENTS.md eingefügt werden.

## Dachprodukt

Dieses Repository enthält **PixelForge Studio** mit zwei Modulen:

1. **PixelForge Prompt Studio** — bestehende Prompt-Produktion mit
   Schema-/Formatversion 2.
2. **PixelForge Animation Studio** — lokale modulare Humanoid-Rigging- und
   SpriteSheet-Produktion mit Animationsschema/-formatversion 1.

## Unveränderliche Kompatibilitätsgrenzen

- `EXPORT_APPLICATION_ID` bleibt `"PixelForge Prompt Studio"`.
- Bestehende `pixelforge:v2:*`-Storage-Keys bleiben erhalten.
- Promptdaten bleiben `schemaVersion: 2`.
- Prompt-Export-Bundles bleiben `formatVersion: 2`.
- Alte `?view=...`-URLs öffnen weiterhin die entsprechende Prompt-View.
- Bestehende V1→V2-Migrationsverträge und Fixtures bleiben aktiv.

## Animationsstack

- TypeScript `strict`
- React als UI
- Zod an Persistenz-/Importgrenzen
- Context + `useReducer`
- native IndexedDB hinter `AnimationRepository`
- Web Worker für vollständige Batchrenders/Packaging
- Canvas nur für Anzeige und PNG-Encoding
- finaler nearest-neighbor Rasterizer als pure TypeScript-Domain
- kein Backend
- kein Python in der Haupt-App

## Animationsregeln

- Standardrig `humanoid-80-v1`
- 128×128 px je Frame
- ungefähr 80 px Figurenhöhe
- Fußanker 64/112
- 8 Richtungen in festem Kanon
- 8 Walk-Frames, 10 FPS
- transparente RGBA-Ausgabe
- fünf gezeichnete Richtungen plus drei kontrollierte Spiegelrichtungen oder
  acht vollständig gezeichnete Richtungen
- keine Erfindung unbekannter Ansichten aus nur einer Frontquelle
- Weltlicht, Kamera und Fußanker bleiben konstant
- Sourceanchors bleiben in Originalbildkoordinaten
- Uniform Scale
- Framekorrekturen nur als Deltas
- keine PNG-Base64-Daten in localStorage oder Projektschemas

## Modulgrenzen

- `domain/animation` importiert kein React, Zod, DOM oder IndexedDB.
- `schemas` validieren JSON-Metadaten, nicht Blobbytes.
- `services/animation` kapselt IndexedDB, Decoder, Export und Godot.
- `store/animation` besitzt Projektstate/History, aber keine Bildblobs.
- `features/animation-*` implementieren UI gegen öffentliche Ports.
- Prompt- und Animationsdomain dürfen nur über explizite Mappingfunktionen
  verbunden werden.

## Qualitätsregeln

- kritische Funktionen nie pointer-only
- keine browserabhängige `drawImage`-Rotation als finale Exportquelle
- RGBA-Pixeltests mit synthetischen Fixtures
- Importdaten immer `unknown`
- `.pfanim` erst nach Gesamtvalidierung schreiben
- Exportwarnungen und harte Fehler unterscheiden
- Workerresultate an Projektrevision binden
- Object URLs und Worker kontrolliert freigeben
- jede Aufgabe endet mit `npm run verify` und `git diff --check`
