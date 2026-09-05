<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Character Kits und Ausrüstungsinventar

Character Kits sind lokale, wiederverwendbare Referenzpakete für vollständige
Humanoid-Partsets. Ein Kit ist kein Projektklon: Projekt-Rig, Clips,
Frameprofil und Frame-History bleiben Eigentum des geöffneten Projekts.

## Kitvertrag

Ein validiertes `CharacterKit` mit `schemaVersion: 1` enthält:

- stabile `kitId`, Name, Beschreibung und Zeitstempel,
- `rigTemplateId` und deterministischen `rigCompatibilityKey`,
- `directionSourceMode` und Kit-Default für Spiegelung,
- eindeutige `partAssetIds` als gemeinsam genutzte Referenzen,
- eine kompakte Coverage-Zusammenfassung für authored, mirrored, offene
  Anker, Reviews und verbotene Spiegelungen,
- optional eine bestehende Preview-Referenz.

Ältere V1-Kits ohne Coverage werden als sichtbarer Entwurf gelesen. Die
Detailmatrix wird immer aus den aktuellen PartAssets berechnet; die gespeicherte
Zusammenfassung ist ein Filter- und Vorschau-Read-Model, keine zweite Quelle
der Produktionswahrheit.

## Compatibility Key

Der Key verwendet ausschließlich:

```text
RigTemplateId
+ Framebreite und Framehöhe
+ Charakterhöhe
+ Fußanker des Frameprofils
+ Anchor-/Slot-/Direction-Contract-Version
```

Für das Standardrig lautet er:

```text
humanoid-80-v1__frame-128x128__char-80__foot-64-112__contracts-1-1-1
```

Name, Beschreibung, konkrete Gelenkkoordinaten, Bewegungs-Tuning und
PartAsset-IDs beeinflussen den Key nicht. Ein Kit mit anderem Key oder anderer
Rig-ID wird beim Anwenden hart blockiert; eine bloße Warnung kann diese Grenze
nicht umgehen.

## Bibliothek verwenden

Unter **Animation Studio → Character Kits** kann ein aktives Projekt als Kit
gespeichert werden. Suche, Rigfilter und Coveragefilter arbeiten lokal. Jede
Karte zeigt Preview, Coverage, Mirror-Stand und Kompatibilität, bevor
„Anwenden“ verfügbar wird. Kits lassen sich öffnen, umbenennen, duplizieren
und nach einer ausdrücklichen Bestätigung löschen.

Beim Anwenden werden die PartAsset-Zuweisungen kontrolliert ersetzt.
Unveränderte Referenzen behalten ihre projektweiten Deltas. Rig, Frameprofil
und Clipobjekte werden nicht vom Kit übernommen. Mirror Reviews bleiben nur
erhalten, wenn dieselbe PartAsset- und Source-Revision weiterhin zugewiesen
ist.

Enthält ein bestehender FrameOverride ein Partdelta für einen im neuen Kit
nicht gültig auflösbaren Slot, stoppt der Wechsel. Die Oberfläche zeigt den
Konflikt und bietet zwei Entscheidungen:

1. abbrechen und das Projekt unverändert lassen;
2. ausschließlich die betroffenen Slotdeltas bereinigen und danach anwenden.

Root-, Joint-, andere Part- und Layerkorrekturen bleiben erhalten.

## Ausrüstung im Workspace

Nach Wahl einer Slotkarte zeigt das Teileinventar passende Bibliotheksquellen
für die aktive Richtung beziehungsweise ihre vertragliche Spiegelquelle.
„Einsetzen“ und „Ersetzen“ ändern nur Projektmetadaten. „Entfernen“ löst nur
die Projektzuweisung; das PartAsset bleibt in der lokalen Bibliothek.

Das Inventar umfasst Torsorüstung und Schultern, Handschuhe, Boot-Overlays,
Haare und Kopfbedeckung, Umhang, Waffen, Schilde, Rücken- und Hüftobjekte sowie
vier freie Accessoires. Freie Accessoires werden ohne expliziten
Attachment-Joint abgewiesen und verwenden die Default-LayerGroup
`frontEquipment`. Alle Aktionen sind native Buttons und damit ohne Drag &
Drop per Tastatur erreichbar.

## Blobsharing und Löschen

Projekt und beliebig viele Kits dürfen dieselben PartAsset- und Blob-IDs
referenzieren. Speichern, Duplizieren und Anwenden eines Kits kopiert keine
PNG-Bytes. Das Löschen eines Kits ruft keine Binär-Garbage-Collection auf und
löscht weder PartAssets noch von Projekten verwendete Bild- oder
Preview-Blobs. Der Repository-Adapter bleibt alleiniger Eigentümer der
referenzgeprüften Bereinigung.

## Phase-E-Nachweis

Der Regressionstest erstellt zwei verschiedene NPC-Kits, wendet beide auf ein
Projekt mit demselben `walk-humanoid-8-v1`-Clip an und rendert für jedes Kit
einen gültigen, unterschiedlichen Satz aus 64 Frames in kanonischer
Richtungsreihenfolge.
