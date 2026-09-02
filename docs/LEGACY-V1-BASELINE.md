<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio — Legacy-V1-Migrationsbaseline

## Status und Zweck

Diese Baseline beschreibt den tatsächlich ausführbaren V1-Bestand vor der
React-/TypeScript-Migration. Sie ist die Referenz für Prompt 02 (Domain-Port),
Prompt 06 (V1→V2-Migration) und die spätere Feature-Paritätsprüfung. Die
Aufnahme verändert kein Produktverhalten.

Erfasst am **2026-09-02** mit Node.js 22.22.2 und npm 10.9.7. Die V1 selbst
deklariert in `legacy/v1/package.json` weiterhin Node.js `>=18`; das aktive
Root-Projekt deklariert seit Prompt 01 den V2-Zielwert.

## Baseline reproduzieren

```bash
npm run check:legacy
npm run test:legacy
npm run build:legacy
git diff --check
```

Das rootweite `npm run verify` führt diese Legacy-Prüfungen zusätzlich zum
V2-Typecheck, den Vitest-Tests und dem Vite-Build aus. Die Legacy-Befehle tun
isoliert Folgendes:

1. `npm run check:legacy`: Syntaxprüfung für 13 JavaScript-/MJS-Dateien sowie
   Abgleich der 51 Formularfelder gegen `DEFAULT_STATE`.
2. `npm run test:legacy`: sieben ursprüngliche Node-Testfälle für Promptaufbau, Metriken,
   Validierung und Import-Whitelist plus drei Fixture-Vertragstests dieser
   Baseline.
3. `npm run build:legacy`: kopiert die statische V1 nach `legacy/v1/dist/` und
   erzeugt eine zeitgestempelte `BUILD-INFO.txt`; `dist/` bleibt ignoriert.

V1 besitzt keine Laufzeitabhängigkeiten und daher in ihrem eingefrorenen Ordner
keine `package-lock.json`. Der Root-Lockfile gehört zum V2-Grundgerüst ab Prompt
01, nicht zur historischen Baseline.

## Laufzeitarchitektur

| Datei / Bereich | Tatsächliche Verantwortung in V1 |
|---|---|
| `legacy/v1/index.html` | statische, deutschsprachige Einseitenoberfläche mit Preset-Leiste, langem Konfigurationsformular und Ausgabe-Workspace |
| `legacy/v1/src/js/main.js` | globaler Objekt-State, DOM-Events, 120-ms-Neuberechnung, Autosave, Preset- und Import-/Export-Flows |
| `legacy/v1/src/js/config/default-state.js` | `schemaVersion: 1`, alle 51 Defaults sowie Sets für Figuren, Innenräume und Richtungsanzahlen |
| `legacy/v1/src/js/config/form-schema.js` | acht deklarative Formularabschnitte mit Typen, Labels, Hilfen und Select-Optionen |
| `legacy/v1/src/js/core/prompt-builder.js` | Feld-Whitelist, zweisprachige Promptbausteine, Lichtauflösung, Metriken, Validierung und vier Ausgabeformen |
| `legacy/v1/src/js/core/storage.js` | defensiver `localStorage`-Zugriff für Autosave und benannte Presets |
| `legacy/v1/src/js/core/exporter.js` | Dateinamenbereinigung, Clipboard-Fallback, TXT- und JSON-Export |
| `legacy/v1/src/js/ui/form-renderer.js` | imperative Erzeugung der Formularfelder und drei bedingte Disable-Regeln |
| `legacy/v1/src/js/ui/output-renderer.js` | Promptkarten, Einzel-/Gesamtkopie, Validierungsmeldungen und Metrik-Badges |
| `legacy/v1/src/styles/main.css` | ein globales Dark-Theme, responsive Breakpoints und `prefers-reduced-motion` |
| `legacy/v1/scripts/dev-server.mjs` | lokaler statischer Server auf `127.0.0.1:4173`, optionales Browser-Öffnen und Pfadschutz |
| `legacy/v1/scripts/check.mjs` | JavaScript-Syntax- und Formular/Default-Konsistenzprüfung |
| `legacy/v1/scripts/build.mjs` | statische Kopie von HTML, `src/` und `public/` nach `legacy/v1/dist/` |

Die Anwendung kontaktiert keine externen Dienste. Alle Benutzerdaten verbleiben
im Browser oder in bewusst heruntergeladenen Dateien.

