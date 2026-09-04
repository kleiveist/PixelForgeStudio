<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — deterministischer Pixelrenderer

## Verbindliche Rasterkonvention

Der finale Einzelbildrenderer liegt unter `src/domain/animation/renderer.ts`
und importiert weder React noch Canvas. Ein Pixel mit Arrayindex `(x, y)`
belegt die halb offene Zelle `[x, x + 1) × [y, y + 1)`; sein Mittelpunkt ist
damit `(x + 0,5, y + 0,5)`. Für jeden Zielpixel wird dieser Mittelpunkt durch
die inverse affine Matrix in die Quelle abgebildet. Der Quellindex ist
`floor(sourceCoordinate)`. Werte auf einer Zellgrenze gehören dadurch
deterministisch zur rechts beziehungsweise darunter liegenden Zelle.

Matrizengrenzen innerhalb `1e-9` eines ganzzahligen Werts werden vor `ceil`
oder `floor` auf diesen Wert normalisiert. Damit ändern unvermeidbare
Fließkommareste einer 90°-Rotation keine Pixelentscheidung. Placement-Matrizen
aus der Ankerdomain adressieren dagegen ganzzahlige Pixelmittelpunkte; der
Workspace konvertiert sie einmalig mit:

```text
rasterMatrix = T(0,5; 0,5) · placementMatrix · T(-0,5; -0,5)
```

## Nearest Neighbor und Alpha

`blitNearestAffine()` transformiert nur die vier Quellgrenzen, schneidet die
daraus entstehende Ziel-Bounding-Box gegen den Projektframe und iteriert nur
diesen Bereich. Transparente Quellpixel werden übersprungen. Es gibt keine
bilineare Interpolation, Palette, Farbquantisierung oder Canvas-Abtastung.

Source-over verarbeitet Straight-Alpha-RGBA mit ganzzahligen Zwischenwerten.
Jede Division rundet auf den nächsten Integer; ein exakter halber Schritt wird
aufgerundet. So liefern identische validierte Inputs byteidentische
`Uint8ClampedArray`-Frames. Quell- und Zielarrays bleiben unverändert; jeder
öffentliche Renderaufruf liefert eine neue Zieloberfläche.

Strukturierte Diagnostik unterscheidet:

- `fullyOutside`
- `partiallyClipped`
- `emptySource`
- `nonInvertibleMatrix`
- `missingRgbaData`

## Workspace- und Browsergrenze

Der Workspace lädt nur zugewiesene, für die aktive authored Richtung
freigegebene Parts. Original-RGBA wird nach `trimRect` kopiert, über Riganker
platziert und anschließend über den versionierten `DirectionDrawOrder` der
aktiven Zielrichtung aufgelöst. Erst diese bereits sortierte Partliste wird an
`renderFrame()` übergeben. Optionale Slots werden bei Nichtbelegung
übersprungen; projektweite Layer-Deltas bleiben kleine Abweichungen von der
Basisorder. Details stehen in `ANIMATION-LAYER-ORDER.md`.

Ein `RevisionBoundDecodedSourceCache` hält ausschließlich validierte Kopien
dekodierter RGBA-Daten. Sein Schlüssel enthält Part-ID, Blob-ID und
Part-Revision; eine neue Revision verdrängt den vorherigen Eintrag. Der Blob
lebt nur während Repository-Read und Decoderaufruf und wird weder im Cache noch
im ProjectProvider gespeichert.

`putRgbaImageData()` setzt das fertige Ergebnis per `ImageData` und
`putImageData` auf ein Canvas. Der Adapter setzt zusätzlich
`imageSmoothingEnabled = false`; CSS skaliert nur ganzzahlig mit
`image-rendering: pixelated`. Das Canvas ist weder Render- noch Exportquelle.
PNG-Encoding und SpriteSheets bleiben Prompt 48 vorbehalten.
