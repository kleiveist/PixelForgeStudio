<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 44 — Richtungsabdeckung, Spiegelregeln und asymmetrische Overrides

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Implementiere die kontrollierte Ableitung von Südwest, West und Nordwest im
Modus `fiveAuthoredPlusMirror`. Spiegelung ist eine nachvollziehbare
Produktionsentscheidung und darf asymmetrische oder lichtkritische Teile nicht
still verfälschen.

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
   Prompt 45.

UMSETZUNG
1. Erweitere die Domain um:
   - `DirectionSourceResolution`
   - `DirectionCoverageStatus`
   - `resolveDirectionSource`
   - `resolveProjectDirectionCoverage`
   - `validateMirrorPolicy`
2. Für `fiveAuthoredPlusMirror` gelten:
   - southWest aus southEast
   - west aus east
   - northWest aus northEast
3. Unterscheide:
   - eigene Quelle
   - gültig gespiegelt
   - gespiegelt, Prüfung erforderlich
   - Spiegelung verboten
   - Quelle fehlt
   - optional nicht verwendet
   - Anker unvollständig
4. `MirrorPolicy`:
   - `inherit`
   - `allow`
   - `forbid`
   Projekt-/Kit-Default und Partoverride werden deterministisch aufgelöst.
5. Spiegele Partpixels zur Renderzeit, ohne Originalblob oder Metadaten zu
   duplizieren. Für Sourcepixel/Sourceanchors gilt die Achse des Quellbilds;
   für Rig-Joints wird um die vertikale Root-/FootAnchor-Achse gespiegelt.
6. Dokumentiere und teste die unterschiedlichen Formeln:
   - Sourcepixel: `sourceWidth - 1 - x`
   - Framejoint: `2 * footAnchor.x - x`
7. Rotationen und X-Komponenten von Deltas werden mit korrektem Vorzeichen in
   die Zielrichtung projiziert.
8. Anatomische Slot-IDs werden nicht umbenannt. Ziel-Draw-Order entscheidet
   sichtbare Nah-/Fernseite.
9. Ein eigenes Zielrichtungsasset überschreibt die abgeleitete Spiegelquelle.
10. Baue die vollständige Coverage-Matrix in den Workspace:
    Slot × 8 Richtungen, Symbol + Textstatus.
11. Ergänze einen Reviewdialog für `mirroredNeedsReview`, insbesondere:
    - Waffe/Schild
    - Taschen
    - Narben
    - Schrift/Wappen
    - feste Weltlichtseite
12. Eine bestätigte Spiegelung speichert eine explizite Reviewentscheidung;
    sie wird nicht aus bloßem Schließen des Dialogs abgeleitet.
13. `forbid` ohne eigene Zielquelle ist ein harter Produktionsfehler.
14. `singleDirectionPrototype` bleibt sichtbar als nicht 8-dir-exportbereit.
15. `eightAuthored` verwendet niemals automatisch eine gespiegelte Quelle.

ARCHITEKTUR- UND DATENREGELN
- Originaldaten bleiben unverändert.
- Source- und Frame-Spiegelachsen werden nicht verwechselt.
- Weltlicht wird nicht als mitgespiegelt behauptet.
- bestätigte Reviewentscheidung ist projektbezogene Metadaten.
- eigene Zielquelle besitzt Vorrang.
- Draw-Order kommt aus der Zielrichtung.
- keine anatomische Left/Right-Umbenennung.

TESTS
- alle drei Spiegelpaare
- Sourcepixel-/Anchor-Spiegelung
- Rigjoint-Spiegelung um FootAnchor
- Rotation-/Delta-Vorzeichen
- eigene Quelle gewinnt
- allow/forbid/inherit
- Review required/confirmed
- eightAuthored ohne Fallback
- singleDirectionPrototype blockiert
- Coverage-Matrix mit Symbol und Text
- asymmetrische Waffe
- Ziel-Draw-Order
- Originalmetadata unverändert

NICHT TUN
- keine KI-generierten Ansichten
- keine stille Spiegelung bei `forbid`
- keine weltlichtbezogene Qualitätsbehauptung ohne Review
- keine Blobkopie nur für Spiegelung
- keine ausschließliche Farbcodierung der Matrix
- keine automatische Bestätigung

DOKUMENTATION
Dokumentiere Spiegelachsen, Reviewstatus, Overridevorrang und
Produktionsblocker in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und
Nutzerhilfe.

FERTIG, WENN
- fünf Quellrichtungen können kontrolliert acht Zielrichtungen abdecken.
- jede abgeleitete Quelle bleibt nachvollziehbar.
- asymmetrische/verbote Parts blockieren korrekt.
- Overrides und Reviewentscheidungen funktionieren.
- die Coverage-Matrix erklärt jeden Status.

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

Commit-Vorschlag: 🪞 feat: add directional mirroring policies
```
