<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — South-Walk `walk-humanoid-8-v1`

## Clipvertrag

Die erste produktive Laufvorlage ist ein versionierter Domainwert in
`src/domain/animation/walkClip.ts`:

- Template-ID: `walk-humanoid-8-v1`
- Aktion: `walk`
- Frames: 8
- Standardtempo: 10 FPS
- Loop: aktiv
- produktiv generierte Richtung: ausschließlich authored South

Die acht Frames sind Kontakt links, Down links, Passing links, Up links,
Kontakt rechts, Down rechts, Passing rechts und Up rechts. Es gibt keine
Zwischenbildinterpolation und keine zufälligen Werte. Frame 8 löst im Loop
wieder exakt Frame 0 auf.

## Versionierte Bewegungskanäle

Die readonly Vorlage speichert pro Frame `leftStride`, `rightStride`,
`rootBobY`, `rootSwayX`, gegenläufige linke/rechte Armkanäle sowie getrennte
Knee- und Foot-Lifts. Die rechte Schrittphase ist um vier Frames verschoben;
der jeweils gegenüberliegende Arm folgt mit Faktor 0,75. Der Standard-Bob
bleibt zwischen -1 und +1 Projektpixel. Torso und Kopf erhalten kleine
kontrollierte Gegenbewegungen.

`resolveClipFrame()` liest die normierten Kanäle, und
`resolveHumanoidWalkPose()` erzeugt daraus die unveränderliche Framepose.
`applyPoseToDirectionRig()` überträgt sie auf eine neue South-Rigkopie; die
neutrale Built-in-Vorlage wird nie verändert.

## Kontakt und IK

Der Root-/Fußanker des Frames bleibt unverändert. In Kontakt- und Down-Phasen
wird der jeweilige Toe-Joint ausdrücklich auf der projizierten Groundline
gehalten. Root-Bob bewegt den Körper relativ dazu und darf den Kontakt nicht
verschieben.

Beine verwenden den puren Two-Bone-Solver `solveTwoBoneIk()`. Segmentlängen
und Bend-Richtung stammen aus dem Rig. Zu nahe oder zu ferne Ziele werden auf
den erreichbaren Bereich geklemmt und erzeugen `targetClamped`; ungültige
Längen liefern ein strukturiertes Ergebnis. Kein Fehlerpfad gibt NaN oder
Infinity als Gelenkkoordinate aus.

## Produktionsfreigabe und Nutzeranzeige

`generateSouthWalkFrames()` aktiviert die Vorlage nur, wenn:

- der kanonische Loop-Clip im Projekt vorhanden ist,
- alle 15 South-Pflichtslots genau einmal belegt sind,
- alle Pflichtparts `ready` und ihre Anker vollständig sind,
- jede benötigte RGBA-Quelle dekodiert vorliegt,
- die Rigdaten endliche, positive Bone-Längen besitzen und
- der Renderer keine Fehler meldet.

Alle Blocker werden gesammelt im Workspace angezeigt. Bei Erfolg entstehen
acht flüchtige `RenderedFrame`-Objekte in der richtungsspezifischen Draw-Order.
Sie werden nicht als PNG oder Projektmetadaten gespeichert. Tempo, Template-ID
und spätere Overrides bleiben die persistierte Quelle der Wahrheit.

Timeline-Wiedergabe, Scrubbing und Onion Skin sind mit Prompt 43 umgesetzt.
Bedienung, Cache- und Lebenszyklusregeln stehen in
`ANIMATION-TIMELINE-PLAYBACK.md`. Andere Richtungen, Spiegelung und vollständige
8-Richtungs-Generierung folgen erst in den dafür vorgesehenen Prompts.
