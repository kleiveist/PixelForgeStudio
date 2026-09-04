<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 42 — Versionierter 8-Frame-Walk-Clip und South-Generator

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Implementiere die erste echte automatische Laufanimation:
`walk-humanoid-8-v1`. Aus dem neutralen South-Rig und eingerichteten Parts
werden acht deterministische Walk-Frames erzeugt.

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
   Prompt 43.

UMSETZUNG
1. Definiere den Clipvertrag:
   - Template-ID `walk-humanoid-8-v1`
   - Aktion `walk`
   - 8 Frames
   - 10 FPS Default
   - Loop
   - phasenbasierte normierte Bewegungskanäle
2. Verwende die verbindlichen Phasen:
   0 Kontakt links
   1 Down links
   2 Passing links
   3 Up links
   4 Kontakt rechts
   5 Down rechts
   6 Passing rechts
   7 Up rechts
3. Lege die normierten Basiskanäle aus der Produktionsspezifikation als
   versionierte readonly Daten ab:
   - left/right stride
   - root bob
   - root sway
   - gegenläufiger Armswing
   - Knee-/Foot-Lift
4. Implementiere pure Funktionen:
   - `resolveClipFrame`
   - `resolveHumanoidWalkPose`
   - `applyPoseToDirectionRig`
   - `validatePose`
5. Für South:
   - linkes/rechtes Bein phasenverschoben
   - Arme gegenläufig zu den Beinen
   - Root-Bob maximal ±1 px im Standard
   - Kopf/Torso erhalten kontrollierte Gegenbewegung
6. Implementiere eine deterministische Kontaktkorrektur. Kontaktfuß bleibt in
   Kontakt-/Down-Phasen auf der projektierten Groundline.
7. Falls dafür Two-Bone-IK verwendet wird:
   - pure Funktion
   - Zielabstand kontrolliert clampen
   - Bend-Richtung pro Seite definiert
   - unerreichbares Ziel erzeugt Diagnostik, keinen NaN-Wert
8. Erzeuge aus Projekt + South-Parts acht `RenderedFrame`-Objekte über den
   Renderer aus Prompt 40.
9. Aktivieren den Clip nur, wenn alle Pflichtparts für South `ready` sind.
10. Zeige Produktionsfehler gesammelt:
    - Part fehlt
    - Anchors pending
    - ungültige Bone-Länge
    - Renderfehler
11. Erzeuge eine neutrale synthetische Humanoid-Fixture, die ohne private
    Nutzerassets alle acht Frames testbar macht.
12. Füge einen Framevergleich hinzu:
    - Frame 0 und 4 besitzen Gegenphase
    - Loopende stimmt kontrolliert mit Startbewegung überein
    - Figurenhöhe bleibt im Toleranzbereich

ARCHITEKTUR- UND DATENREGELN
- Clipdaten sind Domainwerte, keine JSX-Konstanten.
- keine Zwischenbildinterpolation; jeder der acht Frames wird explizit
  aufgelöst.
- South ist der einzige produktiv generierte Direction-Clip in diesem Prompt.
- Fußkontakt und Root-Anker sind getrennt.
- keine Speicherung gerenderter Frames als Projektquelle der Wahrheit.
- Projekt speichert Template-ID, FPS und Overrides, nicht 64 PNGs.

TESTS
- Clip-ID, Framezahl, FPS und Loop
- Phasenreihenfolge
- normierte Kanäle
- Gegenphase links/rechts
- Arm-/Bein-Gegenlauf
- Root-Bob-Grenze
- Kontaktfuß-Groundline
- IK normal, geclamped, unerreichbar
- fehlender Part/Anchor
- acht deterministische South-Frames
- Frame 0 vs. 4
- Height-Toleranz
- kein NaN/Infinity
- wiederholtes Rendern pixelgleich

NICHT TUN
- noch keine anderen sieben Richtungen generieren
- keine Timeline-Wiedergabe
- keine KI- oder Morphing-Zwischenbilder
- keine gerenderten PNGs in Projektmetadaten
- keine zufälligen Bewegungswerte
- keine Handzeichnung in Tests

DOKUMENTATION
Dokumentiere Clipkanäle, Kontaktregel, eventuelle IK-Grenzen und South-MVP in
`src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein vollständiges South-Partset erzeugt automatisch acht Walk-Frames.
- Kontakt, Gegenphase und Höhenregel sind getestet.
- Fehler blockieren sauber.
- Renderframes sind pixelgenau und reproduzierbar.
- Clip bleibt als versionierte Vorlage rekonstruierbar.

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

Commit-Vorschlag: 🚶 feat: generate humanoid walk cycle
```
