<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Technische Prompt-Spezifikation

## 1. Ziel

Diese Spezifikation gilt für das **PixelForge Prompt Studio** als bestehendes
Prompt-Produktionsmodul innerhalb von PixelForge Studio.

Das Studio erzeugt wiederholbare Prompt-Pakete für eine zusammenhängende Pixelart-Asset-Bibliothek. Die Regeln sollen verhindern, dass Kamera, Figurenmaßstab, Richtung, Beleuchtung oder Pixelstruktur zwischen einzelnen Bildern unkontrolliert wechseln.

## 2. Verbindlicher Standard

### Kamera

- frontale schräge 3/4-RPG-Draufsicht
- orthografische Projektion
- Kamera mittig südlich des Motivs
- Blick gerade nach Norden
- ungefähr 60° Abwärtsneigung von der Horizontalen
- keine diagonale Kamera-Drehung
- keine Fluchtpunkte
- keine Größenabnahme mit Entfernung
- Kamera bleibt für alle Richtungen fest; nur das Motiv rotiert

### Weltachsen

- Nord = Bildschirm oben
- Süd = Bildschirm unten
- West = Bildschirm links
- Ost = Bildschirm rechts
- keine isometrischen Diagonalachsen im Standardprofil

### Maßstab

- 32 × 32 px pro Tile
- Standardfigur: 80 px Körperhöhe
- Richtungsabweichung der Körperhöhe: höchstens 1 px
- Standardframe für Figuren: 128 × 128 px
- Standard-Sheet für acht Richtungen: 4 × 2 Frames
- Gesamtgröße: 512 × 256 px

### Richtungssets

Vier oder acht Richtungen gelten ausschließlich für richtungsabhängig bewegliche Assets. Statische Objekte, Texturen, Gebäude und gewöhnliche Naturassets erhalten keine Richtungsanforderung. Animation und Richtungsset sind getrennte Eigenschaften: Ein Baum im Wind oder ein animiertes Wasser-Tile kann Frames besitzen, ohne Richtungsansichten zu benötigen.

Für geeignete bewegliche Assets ist acht Richtungen der Standard. Lesereihenfolge von links nach rechts und oben nach unten:

1. Süd / vorne
2. Südwest / vorne-links
3. West / links
4. Nordwest / hinten-links
5. Nord / hinten
6. Nordost / hinten-rechts
7. Ost / rechts
8. Südost / vorne-rechts

Die Ansicht darf nicht nur gespiegelt werden. Kleidung, Ausrüstung und anatomische Formen müssen in jeder Richtung logisch neu dargestellt werden.

## 3. Moderne Pixelart

Modern-HD bedeutet:

- nativ in der Zielauflösung zeichnen
- keine nachträgliche künstliche Pixelisierung
- feinere Cluster und mehr Materialdetails als bei historischen Hardwaregrenzen
- eindeutig sichtbare Pixelstruktur
- keine geglätteten Kanten
- keine halbtransparenten Randpixel
- Nearest-Neighbor bei Skalierung
- kontrolliertes Dithering statt zufälligem Rauschen

## 4. Konturen

Standard ist eine weiche selektive Outline:

- stärkere Kontur an wichtigen Außenkanten
- stärkere Trennung an kritischen Materialübergängen
- schwächere oder farblich angepasste Kontur auf beleuchteten Kanten
- keine gleichmäßig dicke schwarze Linie um jedes Innendetail

## 5. Farbprofile

### Profil A – klassische Fantasy

- natürliche und leicht gedämpfte Farben
- etwas freundlichere lokale Farbwerte
- klare Materialunterschiede
- gute Abenteuerlesbarkeit
- keine übermäßig grellen Bonbonfarben

### Profil B – düstere Fantasy

- dunklere, rauere und leicht entsättigte Farbgruppen
- gealterte Materialien
- kontrollierte Bedrohlichkeit
- lesbare Mitteltöne
- keine vollständig zugelaufenen Schwarztöne

## 6. Lichtpolitik

Bei automatischer Lichtwahl:

| Situation | Regel |
|---|---|
| Außenbereich am Tag | neutrales Tageslicht |
| beleuchtetes Gebäude | warmes lokales Licht |
| unheilvolle Stimmung | düsteres diffuses Licht |
| Außenbereich bei Nacht | neutrales bis leicht kühles Nachtlicht |
| dunkler Innenraum bei Nacht | neutrales niedrigintensives Restlicht |
| sichtbare warme Lichtquelle | begrenzte warme Akzente |

Das Licht bleibt innerhalb eines Richtungssets immer auf derselben Weltseite.

## 7. Freistellung

Für transparente Assets:

- echtes Alpha
- keine eingezeichnete Schachbrettfläche
- kein Himmel, Horizont oder Landschaftshintergrund
- kein dekorativer Sockel
- mindestens 8 px transparenter Sicherheitsrand im Standard
- ein kleiner Kontaktschatten ist je nach Asset möglich
- kein großer weicher Schlagschatten außerhalb des Assets

