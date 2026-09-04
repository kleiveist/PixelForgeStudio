<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — PNG-Teile importieren

Prompt 37 aktiviert im Animation Workspace den sicheren Import einzelner
Körperteile. Der Import verändert erst nach einer ausdrücklichen Bestätigung
das geöffnete Projekt.

## Ablauf

1. Öffne ein Animationsprojekt und wähle im Teileinventar den Zielslot.
2. Wähle in der Toolbar die Zielrichtung.
3. Nutze **PNG-Datei auswählen** oder lege dieselbe Datei in der Dropzone ab.
4. Prüfe Dateiname, Originalmaß, automatisch ermittelte Trim-Grenzen und
   Warnungen in der Vorschau.
5. Bestätige den Import oder verwirf den Entwurf mit **Abbrechen**.

Der Dateidialog ist immer die Tastatur- und Nicht-Zeiger-Alternative zur
Dropzone. Während der Prüfung und Speicherung bleibt das Originalbild
unverändert. Die Vorschau verwendet nur eine kurzlebige lokale Object URL.

## Zulässige Dateien

- ausschließlich decodierbares PNG mit MIME-Typ `image/png` und gültiger
  PNG-Signatur
- höchstens 16 MiB
- höchstens 2048 × 2048 px
- mindestens ein Pixel mit Alpha größer als 1

Ein vollständig opakes Pixel am Außenrand erzeugt eine Beschnittwarnung, ist
aber kein automatischer Fehler. JPG, umbenannte Nicht-PNG-Dateien,
beschädigte PNGs, übergroße und vollständig transparente Bilder werden vor
jedem Write abgewiesen.

## Trim, Anker und Ersetzen

Die Trim-Grenzen werden deterministisch aus RGBA-Alpha berechnet und bleiben
Koordinaten des unbeschnittenen Originals. Der Import erfindet keine Gelenk-,
Pivot- oder Befestigungspunkte: Ein neues PartAsset erhält sichtbar den Status
`anchorsPending` und blockiert die Produktionsreife, bis eine spätere
Ankerbearbeitung abgeschlossen ist.

Der anschließende [Anker- und Placement-Workflow](ANIMATION-ANCHORS-AND-PLACEMENT.md)
arbeitet weiterhin auf dem unveränderten Originalbild, speichert
Originalkoordinaten und setzt einen Part erst nach slotabhängiger Prüfung auf
`ready`.

Ist Slot und Richtung schon belegt, ersetzt der Import nur die Zuordnung im
aktuellen Projekt. Das bisherige PartAsset und sein Bild werden nicht gelöscht,
weil andere Projekte oder Character Kits sie weiterhin referenzieren können.

## Fehler und Speicherung

Original-PNG, PartAsset-Metadaten und aktualisierte Projektzuweisung werden in
einer IndexedDB-Transaktion gespeichert. Scheitert sie, bleiben Projekt,
PartAssets und Bildspeicher unverändert; der geprüfte Entwurf bleibt zur
erneuten Bestätigung sichtbar. PNG-Binärdaten gelangen weder in React Context
noch in `localStorage`, JSON oder Base64-Metadaten.

Die aufklappbare **Richtungs-Coverage** unterscheidet Quelle, fehlende
Pflichtquelle, optionalen Slot und offene Anker für alle tatsächlich zu
authorenden Richtungen.
