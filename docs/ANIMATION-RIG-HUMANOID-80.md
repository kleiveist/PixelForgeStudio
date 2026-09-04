<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Built-in-Rig `humanoid-80-v1`

## Produktionsvertrag

`humanoid-80-v1` ist die unveränderliche erste Rigvorlage des Animation
Studio. Sie verwendet getrennte, versionierte Verträge:

| Wert | Vertrag |
|---|---:|
| Frame | 128 × 128 px |
| Figurenhöhe | 80 px |
| Fuß-/Root-Anker | 64 / 112 |
| Direction-Contract | 1 |
| Anchor-Contract | 1 |
| Pflichtslot-Contract | 1 |

Framegröße und Figurenhöhe sind unterschiedliche Werte. Koordinaten beginnen
oben links; +x zeigt nach rechts und +y nach unten. Die Rig-Domain ist pures
TypeScript und besitzt keine React-, SVG-, Canvas- oder Persistenzabhängigkeit.

## Eigene Quellposen

Die Vorlage enthält fünf eigenständig modellierte Neutralposen. West,
Nordwest und Südwest sind bewusst noch keine Quellgeometrien; ihre
kontrollierte Spiegelableitung folgt erst in Prompt 44 beziehungsweise die
vollständige Richtungsauflösung in Prompt 45.

| Joint | Süd | Südost | Ost | Nordost | Nord |
|---|---:|---:|---:|---:|---:|
| root | 64/112 | 64/112 | 64/112 | 64/112 | 64/112 |
| pelvis | 64/78 | 64/78 | 62/78 | 64/78 | 64/78 |
| chest | 64/58 | 63/58 | 61/58 | 64/58 | 64/58 |
| neck | 64/44 | 63/44 | 61/44 | 64/44 | 64/44 |
| head | 64/34 | 64/34 | 65/34 | 63/34 | 64/34 |
| shoulder.left | 52/52 | 58/53 | 60/53 | 56/51 | 53/51 |
| elbow.left | 49/68 | 56/68 | 58/68 | 52/66 | 50/67 |
| wrist.left | 48/82 | 56/81 | 59/82 | 50/80 | 49/81 |
| hand.left | 47/86 | 56/86 | 61/86 | 49/85 | 48/86 |
| shoulder.right | 76/52 | 73/51 | 65/51 | 72/53 | 75/51 |
| elbow.right | 79/68 | 76/66 | 68/66 | 74/68 | 78/67 |
| wrist.right | 80/82 | 79/79 | 72/79 | 75/81 | 79/81 |
| hand.right | 81/86 | 80/84 | 74/83 | 76/85 | 80/86 |
| hip.left | 58/78 | 61/79 | 61/79 | 60/77 | 59/78 |
| knee.left | 57/95 | 62/95 | 60/95 | 58/94 | 58/95 |
| ankle.left | 56/109 | 61/109 | 60/109 | 56/108 | 57/109 |
| toe.left | 53/112 | 59/112 | 63/112 | 53/111 | 54/112 |
| hip.right | 70/78 | 69/77 | 64/77 | 68/79 | 69/78 |
| knee.right | 71/95 | 72/94 | 67/94 | 69/95 | 70/95 |
| ankle.right | 72/109 | 75/108 | 69/108 | 70/109 | 71/109 |
| toe.right | 75/112 | 78/111 | 73/110 | 72/112 | 74/112 |

Diagonal- und Seitenposen verschieben die nahe und ferne Körperseite bewusst,
anstatt die South-Pose nur umzubenennen. Das zugehörige
`DirectionMotionProfile` beschreibt in Version 1 Projektionsklasse, sichtbare
Schritt-/Sway-Achse, nahe Seite, Biegerichtung sowie versionierte Stride-,
Bein-, Lift- und Armamplituden. Keyframes bleiben im gemeinsamen
`walk-humanoid-8-v1`-Clip; die Profile projizieren diese normierten Kanäle nur
auf ihre Zielgeometrie. Die genauen Werte und der 64-Frame-Vertrag stehen unter
[Acht-Richtungs-Walk](ANIMATION-EIGHT-DIRECTION-WALK.md).

## Bones und Pflichtslotbindungen

Die 20 Bones bilden eine azyklische Hierarchie aus Wirbelsäule, Schulter- und
Hüftverbindern sowie Arm-/Bein-Limbs. Jeder der 15 Pflichtslots ist genau an
einen Bone gebunden:

| Slot | Bone | Quellanker |
|---|---|---|
| head | neck.head | proximal + Defaultorientierung |
| torso | pelvis.chest | proximal + Defaultorientierung |
| pelvis | root.pelvis | proximal + Defaultorientierung |
| arm.left.upper | shoulder.left.elbow.left | proximal + distal |
| arm.left.lower | elbow.left.wrist.left | proximal + distal |
| hand.left | wrist.left.hand.left | proximal + distal |
| arm.right.upper | shoulder.right.elbow.right | proximal + distal |
| arm.right.lower | elbow.right.wrist.right | proximal + distal |
| hand.right | wrist.right.hand.right | proximal + distal |
| leg.left.upper | hip.left.knee.left | proximal + distal |
| leg.left.lower | knee.left.ankle.left | proximal + distal |
| foot.left | ankle.left.toe.left | proximal + distal |
| leg.right.upper | hip.right.knee.right | proximal + distal |
| leg.right.lower | knee.right.ankle.right | proximal + distal |
| foot.right | ankle.right.toe.right | proximal + distal |

Einpunktige Slots verwenden die versionierte Quellorientierung −π/2. Sie ist
Produktionsdatum der Bindung und keine UI-Konstante.

## Validierung und Kompatibilität

`validateRigTemplate()` liefert strukturierte Issues mit Code und Pfad. Die
Prüfung umfasst vollständige Joints/Bones/Pflichtslots, Framegrenzen,
Bone-Referenzen, eine azyklische Elternhierarchie, Limb-Längen oberhalb des
Epsilonwerts sowie Root-, Fuß- und Toe-Nähe zur Groundline.

`createRigCompatibilityKey()` validiert zuerst und serialisiert danach alle
vertraglich relevanten Werte in fester Katalogreihenfolge. Der aktuelle Key
lautet:

```text
humanoid-80-v1__frame-128x128__char-80__foot-64-112__contracts-1-1-1__840c7385b8de44bc
```

Der Fingerprint ist eine deterministische Gruppierungskennung und keine
Sicherheits- oder Integritätsgrenze.

## Sichtbares Overlay

Der Workspace projiziert Bones, Joints, Pflichtslotlabels und Groundline über
ein SVG direkt aus der ausgewählten `DirectionRig`. Zoom und Pan verändern nur
die Darstellung. Das Overlay mutiert die Built-in-Daten nicht. Der getrennte
[Anker- und Placement-Workflow](ANIMATION-ANCHORS-AND-PLACEMENT.md) setzt
Source-Anker ausschließlich in Originalkoordinaten und projiziert gültige
Parts reproduzierbar an die jeweils aktive DirectionRig. Der finale
Pixelrenderer bleibt Prompt 40 vorbehalten.
