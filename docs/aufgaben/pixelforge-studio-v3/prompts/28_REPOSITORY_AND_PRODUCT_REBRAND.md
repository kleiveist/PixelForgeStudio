<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 28 — Repository und Produkt zu PixelForge Studio umbenennen

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Benenne das Dachprodukt und – sofern die Umgebung über die ausdrücklich
benötigten Adminrechte verfügt – das GitHub-Repository von
`kleiveist/PixelartPromptStudio` zu `kleiveist/PixelForgeStudio` um. Das
bestehende Prompt Studio muss funktional und datenkompatibel bleiben.

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
   Prompt 29.

UMSETZUNG
1. Führe vor Veränderungen `npm run verify` und `git diff --check` aus und
   dokumentiere die Baseline.
2. Prüfe `git remote -v`, Repository-Metadaten und Berechtigungen.
3. Wenn eine authentifizierte GitHub CLI mit Repository-Adminrecht vorhanden
   ist, führe den ausdrücklich beauftragten administrativen Rename aus:
   `gh repo rename PixelForgeStudio --repo kleiveist/PixelartPromptStudio --yes`.
   Aktualisiere danach die lokale `origin`-URL unter Beibehaltung von SSH oder
   HTTPS und prüfe `gh repo view kleiveist/PixelForgeStudio`.
4. Wenn der Remote-Rename technisch nicht möglich ist, simuliere ihn nicht.
   Fahre mit sämtlichen lokalen Änderungen fort und dokumentiere genau diese
   eine offene Adminaktion.
5. Ändere in `package.json` den Paketnamen auf `pixelforge-studio` und die
   Beschreibung auf das lokale Dachstudio für Prompt-Produktion und
   Pixelanimation. Lasse die Version bis zum finalen Release-Prompt
   unverändert.
6. Erweitere die zentrale Brand-Konfiguration:
   - Dachprodukt `PixelForge Studio`
   - Modul `PixelForge Prompt Studio` / Kurzlabel `Prompt Studio`
   - Modul `PixelForge Animation Studio` / Kurzlabel `Animation Studio`
   - Short name `PixelForge`
7. Extrahiere den bisherigen stabilen Prompt-Export-Identifier als
   `PROMPT_EXPORT_APPLICATION_ID`. Erhalte
   `EXPORT_APPLICATION_ID` als rückwärtskompatiblen Alias mit exakt demselben
   Stringwert.
8. Führe einen neuen
   `ANIMATION_EXPORT_APPLICATION_ID = "PixelForge Animation Studio"` ein,
   verwende ihn aber noch in keinem unfertigen Exportformat.
9. Aktualisiere sichtbare Dachprodukttexte, `index.html`, README-Überschrift,
   Repositorylinks, AGENTS-Auftrag und Dokumentationsindex. Historische
   Changelog-/Prompttexte werden nicht rückwirkend umgeschrieben.
10. Markiere bestehende V2-Dokumente sprachlich als Spezifikation des
    Prompt-Studio-Moduls, ohne die Historie massenhaft zu verschieben.
11. Ergänze Tests, die Dachmarke, beide Modulnamen und den unveränderten
    Prompt-Protokoll-Identifier festschreiben.
12. Suche abschließend nach unbeabsichtigten produktiven Referenzen auf
    `PixelartPromptStudio` und `pixelforge-prompt-studio`. Historische
    Dokumentation darf Treffer enthalten, produktive Konfiguration nicht.

ARCHITEKTUR- UND DATENREGELN
- Sichtbarer Markenname und persistierte Protokollwerte sind getrennt.
- `EXPORT_APPLICATION_ID` bleibt exakt `"PixelForge Prompt Studio"`.
- Alle bestehenden `pixelforge:v2:*`-Storage-Keys bleiben unverändert.
- Bestehende `schemaVersion: 2`- und `formatVersion: 2`-Promptdaten bleiben
  gültig.
- Keine neue App-Shell oder Navigation in diesem Prompt.
- Keine Änderungen an Promptdefaults oder Profilauflösung.
- Keine Pushes außer einer separat vorliegenden Pushfreigabe; der ausdrücklich
  beauftragte Repository-Rename ist davon als Adminaktion getrennt.

TESTS
- bestehende Brand-/Config-Tests anpassen
- neuer Test: Dachprodukt ist `PixelForge Studio`
- neuer Test: Prompt- und Animationsmodul besitzen getrennte Namen
- Regression: altes ExportBundle mit
  `application: "PixelForge Prompt Studio"` wird weiterhin geparst
- Regression: `EXPORT_APPLICATION_ID === PROMPT_EXPORT_APPLICATION_ID`
- vollständige bestehende Testsuite

NICHT TUN
- keine Storage-Key-Migration
- keine Schema-Versionsanhebung
- keine Paketversion 3.0.0 vorwegnehmen
- keine historischen IDs, Fixtures oder Commits umbenennen
- keine zweite Brand-Konfiguration parallel zur bestehenden Quelle der Wahrheit
- keinen erfolgreichen Remote-Rename behaupten, wenn er nicht geprüft wurde

DOKUMENTATION
Aktualisiere mindestens README.md, AGENTS.md, CHANGELOG.md, docs/index.md,
src/ARCHITECTURE.md und PLANS.md. Lege die endgültigen Naming- und
Kompatibilitätsregeln dauerhaft ab.

FERTIG, WENN
- Code und sichtbare Dokumentation verwenden das Dachprodukt
  `PixelForge Studio`.
- `package.json` heißt `pixelforge-studio`.
- beide Modulnamen sind zentral typisiert verfügbar.
- alte Prompt-Export-Bundles bleiben grün.
- Repository und `origin` tragen den neuen Namen oder der einzelne fehlende
  Adminschritt ist präzise dokumentiert.
- alle Prüfungen sind erfolgreich.

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

Commit-Vorschlag: 🏗️ chore: rebrand repository as PixelForge Studio
```
