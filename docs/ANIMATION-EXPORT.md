<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — neutraler Produktions- und Projekt-Export

Der neutrale Export ist im Animation Workspace verfügbar, sobald der aktive
Walk-Clip als vollständiger Satz aus acht Richtungen mit jeweils acht Frames
gerendert wurde. Harte Fehler sperren alle Ausgaben. Warnungen – etwa opake
Pixel am Frame-Außenrand – müssen vor dem Export ausdrücklich bestätigt
werden.

## Exportdateien

Für ein Projekt „Kleif Wache“ entstehen stabil normalisierte Namen:

| Auswahl | Datei | Inhalt |
|---|---|---|
| SpriteSheet PNG | `kleif-wache_walk.png` | native RGBA-Pixel des 8×8-Sheets |
| Metadaten JSON | `kleif-wache_walk.json` | neutraler `spriteSheetMetadata`-V1-Vertrag |
| 64 Einzelbilder | `kleif-wache_frames.zip` | `frames/walk_<direction>_<00-07>.png` plus Metadaten |
| Projektbundle | `kleif-wache.pfanim` | vollständig editierbares Projekt mit Originalbildern |

Bei 128×128 px großen Frames besitzt das Standard-Sheet acht Spalten, acht
Zeilen und 1024×1024 px. Die Zeilen folgen ausschließlich der kanonischen
Reihenfolge `south`, `southEast`, `east`, `northEast`, `north`, `northWest`,
`west`, `southWest`; die Spalten sind Frame 0 bis 7. Margin und Spacing sind
standardmäßig null. Abweichende explizite Werte werden sowohl in die Rects als
auch in die Sheetgröße eingerechnet und bleiben transparent.

Der Browser-PNG-Adapter übernimmt fertige RGBA-Bytes per `ImageData` ohne
Skalierung und mit deaktivierter Glättung. PNG-Binärbytes müssen zwischen
Encodern nicht identisch sein; Tests vergleichen nach dem Dekodieren die
Pixelwerte.

## Neutrale Metadaten

`spriteSheetMetadata` V1 enthält den stabilen Application-Identifier,
Formatversion und Kind, Projekt- und Clip-ID, Projektname, Action, FPS, Loop,
Frame-/Sheetgröße, Margin/Spacing, FootAnchor, Richtungsreihenfolge und alle 64
Regionen. Das JSON ist die Quelle der Wahrheit für engine-spezifische Adapter.

## `.pfanim`-Inhalt

Ein Bundle ist ein ZIP mit ausschließlich relativen, aus Stable IDs
abgeleiteten Pfaden:

```text
manifest.json
project.json
parts/<assetId>.json
blobs/<blobId>.png
preview/<previewId>.png   # nur bei vorhandener Projektreferenz
```

Exportiert werden nur PartAssets aus `project.parts`, deren Original-PNGs und
die optionale Projektpreview. Bibliotheksobjekte und unreferenzierte Blobs
werden nicht beigelegt. Das Bundle enthält weder Base64-Bildfelder noch lokale
Dateisystempfade oder Object URLs.

## Sicher importieren

Der Import prüft vor dem ersten Write:

1. höchstens 2048 Dateien und höchstens 256 MiB entpackte Daten bereits an den
   ZIP-Dateiheadern;
2. keine absoluten Pfade, Backslashes, Steuerzeichen, leeren Segmente, `.` oder
   `..`;
3. zuerst `manifest.json` mit Application, Format V1 und festem
   `project.json`-Pfad;
4. jedes JSON zunächst als `unknown` gegen sein striktes Zod-Schema;
5. den vollständigen Projekt→PartAsset→Blob-/Preview-Referenzgraph;
6. PNG-Signaturen, fehlende sowie unerwartete Dateien;
7. vorhandene IDs und eine sichtbare Entscheidung zwischen Abbruch und
   Ersetzen.

Erst danach schreibt das Repository Projekt, PartAssets, Originalbilder und
Preview in einer gemeinsamen Memory- beziehungsweise IndexedDB-Transaktion.
Der Workspace wird erst nach erfolgreichem Commit geöffnet. Ein Fehler oder
Abbruch lässt den bestehenden Arbeitsbereich unverändert.

Downloads verwenden eine Object URL nur für den synchron ausgelösten Klick
und widerrufen sie auch bei einem Browserfehler im `finally`-Pfad. Ein
abgebrochener Job löst keinen Download aus.

## Roundtrip

Der automatisierte Rundlauf exportiert ein Projekt in `.pfanim`, importiert es
in ein leeres MemoryRepository und vergleicht die semantischen
Projektmetadaten, Original-PNG-Daten und daraus dekodierten RGBA-Pixel. Damit
bleibt das Bundle ein editierbarer Austauschvertrag und nicht bloß ein
fertiges SpriteSheet.
