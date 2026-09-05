<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 45 — Richtungsprojektion und vollständiger 8-Richtungs-Walk

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Projiziere den versionierten Walk-Clip auf alle acht DirectionRigs und rendere
den vollständigen Satz aus 64 Frames. Kamera, Fußanker, Höhe, Richtungskanon
und Weltlichtregeln bleiben konsistent.

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
   Prompt 46.

UMSETZUNG
1. Vervollständige `humanoid-80-v1` um auflösbare Zielgeometrie für alle acht
   Richtungen:
   - fünf explizite Neutralposen
   - drei kontrolliert gespiegelte Geometrien
2. Definiere pro Richtung ein `DirectionMotionProfile`:
   - sichtbare Schrittachse
   - Stride-Amplitude
   - Knee-/Foot-Lift
   - Armamplitude
   - Root-Sway-Projektion
   - Bend-Orientierung
3. Implementiere pure Funktionen:
   - `resolveDirectionRig`
   - `projectWalkChannels`
   - `resolveDirectionalWalkPose`
   - `generateDirectionalFrames`
   - `generateEightDirectionWalkSet`
4. Verwende abgestufte Standardamplituden:
   - Seite: Oberschenkel bis 18°, Unterschenkel bis 28°, Arm bis 14°
   - Diagonal: 14° / 22° / 11°
   - Front/Rücken: 9° / 18° / 8°
   Werte liegen als versionierte Daten vor.
5. Kontaktkorrektur wird auf die jeweilige Ground-/Schrittachse projiziert.
6. Der vollständige Generator erzeugt exakt:
   - 8 Richtungen
   - 8 Frames je Richtung
   - 64 adressierbare Renderframes
7. Reihenfolge ist der kanonische Directionkatalog; keine alphabetische
   Sortierung.
8. Vor Generierung Produktionsvalidierung:
   - Required-Slots
   - gültige Anchors
   - Direction Coverage
   - Mirror Reviews
   - Rig/Clip
   - Blobverfügbarkeit
9. Nach Generierung Konsistenzdiagnostik:
   - Framegröße
   - FootAnchor
   - Körperhöhe zwischen Richtungen maximal ±1 px, soweit Silhouettenmessung
     zuverlässig ist
   - kein komplett fehlender Pflichtpart
   - Clipping
   - NaN/Infinity
10. Zeige im Workspace Direction-Auswahl und Vorschau für jede Richtung.
11. Füge einen `Alle Richtungen prüfen`-Modus mit 8 kleinen
    Previewfeldern hinzu; keine automatisch laufenden acht Animationen bei
    reduzierter Bewegung.
12. Cache Frames pro Richtung und Projektrevision.
13. Fehler in einer Richtung dürfen nicht als vollständiger Exportstatus
    erscheinen.

ARCHITEKTUR- UND DATENREGELN
- DirectionMotionProfile ist Domain-/Rig-Information.
- Clip bleibt ein gemeinsamer normierter Bewegungsvertrag.
- Weltlicht wird nicht per Renderer neu erfunden.
- gerenderte Frames werden nicht als primäre Projektmetadaten gespeichert.
- westliche Geometry darf abgeleitet sein; Partquelle folgt Prompt 44.
- alle Outputs sind deterministisch.

TESTS
- DirectionRig für alle acht
- Amplitudenprofile Seite/Diagonal/FrontBack
- exakt 64 Frames
- kanonische Reihenfolge
- FootAnchor je Richtung
- Kontaktkorrektur
- Height-Toleranz
- fehlende Richtung/Part/Blob
- Mirror Review blockiert
- Clippingdiagnostik
- Framecache je Revision
- einzelne und All-Directions-Preview
- reduzierte Bewegung
- Pixelgleichheit bei Wiederholung

NICHT TUN
- keine SpriteSheet-Datei erzeugen
- keine Richtung aus nur South erfinden
- keine 3D-Rotation
- keine alphabetische Sortierung
- keine automatisch laufende Previewwand
- keine Erfolgsanzeige bei Teilfehlern
- keine Richtungsspezialwerte in JSX

DOKUMENTATION
Dokumentiere DirectionMotionProfiles, 64-Frame-Vertrag,
Konsistenzdiagnostik und Cache in `src/ARCHITECTURE.md`, PLANS.md,
CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein gültiges Fünf- oder Acht-Richtungs-Partset erzeugt exakt 64 Frames.
- alle Richtungen sind prüfbar.
- Coverage-, Anchor- und Mirror-Fehler blockieren sauber.
- Höhe, FootAnchor und Reihenfolge sind getestet.
- Frames bleiben reproduzierbar.

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

Commit-Vorschlag: 🧭 feat: generate eight-direction walk sets
```
