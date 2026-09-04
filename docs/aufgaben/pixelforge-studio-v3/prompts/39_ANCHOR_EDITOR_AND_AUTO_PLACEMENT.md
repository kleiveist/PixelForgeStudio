<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 39 — Ankereditor und automatische Partplatzierung

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Ermögliche das Einrichten proximaler/distaler Anker und platziere importierte
Körperteile automatisch auf dem gewählten Rig-Bone. Die automatische
Grundtransformation muss jederzeit reproduzierbar bleiben.

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
   Prompt 40.

UMSETZUNG
1. Implementiere pure Funktionen:
   - `validateSourceAnchors`
   - `resolveEffectiveAnchor(trimRect, sourceAnchor)`
   - `resolveBonePlacement`
   - `applyTransformDelta`
2. `resolveBonePlacement` berechnet:
   - Quellvektor zwischen proximal/distal
   - Zielvektor zwischen Parent-/Child-Joint
   - Uniform Scale
   - Rotationsdifferenz
   - Translation auf den Parent-Joint
3. Behandle Null-/Fast-Null-Quelllängen als strukturierten Fehler.
4. Definiere sichtbare Warnschwellen für extreme Scale-Werte; kein stilles
   Clamp, das die Daten verfälscht.
5. Einpunktige Parts wie Kopf/Torso/Becken verwenden proximalen Anker plus
   versionierte Defaultorientierung. Limb-Parts benötigen zwei Anker.
6. Baue einen Ankerbearbeitungsmodus im Viewport:
   - Originalbild groß und pixelgenau
   - proximalen Anker setzen
   - distalen Anker setzen, falls erforderlich
   - optional Pivot
   - Koordinatenfelder als Tastaturalternative
   - Zoom/Pan
   - Reset
7. Pointeraktionen snappen standardmäßig auf ganze Quellpixel.
8. Zeige nach gültiger Einrichtung eine Live-Vorschau des Parts am Bone:
   zunächst über eine einfache Anzeigeadaptergrenze; finaler Rasterrenderer
   folgt in Prompt 40.
9. Speichere Anker in Originalbildkoordinaten und die automatische
   Grundtransformation nicht redundant als absolute Pixelwerte.
10. Erlaube manuelle, projektweite Part-Deltas:
    - offsetX/Y
    - rotationDelta
    - uniform scale multiplier in engem, validiertem Bereich
11. Speichere Deltas getrennt von SourceAnchors und Rig.
12. Aktualisiere Coverage-Status:
    `ready`, `anchorsPending`, `invalidAnchors`, `missing`.
13. Ein Part wird erst `ready`, wenn alle slotabhängigen Anker gültig sind.
14. Wechsel der Rig-Vorlage oder DirectionRig berechnet die Platzierung neu;
    die Quellanker bleiben erhalten.

ARCHITEKTUR- UND DATENREGELN
- SourceAnchors sind Originalkoordinaten.
- EffectiveAnchors berücksichtigen TrimRect genau einmal.
- automatische Platzierung ist pure Domainlogik.
- manuelle Korrekturen sind Deltas.
- keine nicht uniforme Skalierung.
- keine Canvas-Koordinaten als persistierte Quelle.
- ein Anker wird nicht aus Dateiname oder Bounding Box geraten.

TESTS
- effektiver Anker nach Trim
- Boneplacement für Translation, Rotation, Scale
- 90°-/180°-Fälle
- Nullquelllänge
- extremer Scale-Warnfall
- einpunktiger Part
- Limb-Part mit fehlendem Distalanker
- UI setzt Anchor per Koordinatenfeld
- Pointer-Snap
- Reset
- Persistenz/Resume
- Rig-/Richtungswechsel berechnet neu
- Delta verändert Grundtransformation nicht
- Coverage-Status

NICHT TUN
- noch kein vollständiger Frame-/Layer-Renderer
- keine nicht uniforme Skalierung
- keine Sourcebilder überschreiben
- keine absoluten Auto-Transforms dauerhaft als zweite Wahrheit speichern
- keine Anker ausschließlich per Maus
- keine stillen extremen Werte

DOKUMENTATION
Dokumentiere Ankerkoordinaten, Placementformel, Delta-Modell und Warnschwellen
in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- alle Pflichtparts können über klare Ankerregeln eingerichtet werden.
- automatische Placement-Matrix ist reproduzierbar.
- Live-Vorschau reagiert auf Anchors und Deltas.
- Trim und Originalkoordinaten driften nicht auseinander.
- Coverage zeigt verlässlich, welche Parts produktionsbereit sind.

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

Commit-Vorschlag: 🎯 feat: add anchor placement workflow
```
