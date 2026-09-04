<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 29 — Modulbasierte Studio-Routen mit Bestandskompatibilität

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Erweitere die pure Navigation von sechs Prompt-Views zu einer typisierten
Dachnavigation für Home, Prompt Studio und Animation Studio. Bestehende
`?view=...`-URLs müssen weiterhin funktionieren.

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
   Prompt 30.

UMSETZUNG
1. Benenne die bestehende View-Domain behutsam zu einer Prompt-Studio-Domain
   oder erhalte kompatible Aliase, sodass bestehende Importe nicht unnötig
   brechen.
2. Definiere pure readonly Kataloge und Typen:
   - `StudioId = "home" | "prompt" | "animation"`
   - bestehende sechs `PromptStudioView`
   - `AnimationStudioView = "projects" | "workspace" | "library" | "rigs"`
   - discriminated union `StudioRoute`
3. Definiere die kanonischen Query-Parameter:
   - `studio`
   - `view`
   - optional `project` nur beim Animation-Workspace
4. Implementiere einen Parser, der folgende Formen unterscheidet:
   - gültige neue Route
   - fehlende Route
   - gültige bestehende Prompt-Route
   - ungültige/mehrdeutige Route
5. Mappe `?view=<altePromptView>` deterministisch auf
   `{studio:"prompt", view:<altePromptView>}`.
6. Implementiere einen kanonischen Serializer. Er darf fremde, nicht
   kollidierende Query-Parameter kontrolliert erhalten, aber doppelte
   Studio-/View-/Project-Parameter nicht still akzeptieren.
7. `project` ist nur als validierte StableId und nur für
   `studio=animation&view=workspace` zulässig.
8. Erweitere den injizierbaren Navigation-Adapter und den
   Navigation-Provider auf `StudioRoute`.
9. Bestehende Prompt-Routen werden nach erfolgreichem Lesen per `replaceState`, nicht
   `pushState`, kanonisiert.
10. Browser-Zurück/Vorwärts bleibt aktiv. Route und Providerstate dürfen nicht
    auseinanderlaufen.
11. Erhalte Übergangsaliase für vorhandene Komponenten, bis Prompt 30 die
    Shell umstellt.
12. Aktualisiere öffentliche Exports und Architekturgrenzen.

ARCHITEKTUR- UND DATENREGELN
- Parser und Serializer bleiben frameworkfrei.
- Keine Router-Bibliothek ergänzen.
- Die URL ist die kanonische Navigationsrepräsentation, nicht ein zweiter
  inkompatibler State.
- Fragmentanker bleiben für Skip-Links frei.
- Rohdateinamen, Blob-IDs oder unvalidierte Werte gehören nicht in die URL.
- Fallback ohne gültige Route wird noch nicht durch neue Settings entschieden;
  nutze einen injizierbaren, getesteten Fallback.

TESTS
- alle sechs alten `?view=`-Routen
- Home-Route
- jede Prompt-View in neuer Form
- jede Animation-View
- Workspace mit gültiger Projekt-ID
- Project-Parameter in falscher View wird abgelehnt
- doppelte Parameter werden abgelehnt
- unbekannte Studio-/View-Werte
- Roundtrip `parse(serialize(route))`
- fremde Query-Parameter
- `popstate`
- Kanonisierung bestehender Routen mit `replaceState`
- bestehende Navigationstests als Regression

NICHT TUN
- keine sichtbare neue Shell in diesem Prompt
- keine Animation-Projektlogik
- keine URL mit Hash als View-Router
- kein `window.location`-Zugriff in Domainfunktionen
- keine Type Assertions für unvalidierte Query-Werte
- alte Prompt-Views nicht entfernen

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md` um Route, Bestandskanonisierung und
Modulgrenzen. Dokumentiere in PLANS.md die alte und neue URL-Matrix.

FERTIG, WENN
- alle gültigen Studio-Routen sind typisiert und roundtrip-stabil.
- alte Links öffnen weiterhin exakt die bisherige Prompt-View.
- Browsernavigation funktioniert.
- ungültige Routen liefern strukturierte Resultate.
- vorhandene Komponenten können über Übergangsadapter weiter kompilieren.

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

Commit-Vorschlag: 🧭 feat: add studio module routing
```
