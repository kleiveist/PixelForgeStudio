<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Metadatenformat V1

Das PixelForge Animation Studio besitzt seit Prompt 33 ein eigenes, vom
Prompt-Studio-V2-Format unabhängiges Metadatenprotokoll. Alle Importwerte
beginnen als `unknown` und werden über die öffentliche Schemaoberfläche in
`src/schemas/index.ts` validiert.

## Versionen und Objekte

| Objekt | Vertrag |
|---|---|
| Animationsprojekt | `schemaVersion: 1`, `kind: "animationProject"` |
| Körperteilmetadaten | `schemaVersion: 1`, `kind: "animationPartAsset"` |
| Character Kit | `schemaVersion: 1`, `kind: "characterKit"` |
| `.pfanim`-Manifest | `application: "PixelForge Animation Studio"`, `formatVersion: 1`, `kind: "animationProjectBundle"` |

Unbekannte Keys, andere Kinds, neuere Versionen, ungültige IDs und als Strings
gelieferte Zahlen werden abgewiesen. Die Parsefunktionen liefern eine
readonly, zur Laufzeit eingefrorene Zod-Normalform. Das bestehende
Prompt-Studio-Protokoll bleibt bei Schema- und Formatversion 2.

## Projektvertrag

Ein Projekt speichert Name und Zeitstempel, `humanoid-80-v1` samt Frameprofil,
den expliziten Richtungsquellmodus, PartAsset-Referenzen, Clips, adressierte
Frame-Overrides sowie optionale Promptprofil- und Previewreferenzen. V1
erlaubt nur `walk`; jeder Walk-Clip besitzt exakt acht Frames. Ein Override
adressiert genau `clipId + direction + frameIndex`, muss mindestens ein Delta
enthalten und auf einen vorhandenen Clip sowie einen gültigen Frame zeigen.

Ein unvollständiges Projekt bleibt ein gültiger Draft. Die separate Funktion
`validateAnimationProjectProductionSources()` meldet fehlende Pflichtslots je
benötigter Quellrichtung, fehlende PartAsset-Metadaten und fehlende
Distalanker. Schema-Gültigkeit behauptet daher keine Produktionsreife.

## PartAssets und Bilddaten

PartAsset-Metadaten enthalten nur eine stabile `blobId`, niemals Blobbytes,
PNG-Base64 oder Object URLs. Source-Anker beziehen sich auf das ungetrimmte
Originalbild. Jeder Anker muss innerhalb von `sourceSize` liegen; `trimRect`
muss vollständig darin enthalten sein. Bestehende Datensätze ohne
`anchorStatus` werden kompatibel als `ready` gelesen. Ein neu importiertes
Ein neuer PartAsset verwendet `anchorStatus: "anchorsPending"` ohne erfundene
Ankerkoordinaten und bleibt dadurch sichtbar nicht produktionsreif. Ein
gespeicherter, noch unvollständiger Ankerentwurf ist `invalidAnchors`; nur die
slotabhängig vollständige Ein- oder Zweipunktbelegung ist `ready`.

Die Projektzuweisung darf eine enge projektweite `transformDelta`-Korrektur
tragen. Sie bleibt getrennt vom PartAsset und enthält ausschließlich Offset,
Rotationsdelta und einen uniformen Scale-Multiplikator. Die automatisch aus
Rig und SourceAnchors berechnete Grundmatrix wird nicht persistiert.

Binärdaten werden seit Prompt 34 getrennt in IndexedDB gespeichert. Prompt 37
schreibt Original-PNG, PartAsset-Metadaten und die aktualisierte
Projektzuweisung gemeinsam transaktional. Die Schemaoberfläche führt
ausschließlich Metadaten und Referenz-IDs.

## Validierter Bundlegraph

Nach dem späteren sicheren Entpacken wird der Metadatengraph vor einem Write
vollständig aufgelöst:

```text
project.parts[*].assetId → partAssets[*].assetId
partAssets[*].blobId     → blobIds[*]
project.previewBlobId    → blobIds[*]
```

Fehlende oder doppelte Part-/Blob-IDs machen den Graph ungültig. Die aktuelle
Schemaebene verarbeitet keine ZIP-Datei und schreibt nichts; Pfadsicherheit,
Größenprüfung der Binärdateien und atomarer Import folgen in den dafür
vorgesehenen Persistenz- und Exportprompts.

## MVP-Grenzen

- Quelldimension je Achse: höchstens 2048 px
- Parts pro Projekt oder Kit: höchstens 512
- Clips pro Projekt: höchstens 16
- Frame-Overrides pro Projekt: höchstens 10.000
- repräsentierte Dateien im Bundlegraph: höchstens 2048
- einzelne Quelldatei: höchstens 16 MiB (für die spätere Binärgrenze)
- entpacktes Bundle: höchstens 256 MiB (für den späteren Archivimport)

Persistenz, IndexedDB, Canvas, konkrete Posen und Rendering sind nicht Teil
dieses Formatschemas.