## Formular- und State-Inventar

Der V1-State ist ein flaches Objekt. Beim Import ergänzt `mergeState()` fehlende
Werte aus `DEFAULT_STATE` und übernimmt ausschließlich bekannte Schlüssel.
Unbekannte Schlüssel werden verworfen; bekannte Werte werden jedoch weder
typisiert noch schematisch validiert.

| Abschnitt | Felder und Defaults |
|---|---|
| Projekt und Ausgabe | `projectName="EtherFood"`, `promptLanguage="en"`, `profileOutputMode="both"`, `selectedProfile="classic"` |
| Pixelart-Stil | `pixelDensity="modernHd"`, `styleBalance="balanced"`, `outlineStyle="softSelective"`, `paletteMode="byProfile"`, `colorBudget="64"` |
| Asset und Motiv | `assetType="hero"`, `outputMode="directional8"`, `assetFacing="south"`, englische Standardtexte für Motiv, Zusatzdetails und Materialien, `condition="used"` |
| Raster und Maßstab | `tileSize=32`, `characterHeight=80`, `footprintWidthTiles=1`, `footprintDepthTiles=1`, `frameSize="128"`, `sheetLayout="4x2"` |
| Perspektive und Kamera | `perspectiveType="threeQuarter"`, `cameraAngle="60"`, `cameraDirection="southToNorth"`, `projectionType="orthographic"`; alle vier Sperr-Checkboxen aktiv |
| Setting und Licht | `environment="outdoor"`, `timeOfDay="day"`, `lightingPolicy="adaptive"`, `mood="adventure"` plus englische Projekt-Lichtregel |
| Transparenz und Export | `backgroundMode="transparent"`, `shadowMode="automatic"`, `detailLevel="important"`, `alphaPadding=8`, `anchorMode="bottomCenter"`; native Auflösung, Nearest Neighbor und pixelgenaue Kanten aktiv |
| Qualität und Schutz | Spiellesbarkeit, Silhouette, Proportionen, Formtrennung, Rechteabgrenzung, Produktionsreife und Überdetail-Schutz aktiv plus englische Konsistenzregel |

Die acht Abschnitte enthalten zusammen 51 eindeutige Felder. Die vollständigen
Werte sind in `legacy/v1/src/js/config/default-state.js` die Quelle der Wahrheit; ihre
exakten Promptresultate werden zusätzlich durch
`legacy/v1/tests/fixtures/v1/default-output-signatures.json` festgehalten.

### Auswahlkataloge

- 18 Asset-Typen: fünf Figuren-/Kreaturentypen sowie Gebäude, Innen-/Außenobjekt,
  Pflanze, Baum, Fels, Ruine, Waffe, Rüstung, Verbrauchs-/Questobjekt, Boden-Tile
  und Wandelement.
- sieben Ausgabeformen: Einzelasset, 4/8 Richtungen, Asset-Set, Sprite-Sheet,
  Tileset und Konzeptbild.
- Englisch, Deutsch oder beide Sprachen; klassisches, düsteres oder beide
  Stilprofile. Daraus entstehen ein, zwei oder vier Prompt-Pakete.
- Weitere Kataloge decken Perspektive, Projektion, Kamera, Umgebung, Tageszeit,
  Licht, Stimmung, Zustand, Schatten, Anker, Palette, Farbzahl, Frame und
  Sheet-Layout ab.

Die UI deaktiviert nur `selectedProfile` bei beiden Profilen, `assetFacing` bei
nicht einzelnen Ausgaben und `sheetLayout` außerhalb sheetartiger Ausgaben.
Nicht relevante Werte verbleiben trotzdem im flachen State.

## Prompt- und Metrikvertrag

Jedes Paket enthält die Felder `main`, `negative`, `technical` und `combined`
sowie Profil-/Sprachmetadaten. Der kombinierte Block setzt die drei inhaltlichen
Blöcke mit lokalisierten Überschriften zusammen.

Zu erhaltende Promptregeln:

- klassische und düstere geerdete Fantasy bleiben getrennte Profile;
- Modern-HD-Pixelart, native Zielauflösung, sichtbare kontrollierte Cluster,
  Nearest Neighbor und Anti-Aliasing-Ausschluss;
- frontale schräge 3/4-RPG-Draufsicht, orthografische Projektion, Kamera südlich
  mit Blick nach Norden und ungefähr 60° Abwärtsneigung;
