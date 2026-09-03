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
