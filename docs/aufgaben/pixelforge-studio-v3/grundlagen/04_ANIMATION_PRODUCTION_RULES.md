<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 04 — Verbindliche Animations- und Pixelart-Produktionsregeln

## 1. Ziel des MVP

Das Animation Studio erzeugt aus modularen, transparenten PNG-Körperteilen
deterministische Laufanimationen. Der erste Produktionsstandard lautet:

```text
Humanoider Charakter
8 Richtungen
8 Walk-Frames je Richtung
10 FPS
128 × 128 px je Frame
ca. 80 px Figurenhöhe
transparenter Hintergrund
```

Das ergibt standardmäßig ein SpriteSheet mit:

```text
8 Spalten × 8 Zeilen
1024 × 1024 px
64 Einzelbildern
```

## 2. Keine erfundenen Ansichten

Aus einer einzigen Frontansicht lassen sich keine zuverlässigen Seiten- und
Rückenansichten rekonstruieren. Das Produkt kennt deshalb drei explizite
Quellmodi:

```ts
type DirectionSourceMode =
  | "singleDirectionPrototype"
  | "fiveAuthoredPlusMirror"
  | "eightAuthored";
```

### `singleDirectionPrototype`

- erlaubt Aufbau, Ankerprüfung und Export einer Richtung
- blockiert einen als produktionsfertig bezeichneten 8-Richtungs-Export
- geeignet für den ersten South-Walk-Test

### `fiveAuthoredPlusMirror`

Originalquellen:

```text
Süd
Südost
Ost
Nordost
Nord
```

Abgeleitete Quellen:

```text
Südwest  ← Spiegelung von Südost
West      ← Spiegelung von Ost
Nordwest  ← Spiegelung von Nordost
```

Asymmetrische Teile müssen Spiegelung ausdrücklich erlauben oder eine eigene
Zielrichtungsquelle erhalten.

### `eightAuthored`

Alle Richtungen besitzen eigene Quellen. Das ist die höchste
Produktionsqualität.

## 3. Richtungskanon

```ts
export const DIRECTION_IDS = [
  "south",
  "southEast",
  "east",
  "northEast",
  "north",
  "northWest",
  "west",
  "southWest"
] as const;
```

Diese Reihenfolge gilt für:

- UI-Auswahl
- SpriteSheet-Zeilen
- JSON-Metadaten
- Godot-Animationsnamen
- Tests
- Exportmanifest

Sie darf nicht implizit nach Alphabet sortiert werden.

## 4. Framekoordinaten

```text
Ursprung: oben links
+x: nach rechts
+y: nach unten
Winkel: Radiant intern, Grad nur in UI
Framefläche: 128 × 128 px
Fuß-/Root-Anker: x=64, y=112
```

Die 80-px-Figur ist ein Produktionsziel, nicht die Zellgröße. Der freie Raum
wird für Schrittweite, Waffen, Haare, Umhang und Bewegung benötigt.

Alle finalen Positionen werden kontrolliert auf Pixelzentren abgebildet. Die
Domain darf intern Fließkommazahlen verwenden; der Rasterer entscheidet
deterministisch, welcher Quellpixel auf welchen Zielpixel fällt.

## 5. Humanoid-Slots

### Pflichtslots des Production Rigs

```text
head
torso
pelvis

arm.left.upper
arm.left.lower
hand.left

arm.right.upper
arm.right.lower
hand.right

leg.left.upper
leg.left.lower
foot.left

leg.right.upper
leg.right.lower
foot.right
```

### Optionale Produktionsslots

```text
hair.back
hair.front
face
headwear

armor.torso
armor.shoulder.left
armor.shoulder.right
glove.left
glove.right
boot.left
boot.right

cape.back
cape.front
back.item
waist.item.left
waist.item.right

weapon.left
weapon.right
shield.left
shield.right

accessory.1
accessory.2
accessory.3
accessory.4
```

Freie Accessoires besitzen zusätzlich einen Attachment-Joint. Pflichtslots
verwenden einen festen Joint-/Bone-Vertrag.

## 6. Gelenke und Bones

Kernjoints:

```text
root
pelvis
chest
neck
head

shoulder.left
elbow.left
wrist.left
hand.left

shoulder.right
elbow.right
wrist.right
hand.right

hip.left
knee.left
ankle.left
toe.left

hip.right
knee.right
ankle.right
toe.right
```

Ein Limb-Part besitzt mindestens:

```ts
interface SourceAnchors {
  readonly proximal: Point;
  readonly distal?: Point;
  readonly pivot?: Point;
}
```

- `proximal`: Befestigung am Elternjoint
- `distal`: Ausrichtung und Quelllänge
- `pivot`: optionaler spezieller Drehpunkt; Standard ist `proximal`

Kopf, Torso und Becken können einpunktig befestigt werden. Arme und Beine
brauchen für automatische Normierung proximal und distal.

