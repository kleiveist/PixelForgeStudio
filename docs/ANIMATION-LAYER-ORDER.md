<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — richtungsabhängige Ebenenreihenfolge

## Versionierter Vertrag

`src/domain/animation/layerOrder.ts` ist die browser- und frameworkfreie
Quelle der Zeichenreihenfolge. `DirectionDrawOrder.version` ist derzeit `1`.
Jede der acht Zielrichtungen besitzt eine eigene vollständige Liste aller 39
Slots; Renderer und DOM sortieren diese Liste nicht nachträglich.

Die Gruppen laufen grundsätzlich von hinten nach vorn:

1. `rearAccessories` — hinteres Haar, hinterer Umhang, Rückengegenstand
2. `farEquipment` — Ausrüstung der visuell fernen Seite
3. `farLimbs` — fernes Bein und ferner Arm
4. `core` — Becken, Torso und Torsorüstung
5. `nearLimbs` — nahes Bein und naher Arm
6. `head` — Kopf, Gesicht und vordere Kopfelemente
7. `frontEquipment` — vordere Waffen, Schilde und freie Accessoires

Anatomisches Links/Rechts und visuelle Nähe sind getrennte Werte. Ost und
West sowie jede Diagonale definieren ihre Nahseite ausdrücklich; Süd und Nord
sind als `balanced` markiert. Diese Information verändert weder Weltlicht
noch Bildquelle und löst insbesondere keine Spiegelung aus.

## Belegte und optionale Slots

`resolveDirectionDrawOrder()` erhält nur die aktuell belegten Parts. Nicht
belegte optionale Slots werden übersprungen, belegte Slots erscheinen genau
einmal. Pflichtslots bleiben Teil jeder Basisorder und können nicht durch
Ausrüstung ersetzt werden.

Feste optionale Slots besitzen einen kanonischen Default-Attachment-Joint.
Die freien Slots `accessory.1` bis `accessory.4` müssen ihren Joint im
`AnimationPartAsset` ausdrücklich speichern. Ohne gültigen Joint ist das
Projekt nicht produktionsbereit. Freie Accessoires verwenden standardmäßig
`frontEquipment`.

Eine Projektzuweisung darf ein ganzzahliges `layerOffset` von -8 bis +8
speichern. Das Delta verschiebt nur den einzelnen Part relativ zur
versionierten Basisorder; es dupliziert keine vollständige Liste. Der
Part-Inspector zeigt Layergruppe, Basisposition, Position unter belegten
Parts, visuell nahe Seite und eine Bedienung für dieses projektweite Delta.
Per-Frame-Layer-Overrides gehören weiterhin Prompt 46.

## Validierung und Rendering

`validateDrawOrder()` meldet unbekannte oder doppelte Slots, fehlende
Pflichtslots in der Definition, fehlende beziehungsweise unbekannte
Attachment-Joints und ungültige Layer-Deltas. Die Produktionsprüfung ergänzt
doppelt belegte Richtungs-Slots und freie Accessoires ohne Attachment als
Blocker. `prepareNeutralPoseParts()` platziert die Quellen und übergibt sie
danach ausschließlich in der aufgelösten Reihenfolge an `renderFrame()`.

Der Rasterrenderer meldet die transformierte Bounding-Box und die betroffenen
Framekanten `left`, `right`, `top` und `bottom`. Teilweise abgeschnittene
Parts erscheinen im Viewport als Warnung; vollständig außerhalb liegende
Parts als Fehler. Die Diagnose beeinflusst weder Pixel noch Draw-Order.

Synthetische opake Farbfixtures prüfen die Vorder-/Hinterordnung pixelgenau.
Zusätzliche Tests decken alle acht Richtungen, optionale Einfügung, Layer-
Delta, alle vier Framekanten, vollständiges Außerhalb, Inspector und
Richtungswechsel ab.
