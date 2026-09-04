<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Richtungsabdeckung und Spiegelprüfung

Der Workspace zeigt unter **Richtungs-Coverage** immer alle 39 Slots in allen
acht kanonischen Richtungen. Symbol und Text erklären gemeinsam, ob eine
eigene Quelle vorliegt, eine Spiegelquelle gültig ist, eine Prüfung aussteht,
Spiegelung verboten ist, eine Quelle fehlt, ein optionaler Slot ungenutzt ist
oder Anker unvollständig sind.

## Fünf Quellen für acht Richtungen

Im Modus `fiveAuthoredPlusMirror` werden nur diese Ansichten abgeleitet:

| Ziel | Quelle |
|---|---|
| Südwest | Südost |
| West | Ost |
| Nordwest | Nordost |

Eine eigene Zielrichtungsquelle gewinnt immer. `eightAuthored` verwendet
keinen Spiegel-Fallback. `singleDirectionPrototype` bleibt sichtbar, ist aber
nicht als produktionsfertiger Acht-Richtungs-Export freigegeben.

## Regeln und Freigabe

Der Projektstandard erlaubt oder verbietet Spiegelung. Ein Part kann diesen
Standard mit **übernehmen**, **erlauben** oder **verbieten**. Verbotene
Spiegelung ohne eigene Zielquelle ist ein Produktionsfehler.

Optionale und ausrüstungstypische Parts gelten als potenziell asymmetrisch.
Bei „Prüfung erforderlich“ öffnet **Prüfen** einen Dialog. Vor der Bestätigung
sind insbesondere Waffen, Schilde, Taschen, Narben, Schrift, Wappen und die
feste Weltlichtseite visuell zu kontrollieren. Nur **Spiegelung bestätigen**
speichert die projektbezogene Entscheidung; Abbrechen, Escape oder bloßes
Schließen bestätigt nichts. Ändert sich die Quellrevision, ist die alte
Freigabe nicht mehr wirksam.

## Technischer Spiegelvertrag

- Sourcepixel und Sourceanker: `sourceWidth - 1 - x`
- Framejoints: `2 * footAnchor.x - x`
- X-Offsets und Rotationen wechseln das Vorzeichen.
- Y-Offsets und uniforme Skalierung bleiben erhalten.
- Anatomische Left-/Right-Slot-IDs werden nicht umbenannt.
- Die Ebenenreihenfolge stammt immer aus der Zielrichtung.

Die Spiegelung entsteht erst im flüchtigen Renderpfad. Original-PNG,
Originalmetadaten und Blob-Referenz werden weder verändert noch dupliziert.
