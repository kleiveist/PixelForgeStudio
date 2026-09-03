<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — Implementierungsstatus

## Stand

Die vollständige nummerierte V2-Serie **Prompt 00–27 ist abgeschlossen**.
Prompt 27 bindet die V1→V2-Migration vor dem ersten Provider-Read ein, macht
den vollständigen Workspace-JSON-Transfer in Einstellungen zugänglich und
dokumentiert die bestandene Release-Abnahme. Der separate Release-Commit trägt
den Betreff `🚀 release: complete PixelForge Prompt Studio v2 migration`.

Prompt 18 ist vollständig in Commit `6dabbbb` enthalten. Dessen Betreff
(`♻️ refactor: Code vereinfachen und strukturieren`) beschreibt den Inhalt
unzutreffend, denn der Commit führt den Static-Object-Editor samt Domain,
Schema-, Wizard-, Dashboard- und Testintegration ein. Prompt 19 und Prompt 20
folgen als getrennte Feature-Commits `433eeda` beziehungsweise `2557c94`;
der Dokumentationsstand vor Prompt 21 liegt in `446cbd0`, Prompt 21 selbst in
`bb90757`.

React, TypeScript und Vite bilden nun die einzige aktive Apparchitektur. Die
ausführbare V1-UI wurde erst nach automatisierter und manueller Paritätsprüfung
entfernt. Pure Migrations-/Kompatibilitätslogik und synthetische Verträge
bleiben unter `src/domain/legacy-v1/` und `src/test/fixtures/legacy-v1/`
erhalten; der entfernte Quellstand bleibt über Git wiederherstellbar.

## Abgeschlossene Grundlagen

| Prompt | Ergebnis |
|---:|---|
| 00 | reproduzierbare Legacy-V1-Baseline, Fixtures und Migrationsinventar |
| 01 | React-/TypeScript-/Vite-Grundgerüst mit Strict TypeScript und Testsetup |
| 02 | bestehende Prompt-, Default- und Metriklogik als frameworkfreie TypeScript-Domain |
| 03 | neun Asset-Kategorien, Untertypen und getrennte Capabilities für Richtung und Animation |
| 04 | strikte Schema-V2-Verträge mit Zod und daraus abgeleitete TypeScript-Typen |

## Abgeschlossene beauftragte Phasen 05–27

| Prompt | Commit | Umgesetzter Stand |
|---:|---|---|
| 05 | `b258b37` | Base→Category→Asset-Vererbung, Locks, Konflikte und Compatibility Key |
| 06 | `69c9677` | validierter Storage-Adapter, V1-Backup/Migration und JSON-Transfer |
| 07 | `f3b010c` | Branding, semantische Design-Tokens sowie Light/Dark/System |
| 08 | `f206108` | React-App-Shell, sechs Ansichten und Browsernavigation |
| 09 | `1c8fce5` | Dashboard, neun Kategoriekarten und lokales SVG-Icon-System |
| 10 | `80d2300` | Profilbibliothek mit Suche, Filtern, Gruppieren und sicherem CRUD |
| 11 | `8783ab1` | deklarative RHF-/Zod-Wizard-Engine mit Navigation, Autosave und Resume |
| 12 | `13831e5` | capability-gesteuertes Kategorie-Routing und Bereinigung irrelevanter Daten |
| 13 | `4b8d830` | Basisprofilwahl/-anlage/-duplikation mit sichtbarer Vererbung und Locks |
| 14 | `fdb9c8c` | Character-/NPC-Editor mit Kleidung, Ausrüstung, Richtungen und Aktionsframes |
| 15 | `f6e3cc7` | Moving-Object-Editor mit Footprint, Richtung und separaten Animationssequenzen |
| 16 | `85872c5` | Texture-/Material-Editor mit Seamless-, Oberflächen- und Feuchtigkeitslogik |
| 17 | `a0f6c86` | Nature-/Tree-Editor mit Anatomie, Klima, Bewuchs und Windanimation ohne Richtung |
| 18 | `6dabbbb` | Static-Object-Editor mit Form, Material, Footprint, Interaktion und Animation ohne Richtung |
| 19 | `433eeda` | Building-/Architecture-Editor mit Footprint, Fassade, Mapping, Modularität und Licht |
| 20 | `2557c94` | Tileset-Editor mit Kanten, Ecken, Übergängen, Seam-Regeln, Varianten und berechnetem Atlaslayout |
| 21 | `bb90757` | Item-/Equipment-Editor mit Material, Zustand, Funktion, Bedeutung, Größe und Lesbarkeitsregeln |
| 22 | `9d4fe34` | freier Artwork-/Konzeptbild-Editor mit Motiv, Szene, Komposition, Format, Hintergrund, Fokus, Licht und Detailgrad |
| 23 | `57ac335` | modulare pure TypeScript-Prompt-Engine mit zwölf Bausteinen, getrennten Stilpaketen und allen vier Ausgabearten |
| 24 | `82c1bb0` | produktionsreifer Review-/Output-Workspace mit Konfliktanzeige, vier Tabs, Copy, TXT-/JSON-Export und Profilspeicherung |
| 25 | `c67f26a` | kontrollierte Lock-Konvertierung mit Vier-Wege-UX, Folgenvorschau und unveränderten Ausgangsfamilien |
| 26 | `aac3f30` | responsive Sechs-View-Politur, vollständige Tastaturpfade, sichtbarer Fokus, Kontrast- und Reduced-Motion-Audit |
| 27 | `🚀 dieser Commit` | produktiver Migrationsbootstrap, vollständiger Workspace-Transfer, Release-Abnahme und belegte Legacy-UI-Entfernung |