## 8. Prompt-Pakete

Jede Erzeugung liefert:

1. **Hauptprompt** – Motiv, Art-Direction, Kamera, Licht und Komposition
2. **Negativprompt** – dynamisch aus den gewählten Einstellungen erzeugte Ausschlüsse
3. **Technische Spezifikation** – Maße, Richtungen, Canvas, Anker und Exportregeln
4. **Kombinierte Ausgabe** – alle drei Blöcke in einer kopierbaren Fassung

## 9. Implementierung in V2

Seit Prompt 23 erzeugt `src/domain/prompt-engine/` diese Pakete aus einem
validierten `ResolvedProfile`. Zwölf pure, fest geordnete TypeScript-Module
trennen globale Art Direction, Kategorieantworten, Licht, Bewegung,
Animation, Komposition, Ausschlüsse und technische Fakten. Die Ausgabe ist
deterministisch, immutable und ohne React-, Browser- oder Storage-Abhängigkeit.

Richtungsmetriken werden ausschließlich bei `directional` erzeugt. Das
Standardframe wird aus Motivmaß, transparentem Rand und Tile-Raster mit
mindestens 128 × 128 px abgeleitet; daraus entstehen für vier Richtungen ein
4×1- und für acht Richtungen ein 4×2-Canvas. Kamera, Bodenanker und Weltlicht
bleiben konstant. Freie Artworks überspringen dagegen Spielraster,
Weltkamera, Figurenmaßstab, Richtungsset und Animation vollständig. Die
sichtbare Integration ist seit Prompt 24 unter
`src/features/review-output/` verfügbar: Ein validierter Wizard-Draft wird
fail-closed über Base→Category→Asset aufgelöst und anschließend ohne
Promptlogik in React an `buildPromptPackages()` übergeben. Die Oberfläche
stellt alle vier Ausgaben pro deutscher/englischer Sprache und wirksamer
Stilvariante als tastaturbedienbare Tabs dar. Die aktive Fassung ist über
einen injizierbaren Browser-Port kopierbar und als strukturierte
Markdown-Datei exportierbar; der
geprüfte Profilstand wird über das bestehende V2-ExportBundle als JSON mit
seinen Abhängigkeiten ausgegeben. Konflikte erzeugen bewusst keine
Produktionsausgabe. Seit Prompt 25 können ausschließlich strukturierte
Lock-Konflikte kontrolliert konvertiert werden: Vor der Bestätigung zeigt die
Oberfläche Wertänderung und Wechsel der technischen Compatibility-Gruppe,
ohne das interne Key-Format offenzulegen. Abbruch, Duplikation der Basis,
Neuanlage oder Wahl einer kompatiblen vorhandenen Basis ändern niemals die
gesperrte Ausgangsfamilie oder deren bestehende Kinder. Erst ein erneut
vollständig aufgelöster und persistierter Draft gelangt zurück in die Prompt-
Erzeugung.

Die frühere Top-Level-Route `review` ist kein eigener Bedienpfad mehr. Alte
Links und gespeicherte Startansichten werden kompatibel auf den einzigen
Ausgabe-Workspace unter `output` kanonisiert.

Prompt 26 verändert Inhalt, Reihenfolge und Determinismus dieser vier
Ausgaben nicht. Er härtet ausschließlich ihre Darstellung: Die Tabs behalten
Pfeil-, Home- und End-Steuerung samt sichtbarem Fokus, lange Prompt- und
Technikzeilen bleiben bei 360 px innerhalb des Output-Panels und reduzierte
Bewegung deaktiviert Übergänge. Die reproduzierte Viewport-, Theme-,
Keyboard- und Kontrastprüfung ist in
`erledigt/V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md` dokumentiert.

Prompt 27 bestätigt Inhalt und Download-Roundtrip aller vier Ausgaben in der
Release-Abnahme. App-eigene Vorlagen und erzeugte Release-Beispiele enthalten
keine direkten Namen bestehender Spiele, Marken, Figuren, Werke oder
Kunstschaffender; die generische negative Regel gegen namentliche Imitation
bleibt erhalten. Evidenz: `erledigt/V2-RELEASE-ACCEPTANCE.md`.

## 10. Implementierung V3

V3 erweitert das Dachprodukt zu **PixelForge Studio** mit den getrennten
Modulen **PixelForge Prompt Studio** und **PixelForge Animation Studio**. Diese
Produktstufe ist keine stillschweigende Migration des Promptformats: Prompt
Studio behält `schemaVersion: 2`, den bestehenden Export-Identifier und die
sechs `pixelforge:v2:*`-localStorage-Namespaces. Die in den Abschnitten 1–9
definierten Promptregeln, Paketbestandteile und Capability-Grenzen bleiben
damit verbindlich.

