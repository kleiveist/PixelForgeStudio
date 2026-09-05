<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 38 — Eingebaute Rig-Vorlage humanoid-80-v1

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Implementiere die erste versionierte Humanoid-Rig-Vorlage für ungefähr 80 px
hohe Figuren in einer 128×128-Framezelle. Sie enthält fünf explizit
modellierte neutrale Richtungsposen, Bones und Slotbindungen.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 39.

UMSETZUNG
1. Erweitere den Domainvertrag um:
   - `RigTemplate`
   - `DirectionRig`
   - `JointDefinition`
   - `BoneDefinition`
   - `SlotBinding`
   - `DirectionMotionProfile`
2. Lege die Built-in-Vorlage `humanoid-80-v1` als readonly Datenmodul an.
3. Frameprofil:
   - Breite 128
   - Höhe 128
   - Charakterhöhe 80
   - Fußanker 64/112
   - Anchor-Contract-Version 1
   - Slot-Contract-Version 1
4. Definiere fünf eigene Neutralposen:
   - south
   - southEast
   - east
   - northEast
   - north
   Sie dürfen nicht durch bloßes Umbenennen einer einzigen Pose entstehen.
5. Der South-Referenzstand besitzt mindestens folgende stabilen Zentren:
   - root 64/112
   - pelvis 64/78
   - chest 64/58
   - neck 64/44
   - head 64/34
   - shoulder.left 52/52
   - elbow.left 49/68
   - wrist.left 48/82
   - shoulder.right 76/52
   - elbow.right 79/68
   - wrist.right 80/82
   - hip.left 58/78
   - knee.left 57/95
   - ankle.left 56/109
   - hip.right 70/78
   - knee.right 71/95
   - ankle.right 72/109
   Ergänze Hand-/Toe-Joints konsistent.
6. Modelliere diagonale und seitliche Neutralposen mit kontrollierter
   Überdeckung naher/ferner Körperseiten. Dokumentiere die gewählten
   Koordinaten als Produktionsdaten, nicht als JSX.
7. Definiere Bones für Torso, Arme und Beine mit Elternbeziehungen.
8. Verknüpfe jeden Pflichtslot eindeutig mit proximalem und gegebenenfalls
   distalem Joint.
9. Implementiere `validateRigTemplate()` als pure Funktion:
   - alle Pflichtjoints vorhanden
   - Jointkoordinaten im Frame
   - Bones referenzieren existierende Joints
   - keine zyklische Bonehierarchie
   - Limb-Bones haben Länge > Epsilon
   - Pflichtslots vollständig gebunden
   - Fuß-/Toe-Zone nahe Groundline
10. Implementiere einen deterministischen
    `createRigCompatibilityKey()` aus den vertraglich relevanten
    Templatewerten.
11. Zeige im Viewport die Neutralpose, Bones, Joints, Groundline und
    Slotlabels als SVG-Overlay. Noch keine Partplatzierung.
12. Die drei westlichen Richtungsgeometrien werden noch nicht als Assetquellen
    freigegeben; Prompt 44 definiert die Spiegelableitung.

ARCHITEKTUR- UND DATENREGELN
- Built-in-Rigdaten sind immutable und frameworkfrei.
- Koordinaten besitzen eine klare Version.
- Figurenhöhe und Framegröße sind getrennt.
- Rigvalidierung liefert strukturierte Issues mit Pfad.
- UI ändert Built-in-Rigs nicht in-place.
- eigene Custom-Rigs sind nicht Teil des MVP.
- keine Bewegungsschlüssel in der Neutralpose.

TESTS
- South-Referenzkoordinaten
- fünf DirectionRigs vorhanden
- alle Pflichtjoints/-bones/-slots
- Joint innerhalb Frame
- Nullbone wird abgelehnt
- fehlender Joint
- Zyklus
- ungültige Slotbindung
- Groundline-Invariant
- stabiler Compatibility Key
- Rig-Overlay zeigt richtige Richtung
- Wechsel der Richtung aktualisiert Overlay

NICHT TUN
- noch kein Walk-Clip
- keine Partbilder rendern
- keine westlichen Bilder automatisch erzeugen
- keine editierbaren Custom-Rigs
- keine Koordinaten in React-Komponenten duplizieren
- keine Änderung des globalen Prompt-Charakterhöhen-Defaults

DOKUMENTATION
Dokumentiere alle öffentlichen Rigverträge, die South-Referenzpose,
Versionierungsregeln und die Built-in-Template-ID in `src/ARCHITECTURE.md`,
PLANS.md und einem Rig-Dokument.

FERTIG, WENN
- `humanoid-80-v1` ist vollständig typisiert, validiert und sichtbar.
- fünf neutrale Quellrichtungen besitzen eigene Gelenkgeometrie.
- alle Pflichtslots sind bindbar.
- Compatibility Key ist deterministisch.
- ungültige Rigvarianten werden in Tests erkannt.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🦴 feat: add humanoid rig template
```
