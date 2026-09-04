<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Anker und automatische Partplatzierung

## Anker im Originalbild setzen

Wähle im Teileinventar einen belegten Pflichtslot. Unter dem Projektframe
öffnet sich der Ankerbearbeitungsmodus mit dem unveränderten Original-PNG.
Klick oder Pointer setzt den aktiven Anker standardmäßig auf das nächste ganze
Quellpixel. Die Zahlenfelder sind die vollständige Tastaturalternative; Zoom,
Pfeiltasten-Pan und Reset verändern keine gespeicherten Bilddaten.

- `head`, `torso` und `pelvis` benötigen einen proximalen Anker. Ihre
  Quellorientierung −π/2 ist Version 1 der Rig-Slotbindung.
- Arm-, Hand-, Bein- und Fußteile benötigen proximalen und distalen Anker.
- Ein Pivot ist optional und bleibt ebenfalls eine Originalbildkoordinate.
- Reset stellt gespeicherte Anker, projektweite Korrektur, Zoom und Pan wieder
  her.

Ein unvollständiger Entwurf kann gespeichert und später fortgesetzt werden.
Coverage zeigt ihn als `invalidAnchors`; ein neuer Import ohne Anker bleibt
`anchorsPending`. Erst slotabhängig gültige Anker ergeben `ready`. Eine nicht
vorhandene Quelle bleibt `missing`.

## Reproduzierbare Grundplatzierung

`trimRect` wird nicht in die gespeicherten Anker eingerechnet. Für die
Darstellung gilt genau einmal:

```text
effectiveAnchor = sourceAnchor - trimRect.origin
sourceVector     = distal - proximal
targetVector     = childJoint - parentJoint
uniformScale     = length(targetVector) / length(sourceVector)
rotation         = angle(targetVector) - angle(sourceVector)
transform        = T(parentJoint) · R(rotation) · S(uniformScale)
                   · T(-effectiveProximal)
```

Bei Einpunkt-Parts ersetzt die versionierte Defaultorientierung den
Quellvektor; der automatische Scale ist dort 1. Ein Quellvektor bis
einschließlich `0.001 px` ist ungültig. Ein automatischer Scale unter `0.5`
oder über `2.0` wird sichtbar gewarnt, aber niemals still begrenzt.

Die Live-Vorschau nutzt diese pure Matrix über einen schmalen Anzeigeadapter.
Der seit Prompt 40 getrennte Software-Rasterizer konvertiert ihre
Ganzzahl-Pixelzentrumsmatrix einmalig in die Halbpixelkonvention und erzeugt
den finalen RGBA-Frame ohne Canvas-Abtastung. Ein Richtungs- oder Rigwechsel
liest neue Jointziele und berechnet die Matrix neu, ohne Source-Anker zu
verändern.

## Projektweite Korrektur

Manuelle Feinjustierung wird getrennt an der Projektzuweisung gespeichert:

| Wert | erlaubter Bereich |
|---|---:|
| `offsetX`, `offsetY` | −32 bis +32 px |
| `rotationDelta` | −π/2 bis +π/2 rad |
| `scaleMultiplier` | 0,5 bis 1,5 |

Die wirksame Matrix verwendet Translation plus Offset, Rotation plus Delta und
automatischen Scale mal Multiplikator. Es gibt keine nicht uniforme
Skalierung und keinen redundant gespeicherten absoluten Auto-Transform.
PartAsset-Anker und Projekt-Delta werden atomar geschrieben; das Originalblob
bleibt dabei unangetastet.