- Kamera und Weltlicht bleiben in Richtungssets fest, nur das Motiv rotiert;
- 32×32-Tile-Raster, 80-px-Figurenreferenz, 128-px-Standardframe und 4×2-Layout
  für acht Richtungen;
- transparenter Alpha-Hintergrund mit 8 px Sicherheitsrand und kontrollierte
  Kontaktschatten;
- adaptive Lichtmatrix für außen/innen, Tag/Nacht, Dämmerung und düstere
  Stimmungen;
- dynamische Negativregeln für Kamera, Pixelstruktur, Komposition,
  Transparenz, Schatten, Konturen, Richtungen, Anatomie und Rechteabgrenzung;
- keine direkten Spiel-, Marken-, Figuren- oder Künstlerreferenzen, sofern die
  standardmäßig aktive Schutzoption nicht bewusst deaktiviert wird.

### Berechnungen

- Eine explizite `frameSize` gewinnt. `auto` ergibt 128 px für Figuren, 96 px
  für Items/Pflanzen, 256 px für Gebäude/Ruinen, die Tilegröße für Boden-Tiles
  und sonst 128 px.
- Eine explizite `sheetLayout` gewinnt immer. `auto` ergibt 4×2 für acht,
  4×1 für vier und 1×1 für andere Ausgaben.
- Canvasbreite/-höhe sind Framegröße mal Spalten/Zeilen.
- Richtungsanzahl ist acht beziehungsweise vier nur anhand von `outputMode`,
  sonst eins.

### Validierung

V1 meldet Fehler für leere Motive, Tilegrößen unter 8 px, Figuren unter 16 px
und Sheets mit zu wenig Frames. Warnungen betreffen knappe Figurenframes,
abweichende frontale Kamera, nicht ausgeschlossene isometrische Achsen und
ungewöhnliche 8-Richtungs-Layouts. Warnungen verhindern die Ausgabe nicht.

## Persistenz und Austauschformate

### LocalStorage

| Schlüssel | gespeicherte Form |
|---|---|
| `pixelart-prompt-studio:autosave:v1` | `{ "savedAt": "<ISO>", "state": { ...V1State } }` |
| `pixelart-prompt-studio:presets:v1` | Array aus `{ "name", "updatedAt", "state" }` |

Autosave erfolgt nach jeder Neuberechnung und beim `beforeunload`. Presets
werden alphabetisch deutsch sortiert; Speichern ersetzt Namen ohne Beachtung
der Groß-/Kleinschreibung, Laden und Löschen vergleichen anschließend exakt.
Nicht verfügbares, volles oder korruptes `localStorage` führt zu Fallbackwerten
statt zu einem App-Crash.

### JSON-Import und -Export

Der Import akzeptiert entweder ein rohes State-Objekt oder `parsed.state` aus
einem Envelope. Danach greift nur die bekannte Feld-Whitelist; es gibt in V1
keine Prüfung von `application`, `formatVersion`, `schemaVersion` oder
Datentypen.

Der JSON-Export besitzt:

```text
application: "Pixelart Prompt Studio"
formatVersion: 1
exportedAt: ISO-Zeitpunkt
state: vollständiger flacher V1-State
generatedOutputs[]: id, profile, language, main, negative, technical, combined
```

Die mitgelieferten Dateien `legacy/v1/presets/hero-eight-directions.json` und
`legacy/v1/presets/building-single.json` sind manuell importierbare, partielle
Konfigurations-Envelopes. Sie werden nicht automatisch in der Preset-Auswahl
registriert.

TXT-Exporte enthalten Projekt, Zeitstempel und alle kombinierten Pakete. Der
Dateiname wird kleingeschrieben, Unicode-dekomponiert, auf ASCII-Buchstaben und
Ziffern reduziert, mit Bindestrichen verbunden und auf 80 Zeichen begrenzt.
Kopieren nutzt zuerst die Clipboard API und fällt sonst auf `execCommand` zurück.

## Automatisierte V1-Abdeckung

Die ursprünglichen sieben Tests sichern:

1. zwei getrennte englische Standardprofile;
2. Kamera- und Maßstabsregeln im Standardprompt;
3. 4×2/512×256-Metriken für acht Richtungen;
4. Perspektiv-, Transparenz-, Richtungs- und Rechteausschlüsse;
5. eine einzelne deutsche düstere Ausgabe;
6. Fehler bei zu kleinem Sheet;
7. Verwerfen unbekannter Importfelder.

