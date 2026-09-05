<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 36 — Produktive Workspace-Oberfläche für Rigging und Timeline

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Ersetze den Animation-Workspace-Placeholder durch die vollständige,
responsiv zugängliche Arbeitsflächenstruktur. Die Paneele und Zustände müssen
stehen, bevor Import, Rigging und Rendering schrittweise aktiviert werden.

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
   Prompt 37.

UMSETZUNG
1. Implementiere `AnimationWorkspace` für ein geladenes aktives Projekt.
2. Erzeuge die Desktopstruktur:
   - Projekt-/Clip-Toolbar oben
   - Teileinventar links
   - zentraler Rig-/Pixel-Viewport
   - Part-/Frame-/Projektinspektor rechts
   - Timeline unten
3. Toolbar:
   - Projektname
   - Save-Status
   - Richtungsauswahl
   - Clipauswahl
   - Play/Pause zunächst disabled mit Erklärung
   - Export zunächst disabled mit Erklärung
4. Teileinventar:
   - Gruppen aus dem Domain-Slotkatalog
   - Required-/Optional-Status
   - Belegungsstatus
   - zugängliche Auswahl
   - Importaktion zunächst als Anschlussstelle für Prompt 37
5. Zentraler Viewport:
   - 128×128 Framegrenze
   - Schachbrett oder neutraler Testhintergrund
   - ganzzahlige Zoomstufen 1×, 2×, 4×, 8×, 12×, 16×
   - Panning
   - Overlay-Schalter für Grid, Rig, Anchors, Bounding Boxes, Footline
   - noch kein echter Part-Renderer
6. Inspektor:
   - kontextabhängige leere Zustände für Projekt, Part und Frame
   - alle späteren Eigenschaften strukturell vorbereitet
   - keine nicht funktionierenden editierbaren Fake-Felder
7. Timeline:
   - acht Walk-Frameplätze
   - Frameauswahl
   - FPS-Anzeige
   - noch keine Wiedergabe
8. Halte temporäre Auswahlwerte lokal oder in einem kleinen
   Workspace-Reducer:
   - Richtung
   - Frame
   - selektierter Slot
   - aktives Paneel
   Persistierte Projektmetadaten bleiben im ProjectProvider.
9. Mittlere Breite: Inventar und Inspektor umschaltbar.
10. Kleine Breite: schrittweise Tabs `Teile`, `Viewport`,
    `Eigenschaften`, `Timeline`.
11. Jede Canvas-nahe Funktion besitzt eine DOM-basierte Bedienalternative.
12. Ergänze Lade-, Fehl-, Kein-Projekt- und fehlender-Blob-Empty-States.

ARCHITEKTUR- UND DATENREGELN
- Workspace liest das aktive Projekt aus dem Provider.
- UI-Konfigurationen werden aus Domainkatalogen erzeugt.
- keine persistierte Auswahl für rein temporäre Paneelzustände.
- keine CSS-Inlinefarben; bestehende Tokens.
- Viewport-DOM ist nicht Quelle der Rig-Daten.
- Zoom verändert nur die Anzeige, nicht die Exportauflösung.
- Framezelle bleibt 128×128 in Projektkoordinaten.

TESTS
- geladenes Projekt zeigt Workspace
- kein Projekt zeigt korrekten Empty State
- Lade-/Repositoryfehler
- Slotgruppen und Required-Status
- Richtung und Frame auswählbar
- Zoomstufen
- Overlay-Schalter
- mittleres/kleines Layout über semantisches DOM-Verhalten
- Fokus nach Paneelwechsel
- keine enabled Play-/Exportaktion vor Funktion
- Keyboard-only Auswahl
- Save-Status sichtbar

NICHT TUN
- kein PNG-Import implementieren
- keine Dummybilder als echtes Projekt speichern
- kein Canvas-Rendering der Figur
- keine Timeline-Wiedergabe
- keine direkte Repository-Verwendung in Unterkomponenten
- keine Pointer-only Paneelbedienung
- keine feste Desktopbreite, die kleinere Viewports unzugänglich macht

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und das
Accessibility-/Responsive-Dokument um Workspace-Paneele und Ownership.

FERTIG, WENN
- vollständige Workspace-Informationsarchitektur ist produktiv vorhanden.
- alle zukünftigen Featuregrenzen besitzen klare Anschlussstellen.
- Projekt-, Slot-, Richtung- und Frameauswahl ist zugänglich.
- responsive Zustände sind getestet.
- keine unfertige Aktion erscheint fälschlich als verfügbar.

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

Commit-Vorschlag: 🖥️ feat: build animation workspace shell
```