Durchgehend umgesetzt sind außerdem:

- technische Werte und Fachantworten werden getrennt gehalten;
- `characterHeight` gilt nur für `scaledCharacter`;
- 4/8 Richtungen erscheinen ausschließlich bei `directional`;
- Animation und Richtung sind eigenständige Capabilities;
- Profil-Hydration und Resume bleiben schreibfrei;
- gültige Nutzeränderungen laufen über den gemeinsamen Autosave-Pfad;
- Kategorie-/Untertypwechsel entfernen irrelevante Fachantworten;
- persistierte/importierte V2-Daten werden an Zod-Grenzen validiert;
- Komponenten verwenden den Storage-Adapter statt direkten `localStorage`-
  Zugriff.
- die Prompt Engine verarbeitet ausschließlich aufgelöste Profile und besitzt
  keine React-, Browser- oder Storage-Abhängigkeit;
- kategoriespezifische Promptbausteine ignorieren fremde Felder, während
  Richtungsregeln nur bei `directional` und Animation nur bei `animated`
  erscheinen;
- freie Artworks bleiben ohne Spielraster, Weltkamera, Figurenmaßstab,
  Richtung und Animation; Tileset-Atlaswerte nutzen die vorhandene pure
  Berechnung.
- Review liest aktive oder persistierte validierte Drafts und erzeugt bei
  Konflikten niemals einen Teilprompt;
- Clipboard und Downloads liegen hinter einem injizierbaren Browser-Port;
- neue Assetprofile erhalten eine neue ID, geladene Profile behalten stabile
  ID und Metadaten, und jeder vollständige Graph wird vor dem Write validiert.
- technische Lock-Konflikte werden nur aus strukturierten Resolver-Daten und
  einem partiellen Profil konvertiert; andere Konflikte bleiben fail-closed;
- Compatibility-Gruppenwechsel werden deterministisch vorab gezeigt, während
  das interne Key-Format in der UI opak bleibt;
- Konvertierungen materialisieren wirksame Fachantworten in einem
  eigenständigen Draft und mutieren oder re-parenten keine bestehende
  Base→Category→Asset-Kette.
- die Theme-Auswahl bleibt eine native Radiogruppe; Output-Tabs unterstützen
  Pfeiltasten sowie Home/End und dynamische Konvertierungsansichten führen den
  Fokus deterministisch hinein und zurück;
- alle sechs Ansichten wurden bei 1440, 768 und 360 px unter heller und dunkler
  Systemvorgabe geprüft; befüllte Review-/Output- und Konfliktzustände bleiben
  ohne horizontales Seiten-Overflow;
- Fokus-, Kontrast-, Forced-Colors- und Reduced-Motion-Regeln sind über
  semantische Tokens zentral abgesichert und im Accessibility-/Responsive-
  Audit dokumentiert;
- die V1→V2-Migration läuft beim Browserstart vor der Provider-Hydration,
  bleibt backup-gesichert und idempotent und löscht keine V1-Quelle;
- Einstellungen exportieren und importieren den vollständigen validierten
  Workspace einschließlich Profilgraph, App-Settings und letztem Draft;
- ID-Konflikte verlangen eine explizite Bestätigung, und Provider rehydrieren
  erfolgreiche Importe ohne Seitenreload;
- die vollständige Releasecheckliste und Browsermatrix stehen in
  `V2-RELEASE-ACCEPTANCE.md`.

## Letzter vollständiger Prüfstand

Der endgültige Funktionsstand bis Prompt 27 wurde am 3. September 2026 mit folgenden
Ergebnissen geprüft:

- TypeScript-Typecheck erfolgreich;
- 106 Vitest-Dateien mit 611 von 611 Tests erfolgreich;
- Vite-Produktionsbuild erfolgreich;
- `git diff --check` sauber.

Unmittelbar vor der belegpflichtigen Legacy-Entfernung waren zusätzlich die
historische Strukturprüfung für 13 JavaScript-Dateien und 51 Formularfelder
sowie 10 von 10 V1-Node-Tests erfolgreich. Danach wurden die benötigten
Verträge in den V2-Testbereich übernommen und erneut als Teil von Vitest
geprüft.

Vite meldet weiterhin ausschließlich die bekannte, nicht blockierende Warnung
für einen JavaScript-Chunk über 500 kB. Code-Splitting ist damit eine spätere
Optimierung, kein Fehler des aktuellen Funktionsstands.

## Noch umzusetzen

Es ist **kein nummerierter V2-Prompt mehr offen**. PWA und Tauri 2 bleiben
bewusst ungestartete Optionen und benötigen einen eigenen Auftrag. Die
verbindliche Abschlussgrenze und Restrisiken stehen in
`docs/V2-RELEASE-ACCEPTANCE.md` und `PLANS.md`.

## Git- und Remote-Hinweis

`origin/main` steht weiterhin auf `6dabbbb`; die Branches sind nicht
divergiert. Der lokale Branch enthält zusätzlich die getrennten Prompt-19-,
Prompt-20-, Statusdokumentations-, Prompt-21-, Prompt-22-, Prompt-23-,
Prompt-24-, Prompt-25-, Prompt-26- und Prompt-27-Commits. Der Remote-Stand
enthält damit den funktionalen Prompt-18-Inhalt unter dem unzutreffenden
Refactor-Betreff, während die späteren Phasen einschließlich Prompt 27 bisher
nur lokal vorliegen. Es wurde nicht gepusht.