## 7. Transparenz und Trim

Der Import bestimmt die kleinste Bounding Box aller Pixel, deren Alpha größer
als der konfigurierbare Schwellwert ist. Standard:

```text
alphaThreshold = 1
```

Anker werden in Koordinaten des **ungetrimmten Originals** gespeichert. Für das
Rendering gilt:

```ts
effectiveAnchor = sourceAnchor - trimRect.origin;
```

Dadurch verschieben sich Anker nicht, wenn Trim-Bounds neu berechnet werden.

Regeln:

- vollständig transparente Dateien werden abgelehnt
- undekodierbare Dateien werden abgelehnt
- opake Außenränder erzeugen eine Warnung
- der Originalblob bleibt erhalten
- keine verlustbehaftete Rekodierung beim Import
- kein automatisches Hochskalieren kleiner Quellen

## 8. Automatische Größenanpassung und Platzierung

Für einen Part mit zwei Ankern:

```text
Quellvektor = distalSource - proximalSource
Zielvektor  = childJoint - parentJoint

Quelllänge = |Quellvektor|
Ziellänge  = |Zielvektor|

Scale      = Ziellänge / Quelllänge
Rotation   = angle(Zielvektor) - angle(Quellvektor)
Translation = parentJoint
```

Transformationsmatrix:

```text
M =
Translate(parentJoint + frameDelta + partDelta)
× Rotate(rotation + rotationDelta)
× UniformScale(scale × scaleDelta)
× Translate(-effectiveProximalAnchor)
```

Verbindlich:

- Uniform Scale ist Standard.
- Nicht uniforme Skalierung ist im MVP nicht erlaubt.
- Eine Quelllänge nahe null wird als Validierungsfehler behandelt.
- Scale-Grenzen erzeugen Warnungen, statt unsichtbar extreme Werte zu
  akzeptieren.
- Manuelle Korrekturen werden als Deltas gespeichert; die automatische
  Grundplatzierung bleibt rekonstruierbar.

## 9. Gelenküberlappung

Quellbilder sollen Gelenke visuell überdecken:

- Ärmel reicht über den Ellenbogenbereich
- Unterarm reicht unter den Oberarm
- Hand liegt teilweise unter Handschuh/Ärmel
- Oberschenkel und Unterschenkel überlappen am Knie
- Fuß überlappt den Knöchelbereich

Für die 80-px-Referenzfamilie gilt als Startwert eine visuelle Überlappung von
ungefähr 2 bis 4 Zielpixeln. Das ist eine Produktionsrichtlinie, kein starres
Schemafeld.

## 10. Deterministisches Pixelrendering

`canvas.drawImage()` mit Rotation allein ist nicht die verbindliche
Exportquelle, weil Browser bei transformierten Rasterbildern unterschiedlich
abtasten können.

Der finale Renderer arbeitet als Software-Rasterizer:

1. Ziel-Bounding-Box der transformierten Quelle bestimmen.
2. Für jeden Zielpixel die inverse affine Transformation anwenden.
3. Nächstgelegenen Quellpixel bestimmen.
4. Außerhalb der Quelle transparent behandeln.
5. Source-over-Alpha deterministisch zusammensetzen.
6. Ergebnis als `Uint8ClampedArray` ausgeben.

Verbindlich:

```text
keine bilineare Interpolation
keine Weichzeichnung
kein nachträglicher Pixelize-Filter
keine zufällige Palette-Quantisierung
keine halbtransparenten Randpixel durch Transform-Smoothing
```

Canvas darf das fertige RGBA-Bild nur anzeigen oder als PNG kodieren.

## 11. Ebenenreihenfolge

Draw Order ist richtungsabhängig. Eine globale unveränderte Reihenfolge ist
nicht ausreichend.

Jede Richtung besitzt:

```ts
interface DirectionRig {
  readonly joints: Readonly<Record<JointId, Point>>;
  readonly drawOrder: readonly PartSlot[];
  readonly motionProfile: DirectionMotionProfile;
}
```

Grundprinzipien:

### Blick nach Süd

- hintere Haare/Umhang zuerst
- hinteres Bein und hinterer Arm
- Becken und Torso
- vorderes Bein und vorderer Arm
- Kopf, Gesicht, Haare vorne
- vordere Ausrüstung zuletzt

### Blick nach Nord

- Vorderseiten-Overlays früher
- Rücken-/Umhang-/Rückenobjekte sichtbar
- Kopf-/Haare-hinten-Reihenfolge angepasst
- anatomisch nähere Gliedmaßen nach Richtung

### Ost/West

- kameranähere Körperseite wird später gezeichnet
- Spiegelung ersetzt nicht die Ziel-Draw-Order
- Schild, Waffe und Taschen können eigene Overrides besitzen

## 12. Spiegelregeln

```ts
type MirrorPolicy =
  | "inherit"
  | "allow"
  | "forbid";
```