Die technische Ownership ist bewusst getrennt:

| Bereich | Versionsvertrag | Persistenz | zuständige Grenze |
|---|---|---|---|
| Prompt Studio | Prompt-Schema und Exportformat V2 | sechs bestehende localStorage-Namespaces | Profil-/Wizard-Provider und `src/domain/prompt-engine/` |
| Animation Studio | eigenständiges Animationsformat V1 | native IndexedDB-Datenbank `pixelforge-studio` | `AnimationRepository` und `AnimationProjectProvider` |
| Animation Workspace | kein eigener Persistenzvertrag | Richtung, Clip, Frame, Slot, Zoom, Overlays und Paneele nur flüchtig | lokaler `animationWorkspaceReducer` |

`buildPromptPackages()` bleibt die einzige Produktionsgrenze für die vier
Promptausgaben. Animation-Projekte oder Workspace-Auswahlen werden nicht
automatisch in `ResolvedProfile`, Hauptprompt, Negativprompt oder technische
Spezifikation gemischt. Eine spätere Übergabe vom Prompt- zum
Animationsmodul muss explizit erfolgen, validierte Referenzen verwenden und
die beiden Versionsverträge getrennt halten.

Der derzeit implementierte V3-Ausbaustand umfasst:

1. die kompatible Produktumbenennung, typisierte Modulmarken und
   roundtrip-stabile Studio-Routen,
2. die gemeinsame zugängliche App-Shell, Studio-Startseite und getrennte
   Startziele,
3. die frameworkfreie Animationsdomain mit acht Richtungen, 39 Slots,
   Rig-Topologie und dem unveränderlichen `humanoid-80-v1`-Framevertrag,
4. strikte Animationsprojekt-, PartAsset-, Character-Kit- und Bundle-Schemas,
5. den injizierbaren Memory-/IndexedDB-Repository-Port mit getrennter
   Metadaten-/Blob-Persistenz,
6. den validierten Animationsprojekt-Lifecycle mit CRUD, Autosave,
   Dirty-Navigation und stabiler Workspace-Projekt-ID sowie
7. die responsive Animation-Workspace-Shell mit Teileinventar,
   DOM-Viewport, Projekt-/Part-/Frame-Inspektor und acht Walk-Frameplätzen sowie
8. den validierten PNG-Part-Import mit injiziertem Decoder, Alpha-Trim,
   kurzlebiger Vorschau, `anchorsPending`, Richtungs-Coverage und atomarer
   Part-/Blob-/Projektzuweisung sowie
9. die immutable Built-in-Rigvorlage `humanoid-80-v1` mit fünf eigenen
   Neutralposen, validierter Bone-/Slot-Hierarchie, stabilem Compatibility Key
   und datengetriebenem SVG-Overlay sowie
10. den Originalanker-Editor mit Ein-/Zweipunktvertrag, reproduzierbarer
    uniformer Bone-Platzierung, getrennten projektweiten Deltas, atomarem
    Resume und den Coverage-Zuständen `ready`, `anchorsPending`,
    `invalidAnchors` und `missing` sowie
11. den frameworkfreien nearest-neighbor Software-Rasterizer mit
    ganzzahlig-deterministischem Source-over, strukturierten Diagnosen,
    revisionsgebundenem RGBA-Cache und display-only Canvas-Adapter sowie
12. acht versionierte richtungsspezifische Draw-Orders mit getrennter
    Nah-/Fernseite, validierten Ausrüstungs-Attachments, kleinen
    projektweiten Layer-Deltas und sichtbarer Kanten-/Bounding-Box-Diagnostik.

Im Workspace liest das Rig-SVG Bones, Joints, Groundline und Pflichtslotlabels
direkt aus den versionierten Produktionsdaten. Schachbrett, Raster,
Part-Anker und Begrenzungsrahmen bleiben Anzeigeebenen und sind weder Quelle
der Rigdaten noch ein fertiger Part-Renderer. Ganzzahliger Zoom verändert nur
die Anzeige; Projekt- und Exportkoordinaten bleiben unverändert. Nicht
aufgelöste PartAsset-/Blob-Referenzen werden sichtbar als fehlende Quelle
behandelt, ohne Dummybilder oder scheinpräzise Anker zu erzeugen.

Die V3-Implementierung befindet sich nach Prompt 41 in Phase D und ist noch
nicht releasevollständig. Walk-Generierung, Playback, Korrektur-History,
Character Kits, Sprite-Sheet-/Godot-Export und die explizite
Prompt→Animation-Übergabe gehören zu den noch offenen Prompts 42–51. Der
verbindliche Ausführungsstand und die Reihenfolge stehen unter
`aufgaben/pixelforge-studio-v3/START_HERE.md` und in `../PLANS.md`.
