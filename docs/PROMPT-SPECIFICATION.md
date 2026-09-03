<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Technische Prompt-Spezifikation

## 1. Ziel

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
einen injizierbaren Browser-Port kopierbar und als TXT exportierbar; der
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

Prompt 26 verändert Inhalt, Reihenfolge und Determinismus dieser vier
Ausgaben nicht. Er härtet ausschließlich ihre Darstellung: Die Tabs behalten
Pfeil-, Home- und End-Steuerung samt sichtbarem Fokus, lange Prompt- und
Technikzeilen bleiben bei 360 px innerhalb des Output-Panels und reduzierte
Bewegung deaktiviert Übergänge. Die reproduzierte Viewport-, Theme-,
Keyboard- und Kontrastprüfung ist in
`V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md` dokumentiert.

Prompt 27 bestätigt Inhalt und Download-Roundtrip aller vier Ausgaben in der
Release-Abnahme. App-eigene Vorlagen und erzeugte Release-Beispiele enthalten
keine direkten Namen bestehender Spiele, Marken, Figuren, Werke oder
Kunstschaffender; die generische negative Regel gegen namentliche Imitation
bleibt erhalten. Evidenz: `V2-RELEASE-ACCEPTANCE.md`.
