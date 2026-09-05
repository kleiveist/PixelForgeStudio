<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 48 — SpriteSheet-, Einzelbild-, JSON- und .pfanim-Export

**Phase:** F — Export, Integration und Release

```text
ZIEL
Implementiere den neutralen Produktions- und Projektexport. Ein validiertes
8-Richtungs-Walk-Projekt erzeugt ein transparentes 1024×1024-SpriteSheet,
64 Einzelbilder, Metadaten und ein vollständig reimportierbares `.pfanim`.

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
   Prompt 49.

UMSETZUNG
1. Implementiere pure SpriteSheet-Layoutfunktionen:
   - 8 Richtungszeilen in kanonischer Reihenfolge
   - 8 Framespalten
   - FrameRects
   - Sheetgröße
   - optionale Margin/Spacing-Werte mit Default 0
2. Erzeuge aus 64 gerenderten RGBA-Frames eine RGBA-Sheetoberfläche.
3. Implementiere einen Browser-PNG-Encoding-Port:
   - RGBA/`ImageData` auf native Canvas/OffscreenCanvas übertragen
   - PNG-Blob ausgeben
   - keine Skalierung oder Glättung
4. Implementiere neutrales `spriteSheetMetadata`-JSON V1:
   - Application/Format/Kind
   - Projekt/Clip/FPS/Loop
   - Frame-/Sheetgröße
   - FootAnchor
   - Richtungsreihenfolge
   - alle 64 Regionen
5. Implementiere Einzelbildexport mit stabilen Namen:
   `walk_<direction>_<00-07>.png`.
6. Implementiere Exportvalidierung mit harten Fehlern und bestätigbaren
   Warnungen laut Exportspezifikation.
7. Baue ein Exportpanel:
   - SpriteSheet PNG
   - Metadaten JSON
   - Einzelbilder
   - vollständiges Projektbundle
   - Status/Progress/Cancel-Anschluss
8. Implementiere `.pfanim` als ZIP:
   - manifest.json
   - project.json
   - Part-Metadaten
   - Original-PNG-Blobs
   - optionale Preview
9. Füge für ZIP eine kleine begründete Bibliothek hinzu, vorzugsweise die
   aktuelle kompatible `fflate`-Version. Committe `package-lock.json`.
10. Bundleimport:
    - Dateipfad-Sicherheit
    - Größen-/Dateizahllimits
    - Manifest zuerst
    - alles als unknown validieren
    - Referenzgraph vollständig prüfen
    - ID-Konfliktentscheidung
    - erst danach transaktional schreiben
11. Exportiere keine unreferenzierten Blobs.
12. Import eines Bundles erzeugt ein neues oder bewusst ersetztes Projekt und
    öffnet es erst nach erfolgreichem Commit.
13. Verwende Object URLs nur für kontrollierte Downloads und revoke sie.
14. Teste PNG-Pixel über dekodierte RGBA-Daten, nicht über möglicherweise
    encoderabhängige Binärbytes.
15. Ergänze einen Roundtrip:
    Projekt → `.pfanim` → leeres MemoryRepository → semantisch gleiches
    Projekt und pixelgleiche Renderframes.

ARCHITEKTUR- UND DATENREGELN
- neutrale JSON-Metadaten sind Quelle der Wahrheit.
- Sheetlayout ist pure Domainlogik.
- PNG-Encoding verändert keine Pixel.
- Bundlepfade sind relativ und sicher.
- Import schreibt erst nach Gesamtvalidierung.
- Originalbilder bleiben erhalten.
- keine absoluten lokalen Pfade.
- Exportstatus unterscheidet Warnung/Fehler.

TESTS
- 8×8 Layout = 1024×1024 bei 128er Frames
- alle 64 Rects korrekt
- Richtung/Frame-Zellen
- Sheetpixel an Zellgrenzen
- transparente Bereiche
- PNG decode pixelgleich
- stabile Dateinamen
- Hard error blockiert
- Warning confirmation
- `.pfanim`-Manifest
- Zip-Slip-/`..`-Pfad abgelehnt
- Größen-/Dateilimit
- fehlender Blob
- ID-Konflikt
- atomarer Import
- Projektbundle-Roundtrip
- Object-URL-Cleanup

NICHT TUN
- noch kein Godot-spezifischer Export
- keine Base64-Projektdateien
- keine absoluten Pfade
- keine unvalidierten ZIP-Einträge schreiben
- keine unreferenzierten Blobs exportieren
- keine Behauptung, dass PNG-Binärbytes browserübergreifend identisch sind
- kein Download bei abgebrochenem/fehlgeschlagenem Job

DOKUMENTATION
Dokumentiere Exportdateien, Layout, Bundleinhalt, Sicherheitslimits und
Roundtrip in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- vollständige neutrale Exportpalette ist nutzbar.
- SpriteSheet, Einzelbilder und JSON stimmen exakt überein.
- `.pfanim` enthält editierbare Originaldaten und ist roundtrip-fähig.
- fehlerhafte Bundles verändern den Workspace nicht.
- Downloads und Ressourcen werden sauber freigegeben.

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

Commit-Vorschlag: 📦 feat: export sprite sheets and project bundles
```
