<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 41 — Richtungsabhängige Ebenenreihenfolge und Clippingdiagnostik

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Definiere für alle acht Zielrichtungen eine stabile Draw-Order und verbinde
Pflicht- sowie Ausrüstungsslots mit dem Renderer. Die gleiche globale
Layerliste darf nicht für jede Blickrichtung verwendet werden.

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
   Prompt 42.

UMSETZUNG
1. Definiere einen frameworkfreien Layervertrag:
   - `LayerGroup`
   - `DirectionDrawOrder`
   - `resolveDirectionDrawOrder`
   - `validateDrawOrder`
2. Lege für alle acht Richtungen explizite Draw-Orders an. Sie werden nicht
   alphabetisch oder allein durch Spiegeln sortiert.
3. Berücksichtige:
   - `hair.back`, `cape.back`, `back.item` früh
   - fernes Bein/ferner Arm
   - Becken/Torso
   - nahes Bein/naher Arm
   - Kopf/Gesicht/Haare vorn
   - vordere Waffen/Schilde/Accessoires
4. Definiere für jede Richtung, welche anatomische Seite visuell näher an der
   Kamera liegt.
5. Optional nicht belegte Slots werden übersprungen, belegte Slots erscheinen
   genau einmal.
6. Freie Accessoires besitzen:
   - Attachment-Joint
   - Default-LayerGroup
   - optionalen projektweiten Layer-Offset
7. Implementiere eine Produktionsvalidierung:
   - unbekannter Slot
   - doppelter Slot
   - belegter Pflichtslot fehlt in Order
   - Attachment-Joint fehlt
8. Integriere die aufgelöste Order in `renderFrame`.
9. Ergänze im Inspektor eine verständliche Layeranzeige. Nutzer dürfen
   projektweite Part-Layer-Deltas setzen; per-Frame Overrides folgen in
   Prompt 46.
10. Zeige Clippingdiagnostik im Viewport:
    - Bounding-Box-Warnung
    - betroffene Framekante
    - vollständig außerhalb als Fehler
11. Lege synthetische farbige Partfixtures an, mit denen Vorder-/Hinterordnung
    pixelgenau sichtbar geprüft wird.
12. Halte Weltlicht und Draw-Order getrennt; Layering darf keine Bildquelle
    spiegeln.

ARCHITEKTUR- UND DATENREGELN
- Draw-Order ist versionierte Rig-/Richtungsinformation.
- anatomische Seite und visuelle Nähe sind getrennte Begriffe.
- optionaler Slot wird nicht zur Pflicht.
- Layer-Delta speichert eine kleine Abweichung, keine duplizierte Komplettliste.
- Renderer erhält die bereits aufgelöste Reihenfolge.
- keine DOM-Sortierung als Fachlogik.

TESTS
- jede der acht Richtungen besitzt eine Order
- alle Pflichtslots genau einmal
- optionale Slots werden korrekt eingefügt
- nahe/ferne Seite für Ost/West/Diagonal
- doppelter/unbekannter Slot
- fehlender Attachment-Joint
- Layer-Delta
- farbige Pixel-Fixtures für Überdeckung
- Clipping links/rechts/oben/unten
- vollständig außerhalb
- Inspektor zeigt Reihenfolge
- Richtungswechsel aktualisiert Rendering

NICHT TUN
- keine automatische Richtungsbild-Spiegelung
- keine Walk-Bewegung
- keine per-Frame-Layer-Overrides
- keine globale DOM-z-index-Lösung für Pixelparts
- keine Pflichtslots durch Ausrüstung ersetzen
- keine Layerliste als UI-only State

DOKUMENTATION
Dokumentiere Layergruppen, Nah-/Fernseite, Draw-Order-Version und
Clippingdiagnostik in `src/ARCHITECTURE.md`, PLANS.md und CHANGELOG.md.

FERTIG, WENN
- alle acht Zielrichtungen haben eine geprüfte Draw-Order.
- Renderer zeichnet belegte Parts exakt in dieser Reihenfolge.
- Ausrüstung und freie Accessoires besitzen kontrollierte Einordnung.
- Clipping ist sichtbar diagnostiziert.
- Richtungsspezifische Überdeckung ist pixelgenau getestet.

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

Commit-Vorschlag: 🥞 feat: add directional layer ordering
```
