# PixelForge Prompt Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Release v1.0.0, Issue #1 — Deutsch/Englisch-Lokalisierung abgeschlossen
- **Nächste Aufgabe:** #2 Branding, danach #3–#9 in Reihenfolge
- **Beauftragt:** alle neun GitHub-Issues umsetzen; je Issue ein separater
  englischer Conventional Commit mit vorangestelltem Emoji, danach Push und
  GitHub-Issue als erledigt schließen.
- **Release-Fortschritt:** #1 umgesetzt und geprüft; #2–#9 offen.
- **Abnahme #1:** 644 Tests in 114 Dateien, Typecheck und Build; 16/16
  Browser-Smokes in Chromium/Firefox; `git diff --check` sauber.
  Die eingeschränkte Testsitzung benötigt lokale Browserbibliotheken und
  deaktivierte Firefox-Content-Sandbox; keine App-Konfiguration dafür geändert.
- **Umgebung:** Node 22 und npm 10 verfügbar; Docker-Laufzeit noch zu prüfen.
- **Prompt-Studio-Releasehistorie:** Prompts 00–27 unter `docs/erledigt/`
- **Ausgemusterte V3-Historie:** Prompts 28–51 unter
  `docs/erledigt/pixelforge-studio-v3/`
- **Arbeitsregel:** genau eine konkret beauftragte Aufgabe umsetzen, prüfen
  und erst auf ausdrücklichen Auftrag committen

## Verbindlicher Produktstand

Das produktive Repository enthält ausschließlich das **PixelForge Prompt
Studio V2**. Es verwaltet lokale Produktionsprofile und Wizard-Entwürfe und
erzeugt Hauptprompt, Negativprompt, technische Spezifikation sowie die
kombinierte Ausgabe.

Die vor diesem Rückbau ergänzten auswahlorientierten Antworten für alle neun
Fachbereiche und das bestätigte, referenzsichere Löschen von
Produktionsfamilien bleiben Bestandteil des Prompt Studio. Die dazugehörigen
Schema-V2-, Hydrations-, Autosave- und Referenzschutzverträge ändern sich
nicht.

Die abgeschlossene ehemalige V3-Serie ist nur historische Evidenz. Sie ist
weder aktive Aufgabenliste noch Beschreibung aktueller Produktfunktionen.

## Prompt-only-Rückbau — Auftrag und Abnahme

### Ausgangsstand

Release 3.0 enthielt Prompt Studio V2 und Animation Studio V1 unter einer
gemeinsamen Dach-Shell. Die unveränderte Baseline bestand mit 179
Testdateien, 1087 Tests, Strict-Typecheck und Produktionsbuild.

### Auftrag

Animationsprojekte, Workspace, Character Kits, Rigbibliothek, PNG-Part-Import,
Rendering, Exporte, Worker, IndexedDB-Repository und Prompt-Handoff vollständig
aus dem produktiven Arbeitsbaum entfernen. Sichtbar und navigierbar bleibt
ausschließlich das PixelForge Prompt Studio.

### Kompatibilitätsgrenze

- Prompt-Schema und Exportformat bleiben V2.
- Der persistierte Identifier bleibt `PixelForge Prompt Studio`.
- Die sechs `pixelforge:v2:*`-localStorage-Keys bleiben stabil.
- Promptdefaults, Profilauflösung, Capabilities, Compatibility Key und
  V1→V2-Promptmigration bleiben unverändert.
- Die früher additiven Settings-Felder `startStudio` und
  `animationStartView` bleiben zum Einlesen alter Settings und Export-Bundles
  erhalten, steuern aber weder UI noch Navigation.
- Animationsangaben innerhalb eines Promptprofils bleiben fachliche
  Promptwerte. Sie erzeugen keine Animationsprojekte und gehören weiterhin
  zum V2-Promptvertrag.

### Akzeptanzkriterien

- keine Animation-Routen, -Navigation, -Buttons oder -Provider,
- keine Animationsdomain, -Schemas, -Services, -Worker oder aktive
  Animationsdokumentation,
- keine ausschließlich für Animation benötigten Paketabhängigkeiten,
- alte Dach-, Animations- und Projekt-URLs werden auf die konfigurierte
  Prompt-Startansicht repariert,
- alle fünf Prompt-Ansichten bleiben zugänglich, responsiv und getestet,
- `npm run verify`, Chromium-/Firefox-Smokes und `git diff --check` sind grün.

## Prompt-only-Rückbau — Ergebnis

1. Dach-Startseite, Studio-Umschalter und sämtliche sichtbaren
   Animation-Studio-Flächen sind entfernt. Die Shell führt nur noch durch
   Dashboard, Profile, Wizard, Ausgabe und Einstellungen.
2. Animationsdomain, Projekt-/Workspace-Features, Character Kits,
   Rigbibliothek, PNG-Part-Import, Renderer, Exporte, Handoff, Provider,
   Schemas, Repositories, Worker und zugehörige Fixtures/Tests sind aus dem
   produktiven Arbeitsbaum entfernt.
3. Routen akzeptieren nur `studio=prompt`. Alte `?view=`-Promptlinks bleiben
   kompatibel; `review` wird auf `output` kanonisiert. Ehemalige Home-,
   Animations- und Projekt-URLs werden ohne Storage-Write auf die
   konfigurierte Prompt-Startansicht repariert.
4. Marke, HTML-Metadaten, README, aktive Spezifikationen, Architektur,
   Changelog und Browser-Smokes beschreiben den Prompt-only-Stand. Die
   ehemalige V3-Serie bleibt ausschließlich als historische Evidenz unter
   `docs/erledigt/pixelforge-studio-v3/` erhalten.
5. `fflate` und `fake-indexeddb` sind einschließlich Lockfile-Einträgen
   entfernt. Der Produktionsbuild enthält nur Prompt- und gemeinsame
   Vendor-Chunks.
6. Prompt-Schema/Exportformat V2, Application-Identifier, Storage-Keys,
   Defaults und Promptmigration bleiben stabil. Alte additive Settings-Felder
   bleiben lesbar, besitzen aber keine UI- oder Navigationswirkung.
7. Bereits in einem Browser vorhandene Animations-IndexedDB-Daten werden vom
   neuen Code weder geöffnet noch gelöscht. Das vermeidet eine ungefragte,
   destruktive Datenbereinigung; für das Prompt Studio sind diese Daten
   funktionslos.

## Abschlussnachweise

- `npm run verify`: erfolgreich
  - Strict-Typecheck erfolgreich
  - 112 Testdateien und 635 Tests erfolgreich
  - Produktionsbuild mit 298 Modulen erfolgreich
- `npm run test:browser`: 12/12 Smokes in Chromium und Firefox erfolgreich
  - alle fünf Prompt-Routen
  - alte Promptlinks und ausgemusterte URLs
  - Tastaturfokus, Responsive Reflow und Reduced Motion
- Paketbaum: keine Installation von `fflate` oder `fake-indexeddb`
- lokaler Markdown-Zielaudit: 10 aktive Dateien ohne fehlende Ziele
- `git diff --check`: sauber
- Kein Commit und kein Push ausgeführt.

PyGitIndex ist in dieser Docker-Sitzung nicht installiert. Der kleine aktive
Dokumentationsindex wurde deshalb passend zum Dateibaum aktualisiert und die
lokalen Markdown-Ziele separat geprüft.

## Übergabe

Es gibt keine nächste Aufgabe. Neue funktionale Arbeiten beginnen erst nach
einem konkreten Auftrag und müssen die öffentlichen Modulgrenzen in
`src/ARCHITECTURE.md` sowie den Status hier aktualisieren.
