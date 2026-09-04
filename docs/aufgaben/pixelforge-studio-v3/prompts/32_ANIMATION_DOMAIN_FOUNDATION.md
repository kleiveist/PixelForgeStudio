<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 32 — Frameworkfreie Animations-, Rig- und Slot-Domain

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Lege die typsichere, frameworkfreie Domain des Animation Studios an. Sie wird
die einzige Quelle der Wahrheit für Richtungen, Körperteilslots, Joints, Bones,
Frameprofile, Spiegelregeln und Projektgrundbegriffe.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 33.

UMSETZUNG
1. Erzeuge ein öffentliches Modul `src/domain/animation/` mit bewusst kleinen
   Dateien und `index.ts`.
2. Definiere den stabilen Richtungskanon:
   `south, southEast, east, northEast, north, northWest, west, southWest`.
3. Implementiere pure Helfer:
   - `isDirection`
   - `getOppositeDirection`
   - `getMirroredDirection`
   - `isAuthoredDirectionForMode`
   - `getRequiredAuthoredDirections`
4. Definiere `DirectionSourceMode`:
   - `singleDirectionPrototype`
   - `fiveAuthoredPlusMirror`
   - `eightAuthored`
5. Definiere den vollständigen Production-Humanoid-Slotkatalog aus der
   Animationsspezifikation. Gruppenzuordnung, Required-/Optional-Status und
   Labeldaten liegen in der Domain, nicht als parallele UI-Literale.
6. Definiere stabile `JointId`- und `BoneId`-Kataloge sowie eine Zuordnung der
   Pflichtslots zu Eltern-/Kindjoint.
7. Definiere grundlegende readonly Typen:
   - `Point`, `Size`, `Rect`
   - `FrameProfile`
   - `SourceAnchors`
   - `Transform2D`, `TransformDelta`
   - `MirrorPolicy`
   - `RigTemplateId`
   - `AnimationActionId` zunächst mindestens `walk`
8. Implementiere pure Vektor-/Winkel-/Matrixgrundlagen, soweit sie keine
   spätere Renderentscheidung vorwegnehmen:
   - add/subtract
   - length
   - angle
   - clamp
   - angle normalization
   - affine 2D matrix compose/invert/apply
9. Definiere den kanonischen Standard:
   - `humanoid-80-v1`
   - Frame 128×128
   - Charakterhöhe 80
   - Fußanker 64/112
10. Implementiere reine Katalog- und Invarianttests. Noch keine konkrete
    Gelenkpose oder Renderingfunktion.
11. Exportiere nur die bewusst öffentliche Domainoberfläche.

ARCHITEKTUR- UND DATENREGELN
- Domain importiert weder React, Zod, Canvas, IndexedDB noch Browser-APIs.
- readonly Kataloge sind stabil und deterministisch geordnet.
- TypeScript `strict`; kein `any`.
- IDs werden nicht aus UI-Labels abgeleitet.
- Richtungsreihenfolge wird nie alphabetisch sortiert.
- `fiveAuthoredPlusMirror` besitzt exakt fünf Quellrichtungen.
- anatomisch links/rechts bleibt unabhängig von visueller Spiegelung.

TESTS
- vollständiger Richtungskanon und Reihenfolge
- Spiegelpaare
- opposite directions
- Required-Directions je SourceMode
- jeder Slot ist eindeutig
- jeder Pflicht-Limb-Slot besitzt gültige Jointbindung
- keine doppelte Joint-/Bone-ID
- Standard-Frameprofil
- Matrix Identity/Compose/Invert/Roundtrip
- Winkelnormalisierung und Nullvektorgrenzen
- öffentliche Exports kompilieren ohne React

NICHT TUN
- keine Zod-Schemas in der Domain
- keine konkrete IndexedDB-Struktur
- kein Canvas
- keine UI
- noch kein eingebautes Rig mit Koordinaten
- keine Tier-/Fahrzeugrigs
- keine künstliche Ableitung unbekannter Ansichten
- keine Stringlabels als Primärschlüssel

DOKUMENTATION
Erweitere `src/ARCHITECTURE.md` um die neue öffentliche
`domain/animation`-Grenze und ihre Nicht-Abhängigkeiten. Ergänze PLANS.md und
CHANGELOG.md.

FERTIG, WENN
- Animation-Domain besitzt stabile, getestete Grundverträge.
- Richtung, Slots, Joints und Bones sind aus einer Quelle typisiert.
- Standardframe und SourceModes sind definiert.
- Matrix-/Vektorgrundlagen sind pure und grün.
- kein Browser- oder React-Import befindet sich in der Domain.

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

Commit-Vorschlag: 🦴 feat: define animation rig domain
```
