<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 40 — Deterministischer nearest-neighbor Software-Rasterizer

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Implementiere den finalen pixelgenauen Frame-Renderer als pure
TypeScript-Domainlogik. Transformierte Körperteile dürfen keine
browserabhängige Glättung oder unerwarteten Zwischenfarben erzeugen.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 41.

UMSETZUNG
1. Definiere immutable Rastertypen:
   - `RgbaImage`
   - `RasterSurface`
   - `RenderablePart`
   - `RenderedFrame`
   - strukturierte Renderdiagnostik
2. Implementiere validierte Surface-Erzeugung für transparente RGBA-Frames.
3. Implementiere eine inverse affine nearest-neighbor Blit-Funktion:
   - transformierte Ziel-Bounding-Box bestimmen
   - Zielpixelzentrum durch inverse Matrix in Quellkoordinaten abbilden
   - nächstgelegenen Quellpixel wählen
   - außerhalb transparent
4. Implementiere deterministisches Source-over-Alpha-Compositing mit klarer
   Rundungsregel. Keine Fließkommadifferenz darf je Browser andere
   RGBA-Ergebnisse erzeugen.
5. Implementiere:
   - `blitNearestAffine`
   - `compositeSourceOver`
   - `renderPart`
   - `renderFrame`
6. `renderFrame` akzeptiert bereits aufgelöste Parts in Draw-Order und erzeugt
   einen transparenten Frame in Projektgröße.
7. Ergänze Diagnostik:
   - vollständig außerhalb
   - teilweise geclippt
   - leere Quelle
   - nicht invertierbare Matrix
   - fehlende RGBA-Daten
8. Optimierung darf die Semantik nicht ändern:
   - nur transformierte Bounds iterieren
   - transparente Quellpixel überspringen
   - keine globale Mutation von Sourcearrays
9. Implementiere einen Browser-Anzeigeadapter:
   - fertiges RGBA via `ImageData`/`putImageData` anzeigen
   - Canvas-CSS für pixelgenauen Zoom
   - `imageSmoothingEnabled = false` zusätzlich setzen
10. Der Anzeigeadapter ist nicht Exportquelle; der Software-Rasterizer bleibt
    maßgeblich.
11. Integriere den Renderer in die Part-/Neutralpose-Vorschau des Workspace.
12. Führe einen revisionsgebundenen Cache für dekodierte Quellen ein, ohne
    Blobs im ProjectProvider zu halten.
13. Dokumentiere explizit die Pixelzentrum- und Rundungskonvention.

ARCHITEKTUR- UND DATENREGELN
- Renderer importiert weder React noch Canvas-DOM.
- Source- und Zielarrays werden nicht unerwartet mutiert.
- affine Matrix muss validiert/invertierbar sein.
- nearest-neighbor ist verbindlich.
- keine Farbquantisierung.
- transparente Zieloberfläche als Default.
- identische validierte Inputs ergeben identische RGBA-Pixel.
- PNG-Encoding folgt erst in Prompt 48.

TESTS
- 1×1 Translation
- 2×2 Uniform Scale
- horizontale Spiegelung
- 90°-Rotation
- kombinierte Translate/Rotate/Scale-Matrix
- transparente Pixel
- Source-over mit opak/halbtransparent
- Layerreihenfolge
- Clipping
- nicht invertierbare Matrix
- leere Quelle
- keine unerwarteten Zwischenfarben
- Inputarrays unverändert
- deterministische Wiederholung
- Workspace zeigt das gerenderte Partbild

NICHT TUN
- kein `drawImage` als finaler Rasteralgorithmus
- keine bilineare Interpolation
- keine CSS-Transformation als Export
- kein WebGL
- keine Paletteänderung
- noch kein SpriteSheet/PNG-Export
- keine Optimierung ohne Pixelgleichheitstest

DOKUMENTATION
Erweitere `src/ARCHITECTURE.md` um Renderpipeline, Pixelzentrum,
Rundungsregel und Adaptergrenze. Ergänze PLANS.md, CHANGELOG.md und
technische Renderdokumentation.

FERTIG, WENN
- Frame-Rendering erfolgt vollständig über pure, deterministische
  nearest-neighbor Rasterlogik.
- kleine RGBA-Fixtures sind pixelgenau getestet.
- Workspace zeigt das Domain-Renderergebnis.
- Clipping-/Matrixfehler sind sichtbar und strukturiert.
- Browsercanvas ist nur Anzeigeadapter.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧮 feat: add deterministic pixel renderer
```