- `inherit`: Projekt-/Kit-Standard
- `allow`: Teil darf abgeleitet gespiegelt werden
- `forbid`: Zielrichtung benötigt eigenes Bild

Beim Spiegeln:

```text
x' = frameWidth - 1 - x
rotation' = -rotation
```

Anatomische Slots bleiben anatomisch links/rechts. Die visuelle
Vorder-/Hinterreihenfolge wird durch den Ziel-DirectionRig bestimmt.

Typisch `forbid`:

- beschriftete Gegenstände
- asymmetrische Gesichtsnarben
- einseitige Taschen
- Schwertscheiden
- Wappen
- Licht-/Schattenseite, wenn die Weltlichtregel sonst verletzt wird

## 13. Licht- und Kamerakonsistenz

In allen Richtungen und Frames bleiben konstant:

- orthografische Projektion
- Kamerawinkel
- Weltlichtseite
- Palette und Materialcharakter
- Fußanker
- nominale Körperhöhe
- Framefläche

Die Figur dreht sich relativ zur Welt. Das Weltlicht wird nicht mit der Figur
gespiegelt. Ein blind gespiegeltes Bild kann deshalb als Produktionsquelle
ungültig sein.

## 14. Walk-Clip

Kanonischer Clip:

```text
walk-humanoid-8-v1
Frames: 8
FPS: 10
Loop: ja
```

Phasen:

| Frame | Phase |
|---:|---|
| 0 | Kontakt links |
| 1 | Absenken links |
| 2 | Durchgang links |
| 3 | Hochpunkt links |
| 4 | Kontakt rechts |
| 5 | Absenken rechts |
| 6 | Durchgang rechts |
| 7 | Hochpunkt rechts |

Normierte Basiskanäle:

```text
leftStride  = [-1.00, -0.75, 0.00, 0.75, 1.00, 0.75, 0.00, -0.75]
rightStride = leftStride um 4 Frames phasenverschoben
rootBobY    = [ 0,     1,    0,   -1,    0,    1,    0,   -1]
rootSway    = [-1,    -1,    0,    1,    1,    1,    0,   -1]
armSwing    = gegenüberliegende Beinphase × 0.75
```

Richtungsprofile skalieren daraus die Zielbewegung. Startwerte:

| Richtungstyp | Oberschenkel | Unterschenkel | Arm | sichtbare Schrittachse |
|---|---:|---:|---:|---|
| Seite | bis 18° | bis 28° | bis 14° | hauptsächlich X |
| Diagonal | bis 14° | bis 22° | bis 11° | X und Y |
| Front/Rücken | bis 9° | bis 18° | bis 8° | verkürzt, stärker Y |

Diese Werte sind versionierte Templatewerte, keine versteckten UI-Konstanten.

## 15. Fußkontakt

Mindestregel:

- Kontaktfuß bleibt in den Kontakt-/Down-Frames auf der projektierten
  Bodenlinie.
- Swing-Fuß darf sich lösen.
- Root-Bob darf die Kontaktbedingung nicht sichtbar brechen.
- Fußanker des Gesamtframes bleibt an derselben Koordinate.

Die erste Implementierung darf eine deterministische Kontaktkorrektur auf Basis
der Zielgelenke verwenden. Eine optionale Two-Bone-IK-Funktion muss pure
TypeScript-Domainlogik sein und unerreichbare Ziele kontrolliert clampen.

## 16. Frame-Overrides

Automatisch erzeugte Frames dürfen nachbearbeitet werden, ohne die Vorlage zu
zerstören:

```ts
interface FrameOverride {
  readonly rootDelta?: TransformDelta;
  readonly jointDeltas?: Readonly<Partial<Record<JointId, JointDelta>>>;
  readonly partDeltas?: Readonly<Partial<Record<PartSlot, TransformDelta>>>;
  readonly layerOrderOverride?: readonly PartSlot[];
}
```

- nur Deltas speichern
- Reset auf Template möglich
- Richtung/Frame/Slot eindeutig adressieren
- Undo/Redo umfasst Metadaten, nicht duplizierte Blobs
- Korrekturen werden in Export und Projektbundle übernommen

## 17. Produktionsvalidierung

Ein 8-Richtungs-Walk gilt als exportbereit, wenn:

- alle Pflichtslots vorhanden sind
- alle benötigten Richtungen eigene oder gültig gespiegelte Quellen besitzen
- alle Limb-Parts vollständige Anker haben
- keine vollständig transparente Quelle verwendet wird
- alle Frameflächen gültig sind
- kein Pflichtpart außerhalb jedes Frames liegt
- keine verbotene Spiegelung offen ist
- 64 Frames deterministisch rendern
- Fußanker und Richtungskanon eingehalten werden
- keine unbestätigte Clipping-Warnung vorliegt

Warnungen dürfen exportierbar sein, harte Fehler nicht.