Die Baseline ergänzt ausschließlich Vertragstests für synthetische Fixtures und
SHA-256-Signaturen. Storage-Fehlerpfade, DOM-Verhalten, Clipboard, Downloads und
der statische Server bleiben in V1 ohne Browser-Automation; diese Lücken werden
in den passenden V2-Phasen mit Vitest und React Testing Library geschlossen.

## TypeScript-Kompatibilitätsport in V2

Prompt 02 bildet die fachliche V1-Referenz zusätzlich als frameworkfreie
Strict-TypeScript-Domain unter `src/domain/legacy-v1/` ab. Der öffentliche
Einstiegspunkt `index.ts` exportiert:

- den vollständigen V1-Default-State und seine bekannten Katalogmengen;
- das whitelistende State-Merge;
- Frame-, Layout-, Canvas- und Richtungsmetriken;
- Validierung sowie den unveränderten zweisprachigen Promptaufbau.

Der Port ist bewusst mit `LegacyV1` benannt. Er ist eine stabile
Migrationsbrücke, nicht das künftige V2-Domainmodell. Vitest vergleicht die
portierten Funktionen direkt mit der eingefrorenen JavaScript-Referenz, den
beiden synthetischen Storage-Fixtures und den aufgezeichneten SHA-256-Signaturen.
Die Domain importiert weder React noch Vite.

## In V2 zu erhalten

- alle fachlichen Kamera-, Pixel-, Farb-, Kontur-, Licht-, Transparenz-,
  Qualitäts- und Maßstabsregeln, soweit sie für die gewählte Kategorie relevant
  sind;
- alle bekannten V1-Felder als Migrationsquelle, auch wenn sie in V2 in Base-,
  Category- oder AssetProfile aufgeteilt werden;
- Autosave, benannte Presets/Profile, Zurücksetzen, JSON-Import/-Export, TXT,
  Einzel-/Gesamtkopie und technisch berechnete Metriken;
- beide Stilprofile, beide Promptsprachen und die vier sichtbaren Ausgaben;
- defensive Behandlung von korruptem oder nicht verfügbarem Browser-Storage;
- Offline-/Local-only-Betrieb, responsive Kernlayouts, Tastaturfokus und
  `prefers-reduced-motion`;
- Whitelisting unbekannter Importfelder, künftig ergänzt um Zod-Validierung und
  nachvollziehbare Migrationsfehler.

## Bewusste V2-Korrekturen statt blinder Parität

Diese V1-Eigenschaften sind dokumentierter Migrationsinput, aber **kein** zu
erhaltendes Zielverhalten:

- 4/8-Richtungsmodi sind in V1 für jeden Asset-Typ wählbar. V2 bietet sie nur
  bei `directional=true` an.
- `animated` und `directional` existieren in V1 nicht als getrennte
  Capabilities.
- Der flache State trägt irrelevante Werte weiter. Dadurch kann beispielsweise
  ein Einzelgebäude das zuvor aktive 4×2-Sheet behalten und jede Nichtfigur
  eine 80-px-Figurenreferenz ausgeben. V2 bereinigt oder isoliert solche Werte.
- V1 hat weder Profilhierarchie noch Locks, Compatibility Key, stabile IDs oder
  `schemaVersion: 2`.
- Bekannte Importfelder können in V1 falsche Datentypen enthalten. V2 beginnt
  mit `unknown`, validiert mit Zod und migriert erst danach.
- Das globale Dark-Theme und die imperative Vanilla-DOM-UI werden nicht als
  V2-Architektur fortgeführt.

## Synthetische Migrationsfixtures

| Fixture | Zweck |
|---|---|
| `legacy/v1/tests/fixtures/v1/autosave-directional-character.json` | exakte V1-Autosave-Hülle mit vollständigem directional Character-State |
| `legacy/v1/tests/fixtures/v1/presets-storage.json` | exakter V1-Preset-Arrayvertrag mit vollständigem Einzelgebäude-State und bewusst erhaltenem irrelevantem 4×2-Wert |
| `legacy/v1/tests/fixtures/v1/default-output-signatures.json` | Metriken, Textlängen und SHA-256-Signaturen der zwei unveränderten Standardausgaben |

Alle Fixture-Namen, Zeitpunkte und Motive sind statisch und erfunden. Sie
enthalten keine Browserdaten und keine exportierten Nutzerprofile.
