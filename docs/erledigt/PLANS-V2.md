<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Archiv — PixelForge Prompt Studio V2 Ausführungsplan

> Abgeschlossene Ausführungs- und Ergebnisprotokolle bis zur
> Release-Abnahme sowie danach dokumentierte Einzelaufgaben. Der aktive,
> kompakte Übergabestatus steht in `../../PLANS.md`.

## Status

- **Legacy:** ausführbare V1-UI nach belegter Parität entfernt; pure
  TypeScript-Kompatibilität und synthetische Migrationsfixtures bleiben erhalten
- **Ziel:** V2 als TypeScript + React + Vite; Release-Abnahme abgeschlossen
- **Aktuelle Aufgabe:** Einzelaufgabe — deutsche Charakter-Vorauswahlen (abgeschlossen)
- **Nächste Aufgabe:** keine; ein englisches Vorlagen-Sprachpaket bleibt ausdrücklich später
- **Zuletzt abgeschlossen:** Einzelaufgabe — deutsche Charakter-Vorauswahlen
- **Arbeitsregel:** genau eine Phase umsetzen → testen → prüfen → committen

## Ausführungsplan Einzelaufgabe — deutsche Charakter-Vorauswahlen

1. Einen frameworkfreien, vollständig typisierten deutschen Vorlagenkatalog
   für alle Freitextfelder des Character-/NPC-Editors ergänzen. Die Kataloge
   bleiben reine Auswahlhilfen und materialisieren keine neuen Schema-Defaults.
2. Jedes bisherige Freitextfeld als auswahlorientierte Eingabe darstellen:
   „Nicht festgelegt“, mehrere deutsche Vorlagen und „Eigene Eingabe“. Alte
   sowie neu eingegebene Freitexte bleiben über denselben RHF-Feldpfad
   vollständig bearbeitbar.
3. Vorlagenübernahmen über den vorhandenen programmatischen Wizard-Änderungspfad
   in Dirty State, Zod-Projektion und Autosave führen; Profilvererbung,
   Capabilities und Prompt Engine bleiben unverändert.
4. Domain-Kataloge, React-Nutzerverhalten, Freitext-Fallback, Hydration und
   Autosave testen, die öffentlichen Grenzen dokumentieren und anschließend
   `npm run verify`, `git diff --check` sowie den Default-/Regressionsaudit
   ausführen.

## Ergebnis Einzelaufgabe — deutsche Charakter-Vorauswahlen

1. `domain/characters` veröffentlicht einen immutable deutschen Katalog für
   sämtliche 32 Freitextfelder des Character-/NPC-Editors. Jedes Feld besitzt
   mindestens sechs fachlich passende Vorschläge; Schema und persistiertes
   Datenmodell wurden nicht erweitert.
2. Der Character-Editor zeigt für diese Felder zuerst „Nicht festgelegt“, die
   deutschen Vorlagen und abschließend „Eigene Eingabe“. Freitext wird nur bei
   Bedarf eingeblendet; vorhandene individuelle Werte öffnen ihn beim Laden
   automatisch. Eine Vorlage kann verlustfrei als Ausgangspunkt für eigenen
   Text weiterbearbeitet werden.
3. Bewusste Vorlagenwechsel laufen über `setValue()` und den vorhandenen
   `notifyProgrammaticChange()`-Pfad. Damit verwenden sie dieselbe
   Zod-Projektion, Dirty-Erkennung und Autosave-Strecke wie andere
   programmatische Wizard-Änderungen; leere Formulare materialisieren keine
   Vorschlagswerte.
4. Domain-Tests prüfen Vollständigkeit, Runtime-Immutable-Daten, Dubletten und
   jeden Vorschlag gegen `CharacterAnswersSchema`. RTL deckt alle
   Vorlagenauswahlen, den Freitext-Fallback, schreibfreie Hydration sowie den
   produktiven Autosave ab.
5. Das englische Vorlagen-Sprachpaket ist bewusst nicht Teil dieser Aufgabe.
   Die öffentliche Kataloggrenze ist so dokumentiert, dass es später ohne
   Änderung am V2-Schema ergänzt werden kann.

## Ausführungsplan Prompt 27

1. Jede Release-Checklistenposition auf eine produktive Modulgrenze,
   automatisierte Tests und – wo UI-relevant – einen realen Browserpfad
   zurückführen. Architektur-, Default-, Capability- und Stilreferenz-Guards
   statisch gegen den aktuellen Quellstand prüfen.
2. Die V1→V2-Startmigration vor dem ersten Provider-Read in den produktiven
   Browser-Bootstrap einbinden und ihren Zustand sichtbar machen. Die bereits
   pure, idempotente und backup-gesicherte Migration bleibt die einzige
   Transformationsgrenze.
3. Den bislang nur infrastrukturell vorhandenen JSON-Roundtrip als lokale
   Einstellungsansicht zugänglich machen: vollständigen Workspace exportieren,
   Import vorab validieren, ID-Konflikte explizit bestätigen und optionale
   Settings-/Draft-Daten kontrolliert übernehmen.
4. Releasepfade für Dashboard, Profile/Locks/Compatibility, alle neun
   Spezialeditoren, Richtungsgating, vier Prompt-Ausgaben, JSON/TXT,
   Light/Dark/System sowie Keyboard/Responsive im Test und Browser prüfen.
5. Legacy V1 nur dann entfernen, wenn die V2-Parität einschließlich
   produktiver Migration und manueller Browserabnahme belegt ist; benötigte
   Migrationsfixtures vorher in einen nicht ausführbaren Testbereich
   überführen. Andernfalls die konkrete Lücke dokumentieren und den Release
   nicht als fertig markieren.
6. Releasebericht, Architektur und Status aktualisieren, dann
   `npm run verify`, `git diff --check`, Diff-/Default-Audit und den separaten
   Prompt-27-Commit ausführen. Es folgt keine weitere nummerierte Phase.

## Ergebnis Prompt 27

1. Der produktive Browser-Bootstrap führt die backup-gesicherte,
   idempotente V1→V2-Migration vor dem ersten Provider-Read aus. Die
   Einstellungsansicht zeigt Erfolg, Wiederanlauf, Konflikte und nicht
   verfügbaren Storage an; originale V1-Keys werden nie gelöscht.
2. Die Einstellungsansicht exportiert Profile, Einstellungen und den letzten
   lokalen Entwurf als ein validiertes V2-JSON-Bundle. Importdaten beginnen
   als `unknown`, ID-Konflikte verlangen eine explizite Ersetzungsbestätigung,
   und Einstellungen sowie der jüngste Entwurf können gezielt übernommen
   werden; Provider rehydrieren nach erfolgreichen Writes ohne Reload.
3. Die zusammenhängende Browserabnahme hat Dashboard, Profile, Migration,
   alle neun Spezialeditoren, Light/Dark/System, Tastaturpfade, 360-px-Reflow,
   vier Promptausgaben sowie reale JSON-/TXT-Downloads geprüft. Richtung war
   nur bei NPC und fahrendem Objekt sichtbar, bei den sieben statischen oder
   frei komponierten Fällen nicht.
4. Die ausführbare Vanilla-V1 unter `legacy/v1/` wurde erst nach erfolgreicher
   Paritätsprüfung entfernt. Relevante Autosave-, Preset-, Export- und
   Promptsignatur-Verträge liegen nun nicht ausführbar unter
   `src/test/fixtures/legacy-v1/`; der pure Kompatibilitätsport bleibt unter
   `src/domain/legacy-v1/` erhalten. Der entfernte Quellstand bleibt über die
   Git-Historie wiederherstellbar.
5. Der abschließende Prüfstand umfasst 106 Vitest-Dateien mit 611 von 611
   erfolgreichen Tests, fehlerfreien Strict-TypeScript-Typecheck,
   Produktionsbuild und `git diff --check`. Die bekannte Vite-Warnung für den
   etwa 860-kB-JavaScript-Chunk bleibt eine nicht blockierende spätere
   Code-Splitting-Optimierung.
6. `docs/erledigt/V2-RELEASE-ACCEPTANCE.md` enthält die vollständige Evidenz und die
   verbleibenden Restrisiken. Prompts 00–27 sind abgeschlossen; eine optionale
   PWA- oder Tauri-Phase beginnt nur mit einem neuen Auftrag.

## Ausführungsplan Prompt 26

1. Die sechs Shell-Ansichten sowie Theme, Karten, Formulare, Statusmeldungen,
   Bestätigungsoberflächen und Output auf semantische Namen, Fokusreihenfolge,
   Tastaturbedienung und sichtbare Fokuszustände prüfen.
2. Fokus nach Top-Level-Navigation und dynamischen Wizard-/Output-Wechseln
   gezielt führen, ohne native Tab-Reihenfolgen zu ersetzen; wichtige
   Tastaturpfade mit React Testing Library absichern.
3. Globale Motion-, Kontrast- und Overflow-Grundlagen sowie die betroffenen
   CSS-Module für Desktop, Tablet und 360-px-Viewports härten. Dabei lange
   Profil-, Technik- und Promptinhalte umbrechen und Bedienelemente ohne
   horizontales Abschneiden stapeln.
4. Die manuelle Viewport- und Theme-Prüfung mit überprüften Breiten,
   Bedienpfaden und bekannten Grenzen als eigenes Auditdokument festhalten.
5. Öffentliche UI-Grenzen und Implementierungsstatus dokumentieren, danach
   `npm run verify`, `git diff --check`, Abschlussaudit und den separaten
   Prompt-26-Commit ausführen; Prompt 27 und Legacy-Entfernung bleiben
   unangetastet.

## Ergebnis Prompt 26

1. Die produktive Vite-Oberfläche wurde in allen sechs Shell-Ansichten bei
   1440 × 1000, 768 × 1024 und 360 × 800 px unter heller und dunkler
   Systemvorgabe geprüft. Befüllte Dashboard-, Profil-, Wizard-, Review- und
   Output-Zustände sowie der Konvertierungskonflikt besitzen kein
   horizontales Seiten-Overflow; lange Überschriften und technische Inhalte
   bleiben innerhalb ihrer Panels.
2. Die native Theme-Radiogruppe und die vier Output-Tabs sind mit
   Pfeiltasten bedienbar. Der Konvertierungsworkflow führt den Fokus beim
   Moduswechsel zum ersten relevanten Feld beziehungsweise zur Überschrift,
   beim Zurückgehen zum exakten Auslöser und nach erfolgreicher Konvertierung
   in den freigegebenen Review-/Output-Bereich.
3. Der querschnittliche 3-px-Fokusring verwendet ausschließlich definierte
   semantische Tokens und bleibt auch in erzwungenen Systemfarben sichtbar.
   `prefers-reduced-motion: reduce` deaktiviert Übergänge tatsächlich,
   begrenzt Animationen und entfernt bewegte Hover-Zustände.
4. `docs/erledigt/V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md` hält Viewportmatrix,
   Tastaturpfade, Label-/Statusprüfung, Kontrastwerte und die Grenze der
   Browserprüfung nachvollziehbar fest. Die UI-Politur ändert weder
   Fachdefaults noch Schema, Persistenz oder Prompt Engine.
5. RTL-Tests ergänzen Theme-Tastaturbedienung, roving Output-Tabs,
   Konvertierungsfokus und Erfolgsfokus. Der vollständige Prüfstand umfasst
   103 Vitest-Dateien mit 598 erfolgreichen Tests sowie 10 Legacy-Tests.

## Übergabe an Prompt 27

- Führe die vollständige Release-Abnahme gegen die Checkliste aus
  `docs/erledigt/CODEX-V2-PROMPTS.md` aus und verwende den dokumentierten Prompt-26-
  Browseraudit als Beleg für Keyboard und Responsive Design.
- Prüfe Migration, alle Spezialeditoren, Profil-/Lock-/Compatibility-Flows,
  vier Ausgaben sowie JSON/TXT erneut als zusammenhängenden Releasepfad.
- Entferne Legacy V1 ausschließlich, wenn Feature-Parität und Migration
  vollständig belegt sind; verbleibende Lücken werden dokumentiert und nicht
  als abgeschlossen markiert.

## Ausführungsplan Prompt 25

1. Aus dem validierten Wizard-Draft, dem partiell aufgelösten Profil und den
   strukturierten Lock-Konflikten einen puren Konvertierungsplan bilden. Er
   berechnet gewünschte wirksame Werte, relevante Feldänderungen und den
   neuen Compatibility Key, ohne einen Teilprompt zu erzeugen.
2. Für jedes vorhandene Basisprofil vorab prüfen, ob die gewünschte
   Konfiguration ohne Lock-Verletzung auflösbar ist. Der resultierende Draft
   materialisiert geerbte Fachantworten, normalisiert technische Overrides und
   löst alte Category-/Asset-Provenienz bewusst, ohne persistierte Profile
   umzuhängen.
3. Den Review-Konflikt um genau vier kontrollierte Wege erweitern: abbrechen,
   aktuelles BaseProfile als eigenständige Familie duplizieren, eine neue
   kanonische Familie anlegen oder ein kompatibles vorhandenes Profil wählen.
   Vor jeder Bestätigung werden technische Änderungen, Gruppenwechsel,
   Overrides und gelöste Verknüpfungen sichtbar.
4. Neue/duplizierte Basen weiterhin ausschließlich über den bestehenden
   Provider und dessen Zod-validierten Gesamtgraph-Write anlegen. Erst danach
   wird der konvertierte Draft über den Storage-Adapter gespeichert und als
   aktive Sitzung übernommen; Teilfehler bleiben sichtbar und fail-closed.
5. Pure Domain-/Feature-Tests und React-Testing-Library-Flows für
   Compatibility-Key-Wechsel, Lock-Konflikt, Abbruch, vorhandene kompatible
   Familie und Basisduplikation ergänzen.
6. Öffentliche Grenzen und Implementierungsstatus dokumentieren, danach
   `npm run verify`, `git diff --check`, Abschlussaudit und den separaten
   Prompt-25-Commit ausführen; Prompt 26 bleibt unangetastet.

## Ergebnis Prompt 25

1. `profileConversionData.ts` rekonstruiert aus einem validierten Draft, dem
   partiell aufgelösten Profil und ausschließlich strukturierten
   `lockedOverride`-Konflikten den gewünschten technischen Stand. Aktuelle und
   gewünschte Compatibility-Gruppe werden deterministisch verglichen, ohne
   das interne Key-Format in der UI offenzulegen.
2. Vorhandene Basisprofile werden pure gegen den gewünschten Stand geprüft.
   Lock-Widersprüche schließen Kandidaten aus; exakte technische Treffer
   stehen zuerst, während mögliche lokale Abweichungen vor der Bestätigung
   gezählt werden.
3. Der fail-closed Review-Zustand bietet genau die vier vorgesehenen Wege:
   abbrechen, die aktuelle Basisfamilie duplizieren, eine neue kanonische
   Familie anlegen oder ein kompatibles vorhandenes Basisprofil wählen. Jede
   schreibende Aktion folgt erst nach einer sichtbaren Änderungs-, Gruppen- und
   Provenienzvorschau.
4. Ein konvertierter Draft materialisiert wirksame Kategorieantworten und löst
   seine alte Category-/Asset-Provenienz. Bestehende Basen, Kategorieprofile,
   Assetprofile und ihre Referenzen bleiben unverändert; nur der neue Draft
   wird auf die bestätigte Ziel-Familie gesetzt.
5. Neue und duplizierte Basen laufen über den vorhandenen
   `ProfileLibraryProvider` samt Zod-Gesamtgraphprüfung. Der Draft wird danach
   separat über den Storage-Adapter persistiert; ein Fehlschlag aktiviert
   keinen teilkonvertierten Sitzungsstand und benennt eine bereits angelegte
   Familie ausdrücklich.
6. Pure Tests decken 80→96 px, 32→48 px, Compatibility-Wechsel,
   widersprechende Ziel-Locks und unveränderte Nachkommen ab. RTL-Flows prüfen
   Abbruch, alle vier Optionen, Duplikation, Neuanlage und die Wahl einer
   vorhandenen exakten Familie. Der vollständige Prüfstand umfasst 103
   Vitest-Dateien mit 595 erfolgreichen Tests sowie 10 Legacy-Tests.

## Ausführungsplan Prompt 24

1. Einen puren Review-Vertrag aus dem aktiven, validierten Wizard-Draft, der
   Profilbibliothek und der öffentlichen Prompt-Engine-Grenze aufbauen. Nur
   konfliktfrei aufgelöste Profile erzeugen Prompt-Pakete; fehlende oder
   widersprüchliche Ketten bleiben mit verständlichen Warnungen fail-closed.
2. Review und Output als responsive React-Arbeitsfläche an die vorhandenen
   Shell-Routen anbinden. Die Prüfung zeigt Produktionszusammenfassung,
   Provenienz-Hinweise und Konflikte; die Ausgabe bietet Paket-, Sprach-,
   Stil- und vier barrierefrei auswählbare Textansichten.
3. Clipboard und lokale Dateidownloads hinter einen injizierbaren Browser-Port
   legen. Copy und TXT arbeiten auf der aktiven Ausgabe; JSON verwendet das
   bestehende validierte ExportBundle-Format einschließlich benötigter Base-
   und Category-Abhängigkeiten.
4. Das aktuelle Draft-Ergebnis über eine pure Assetprofil-Upsert-Operation in
   der vorhandenen Profilbibliothek speichern. Neue Entwürfe erhalten eine
   neue ID, geladene Profile werden an ihrer stabilen ID aktualisiert, und
   jeder Kandidat passiert vor dem Storage-Write erneut die Zod-Grenze.
5. Domain-, Service-, Provider- und React-Testing-Library-Tests für
   Auflösung/Fehlerzustände, vier sichtbare Ausgaben, Paketwechsel,
   mockbares Kopieren, TXT-/JSON-Export und Speichern ergänzen.
6. Öffentliche Grenzen und Implementierungsstatus dokumentieren, danach
   `npm run verify`, `git diff --check`, Abschlussaudit und den separaten
   Prompt-24-Commit ausführen; Prompt 25 bleibt unangetastet.

## Ergebnis Prompt 24

1. `src/features/review-output/` bereitet den aktiven Session-Draft oder nach
   Reload den gespeicherten Draft pure und fail-closed auf. Unvollständige
   Entwürfe, ungültige Storage-Daten und Resolver-Konflikte besitzen eigene
   Zustände; nur ein vollständig aufgelöstes Profil erreicht die Prompt Engine.
2. Review zeigt Projekt, Kategorie/Untertyp, Base-/Category-Provenienz,
   wirksame technische Werte, deren Quelle und Basis-Locks sowie aktive
   Capabilities, Draft-Warnungen und echte Resolver-Hinweise.
3. Der Output-Bereich bietet deutsche und englische Pakete je wirksamer
   Stilvariante. Hauptprompt, Negativprompt, technische Spezifikation und
   kombinierte Ausgabe liegen in ARIA-Tabs mit Pfeil-, Home- und End-Steuerung.
4. `OutputWorkspaceAdapter` kapselt Clipboard und Blob-Downloads. Copy und TXT
   arbeiten exakt auf dem aktiven Tab; JSON verwendet das bestehende
   validierte ExportBundle samt benötigten Base-/Category-Abhängigkeiten und
   portablem Draft.
5. `saveAssetProfile()` und der erweiterte `ProfileLibraryProvider` erstellen
   neue Assetprofile mit injizierter ID/Zeit oder aktualisieren geladene
   Profile an stabiler ID unter Erhalt ihrer Metadaten. Der gesamte Graph wird
   vor dem Storage-Write validiert und der Draft anschließend verknüpft.
6. Die vollständige Prüfung umfasst 102 Vitest-Dateien mit 587 erfolgreichen
   Tests, 10 erfolgreiche Legacy-Tests, Typecheck und Produktionsbuild. Die
   bekannte nicht blockierende Vite-Warnung zum Chunk über 500 kB bleibt.

## Ausführungsplan Prompt 23

1. Einen frameworkfreien öffentlichen `domain/prompt-engine`-Vertrag für
   aufgelöste Profile, gewünschte Sprache, getrennte Stilvarianten und die vier
   stabilen Ausgaben definieren. `styleProfile: both` erzeugt getrennte
   klassische und düstere Pakete; die kombinierte Ausgabe setzt ausschließlich
   Hauptprompt, Negativprompt und technische Spezifikation zusammen.
2. Die feste Modulreihenfolge `baseProfile`, `styleProfile`, `category`,
   `subject`, `materials`, `setting`, `lighting`, `motion`, `animation`,
   `composition`, `negativeRules`, `technicalSpec` als kleine pure
   TypeScript-Builder implementieren.
3. Alle neun diskriminierten Kategorieantworten ausschließlich in ihren
   fachlich passenden Modulen abbilden. Richtungstext und Richtungsmetriken
   erscheinen nur bei `directional`, Animation bleibt getrennt, und Kamera
   sowie Weltlicht werden für Richtungssets ausdrücklich konstant gehalten.
4. Technische Spezifikationen aus wirksamen Profilwerten und vorhandenen
   Kategorieantworten erzeugen. Freie Artworks lassen Tile-, Weltkamera-,
   Figuren-, Sprite-, Richtungs- und Animationsregeln aus; Tilesets verwenden
   die bestehende pure Atlasmetrik statt einer zweiten Berechnung.
5. Globale und kategoriespezifische Negativregeln dynamisch zusammensetzen,
   Dubletten stabil entfernen und ausschließlich allgemeine Stilmerkmale statt
   direkter Spiel-, Marken-, Figuren- oder Künstlerreferenzen verwenden.
6. Struktur- und Snapshot-Tests mindestens für NPC, Holztextur, Winterbaum,
   Gebäude, bewegliches Objekt und Artwork sowie ergänzende Guards für alle
   Kategorien, Sprache, Stilpakete und deterministische Unveränderlichkeit
   hinzufügen. Danach Dokumentation, `npm run verify`, `git diff --check`,
   Abschlussaudit und separaten Prompt-23-Commit ausführen; Prompt 24 bleibt
   unangetastet.

## Ergebnis Prompt 23

1. `src/domain/prompt-engine/index.ts` veröffentlicht den frameworkfreien
   Vertrag `buildPromptPackages()` für bereits validierte und aufgelöste
   Profile. Ein Paket enthält getrennt `main`, `negative`, `technical` und
   `combined`; `styleProfile: both` ergibt bewusst zwei Stilpakete und die
   optionale Sprachauswahl wird kanonisch dedupliziert.
2. Zwölf pure Builder laufen in einer unveränderlichen festen Reihenfolge von
   Basisprofil und Stil über Kategorie-/Fachmodule bis zu dynamischen
   Negativregeln und technischer Spezifikation. Normalisierung und stabile
   Dublettenentfernung machen wiederholte Builds deterministisch.
3. Die Engine verzweigt ausschließlich über die diskriminierte Kategorie und
   aufgelöste Capabilities. 4/8-Richtungen erscheinen nur bei `directional`,
   Animation bleibt unabhängig, und Richtungssets sperren Kamera, Bodenanker
   und Weltlicht bei reiner Motivrotation.
4. Freie Artworks erhalten keine Tile-, Weltkamera-, Figurenmaßstabs-,
   Richtungs- oder Animationsvorgaben. Texturen bleiben flache Materialmuster;
   Atlasangaben verwenden die bestehende pure Tileset-Metrik.
5. Neun Engine-Tests prüfen die sechs Pflichtfälle, alle neun Kategorien,
   kategoriefremde Daten, deutsche/englische Stilpakete, Unveränderlichkeit,
   deterministische Ausgabe und Tileset-Atlaswerte. Der vollständige Stand
   umfasst 99 Vitest-Dateien mit 572 erfolgreichen Tests sowie 10 erfolgreiche
   Legacy-Tests.

## Ausführungsplan Prompt 22

1. Eine frameworkfreie Artwork-Domain mit stabilen Katalogen und einem
   vollständigen Untertyp→Artworktyp-Mapping für Zweck, Motiv, Komposition,
   Format, Hintergrund, Fokus, Lichtdramaturgie und Detailgrad anlegen. Der
   Artworktyp bleibt aus dem Untertyp abgeleitet und wird nicht als
   widersprüchlicher freier Wert dupliziert.
2. Den bestehenden strikten `ArtworkAnswersSchema`-Vertrag additiv erweitern.
   Frühere Schema-V2-Artworkdaten bleiben ohne eager Defaults lesbar;
   Tilegröße, Weltkamera, Figurenmaßstab, Sprite-, Animations- und
   Richtungsdaten bleiben vollständig außerhalb der Artwork-Fachantworten.
3. Einen responsiven RHF-gesteuerten `ArtworkConceptEditor` als eigenen
   `artworkDetails`-Schritt direkt nach der Basisprofilwahl integrieren. Er
   zeigt Artworktyp und freie Produktionsmerkmale, aber weder Tile-/Sprite-
   noch 4/8-Richtungsregeln.
4. Artwork-Felder durch Base→Category→Asset-Auflösung, minimale lokale
   Projektion, Explicit Clear, Basis-/Klassifikationswechsel, transienten
   Rohzustand, Autosave und schreibfreies Resume führen. Freie Komposition
   behält den bestehenden Ausschluss technischer Weltgeometrie bei.
5. Live-Zusammenfassung und Dashboard um kompakte, tatsächlich konfigurierte
   Artworktyp-, Motiv-, Szenen-, Kompositions-, Format-, Hintergrund-, Fokus-,
   Licht- und Detailfakten ergänzen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests ergänzen. Danach Dokumentation, `npm run verify`,
   `git diff --check`, Abschlussaudit und den separaten Prompt-22-Commit
   ausführen; Prompt 23 bleibt unangetastet.

## Ausführungsplan Prompt 21

1. Eine frameworkfreie Item-Domain mit stabilen Katalogen, vollständigem
   Untertyp→Itemklassen-Mapping und puren Relevanzregeln für tragbare
   Darstellung anlegen. Itemklasse und technische Produktionswerte bleiben
   abgeleitet statt als frei widersprüchliche Eingaben vorzuliegen.
2. Den bestehenden strikten `ItemAnswersSchema`-Vertrag additiv um Material,
   Zustand, Funktion, Bedeutung, Größe, Silhouettenlesbarkeit, Leuchteffekt,
   Schatten und Varianten erweitern. Frühere Schema-V2-Itemdaten bleiben ohne
   eager Defaults lesbar; Wearable-Daten bleiben capability-gebunden.
3. Einen responsiven RHF-gesteuerten `ItemEquipmentEditor` als eigenen
   `itemDetails`-Schritt direkt nach der Basisprofilwahl integrieren. Er zeigt
   Itemklasse, Hintergrund, Tilegröße und Pixelmaßstab read-only und enthält
   keine erfundene Richtungs- oder Animationslogik.
4. Item-Felder durch Base→Category→Asset-Auflösung, minimale lokale
   Projektion, Explicit Clear, Basis-/Klassifikationswechsel, transienten
   Rohzustand, Autosave und schreibfreies Resume führen.
5. Live-Zusammenfassung und Dashboard um kompakte Itemklassen-, Material-,
   Zustands-, Funktions-, Bedeutungs-, Größen-, Lesbarkeits-, Schatten- und
   Variantenfakten ergänzen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests ergänzen. Danach Dokumentation, `npm run verify`,
   `git diff --check`, Abschlussaudit und den separaten Prompt-21-Commit
   ausführen; Prompt 22 bleibt unangetastet.

## Ausführungsplan Prompt 20

1. Eine frameworkfreie Tileset-Domain mit stabilen Katalogen, einem
   vollständigen Untertyp→Tiletyp-Mapping und Relevanzregeln für Kanten,
   Übergänge sowie Innen-/Außenecken anlegen. Atlasmetriken und die daraus
   abgeleitete technische Spezifikation bleiben pure TypeScript-Funktionen.
2. Den bestehenden strikten `TilesetAnswersSchema`-Vertrag additiv um Tiletyp,
   Verbindungs-, Seam-, Wiederholungs-, Varianten- und Atlaswerte erweitern.
   Frühere V2-Daten bleiben ohne eager Defaults lesbar; `tileSize` bleibt ein
   zentraler technischer Base→Category→Asset-Wert.
3. Einen responsiven RHF-gesteuerten `TilesetEditor` als eigenen
   `tilesetDetails`-Schritt direkt nach der Basisprofilwahl integrieren. Er
   zeigt Grid und berechnete Atlas-Spezifikation, blendet nur
   untertyprelevante Verbindungsfragen ein und enthält keine Richtungs- oder
   Figurenfelder.
4. Die Tileset-Felder durch Base→Category→Asset-Auflösung, minimale lokale
   Projektion, Explicit Clear, Basis-/Klassifikationswechsel, transienten
   Rohzustand, Autosave und schreibfreies Resume führen. Die bisherige
   generische Tileability-Stufe wird für alte Tileset-Drafts kontrolliert auf
   den neuen Fachschritt umgeleitet.
5. Live-Zusammenfassung und Dashboard um kompakte Tiletyp-, Kanten-, Ecken-,
   Übergangs-, Seam-, Wiederholungs-, Varianten- und berechnete Atlasfakten
   ergänzen; Animation bleibt eine getrennte Capability des animierten Tiles.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests einschließlich Tilemetriken und technischer Spezifikation
   ergänzen. Danach Dokumentation, `npm run verify`, `git diff --check`,
   Abschlussaudit und den separaten Prompt-20-Commit ausführen; Prompt 21
   bleibt unangetastet.

## Ausführungsplan Prompt 19

1. Eine frameworkfreie Building-Domain mit stabilen Katalogen und einem
   vollständigen Untertyp→Gebäudetyp-Mapping für Bauform, Größe, Material,
   Dach, Fassade, Türen, Fenster, Zustand, Belegung, Mapping und Licht anlegen.
2. Den vorhandenen strikten `BuildingAnswersSchema`-Vertrag additiv erweitern:
   frühere Schema-V2-Felder bleiben ohne eager Defaults lesbar, Footprint-
   Achsen bleiben gemeinsam erforderlich und technische Tile-/Kamerawerte
   werden nicht in Fachantworten dupliziert.
3. Einen RHF-gesteuerten `BuildingArchitectureEditor` als eigenen
   `buildingDetails`-Schritt direkt nach der Basisprofilwahl integrieren.
   Gebäudetyp und wirksame Tilegröße sind read-only; normale Gebäude erhalten
   niemals Richtungsfelder, eine Toranimation bleibt ein separater
   `animated`-Capability-Schritt.
4. Building-Antworten Base→Category→Asset auflösen und nur minimale lokale
   Abweichungen speichern. Basiswechsel erhalten die Fachwerte,
   Klassifikationswechsel bereinigen sie und Explicit Clear verhindert das
   Wiederkehren geerbter Building-Defaults.
5. Live-Zusammenfassung und Dashboard um kompakte, tatsächlich konfigurierte
   Gebäude-, Footprint-, Stockwerk-, Material-, Dach-, Fassaden-, Öffnungs-,
   Mapping-, Belegungs- und Lichtfakten ergänzen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests ergänzen. Danach Dokumentation, `npm run verify`,
   `git diff --check`, Abschlussaudit und den separaten Prompt-19-Commit
   ausführen; Prompt 20 bleibt unangetastet.

## Ausführungsplan Prompt 18

1. Eine frameworkfreie Static-Object-Domain mit stabilen Katalogen und einem
   vollständigen Untertyp→Objektklassen-Mapping für Funktion, Form,
   Proportion, Symmetrie, Material, Zustand, Interaktion und Schatten anlegen.
   Das bestehende strikte `StaticObjectAnswersSchema` wird additiv erweitert;
   vorhandene Schema-V2-Daten bleiben ohne eager Defaults lesbar.
2. Einen eigenständigen responsiven `static-object-editor` direkt nach der
   Basisprofilwahl integrieren. Der Editor erfasst Objektkern, Materialien,
   vollständigen Tile-Footprint, Varianten, Zustand, Details, Interaktion und
   Kontaktschatten, während technische Werte ausschließlich aus der
   Base→Category→Asset-Kette stammen.
3. Öffnen, Leuchten, Zerbrechen und benutzerdefinierte Animation im bestehenden
   capability-gesteuerten Animationsschritt halten. Statische Untertypen sind
   nicht `directional` und erhalten deshalb niemals eine 4/8-Richtungsfrage.
4. Sämtliche Static-Object-Werte durch Form-Rohsnapshot, minimale
   Base→Category→Asset-Projektion, Autosave, Profilstart und schreibfreies
   Resume führen. Basiswechsel erhalten Fachantworten,
   Klassifikationswechsel bereinigen sie und Explicit Clear verhindert das
   Wiederkehren geerbter Werte.
5. Summary und Dashboard um tatsächlich konfigurierte Objektklassen-,
   Funktions-, Form-, Material-, Zustands-, Footprint-, Varianten-,
   Interaktions-, Schatten- und Animationsfakten ergänzen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests einschließlich einer animierten Truhe ohne Richtungsset ergänzen.
   Danach Dokumentation, Vollverifikation, Abschlussaudit und den separaten
   Prompt-18-Commit ausführen; Prompt 19 bleibt unangetastet.

## Ausführungsplan Prompt 17

1. Eine frameworkfreie Nature-Domain mit stabilen Katalogen und purem
   Untertyp→Pflanzentyp-Mapping für Pflanzentyp, Klima, Saison, Alter,
   Silhouette, Stamm, Krone, Wurzeln, Bewuchs, Wetterauflage und Standfläche
   anlegen. Das bestehende strikte `NatureAnswersSchema` wird additiv
   erweitert; alte Schema-V2-Felder bleiben ohne schreibende Defaults lesbar.
2. Einen eigenständigen responsiven `nature-editor` direkt nach der
   Basisprofilwahl integrieren. Der Editor zeigt nur zum Untertyp passende
   Baum-/Pflanzenfragen, die wirksame technische Tilegröße read-only und einen
   vollständigen Tile-Footprint, ohne technische Werte zu duplizieren.
3. Optionale Wind-/Magieanimation im bestehenden capability-gesteuerten
   Animationsschritt halten. `animated` und `directional` bleiben strikt
   getrennt: Ein Baum darf einen Wind-Loop besitzen, aber nie einen
   Richtungsschritt erhalten.
4. Sämtliche Nature-Werte durch Form-Rohsnapshot, minimale
   Base→Category→Asset-Projektion, Autosave, Profilstart und schreibfreies
   Resume führen. Basiswechsel erhalten Fachantworten,
   Klassifikationswechsel bereinigen sie und Explicit Clear verhindert das
   Wiederkehren geerbter Werte.
5. Summary und Dashboard um tatsächlich konfigurierte Pflanzen-, Klima-,
   Saison-, Silhouetten-, Stamm-, Kronen-, Wurzel-, Bewuchs-, Schnee-,
   Footprint-, Varianten- und Animationsfakten ergänzen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests einschließlich eines vollständigen Windbaum-Flows ergänzen.
   Danach Dokumentation, Vollverifikation, Abschlussaudit und den separaten
   Prompt-17-Commit ausführen; Prompt 18 bleibt unangetastet.

## Ausführungsplan Prompt 16

1. Eine frameworkfreie Texture-/Material-Domain mit stabilen Katalogen für
   Materialart, Verwendung, Orientierung, Struktur, Zustand, Oberfläche,
   Feuchtigkeit/Vereisung und Licht anlegen. Das bestehende strikte
   `TextureAnswersSchema` wird additiv erweitert; vorhandene Schema-V2-Felder
   bleiben ohne schreibende Migration lesbar.
2. Tilegröße ausschließlich als zentralen, sperr- und vererbbaren technischen
   Wert der Base→Category→Asset-Kette behandeln. Der Textur-Editor zeigt den
   wirksamen Wert, erzeugt aber kein paralleles Texture-Antwortfeld.
3. Einen eigenständigen responsiven `texture-editor` direkt nach der
   Basisprofilwahl integrieren. Er enthält nur Materialfragen einschließlich
   einer bewusst dreiwertigen Seamless-Auswahl; Character-, Moving-Object-,
   Kleidungs-, Animations- und Richtungsfelder bleiben ausgeschlossen.
4. Sämtliche Texture-Werte durch Form-Rohsnapshot, minimale
   Base→Category→Asset-Projektion, Autosave, Profilstart und schreibfreies
   Resume führen. Basiswechsel erhalten Fachantworten,
   Klassifikationswechsel bereinigen sie und Explicit Clear verhindert das
   Wiederkehren geerbter Werte.
5. Summary und Dashboard um tatsächlich konfigurierte Material-, Einsatz-,
   Seamless-, Struktur-, Zustands-, Oberflächen-, Feuchtigkeits- und
   Lichtfakten ergänzen. Der Holz-End-to-End-Fall darf ausschließlich
   relevante Texture-Daten erzeugen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle- und RTL-Tests sowie die
   Dokumentation ergänzen. Danach Vollverifikation, Abschlussaudit und den
   separaten Prompt-16-Commit ausführen; Prompt 17 bleibt unangetastet.

## Ausführungsplan Prompt 15

1. Das strikte `MovingObjectAnswersSchema` additiv um Objektklasse,
   Grundform, Maßstab/Footprint, Anker, Mechanik, Material, Zustand und
   bewegungsbezogene Produktionsangaben erweitern. Bestehende V2-Felder
   bleiben lesbar; persistierte Typen stammen weiterhin aus Zod.
2. Moving-Object-Animationen als eigenes, Character-unabhängiges Modell mit
   eindeutigen Sequenzen und eigener Framezahl definieren. Bestehende
   `animationType`-/`framesPerDirection`-Daten bleiben ein schreibfreier
   Lesepfad und werden erst bei einer gültigen Nutzeränderung kanonisch
   projiziert.
3. Einen eigenständigen responsiven `moving-object-editor` direkt nach der
   Basisprofilwahl integrieren. Bewegung, Footprint, Anker, Mechanik,
   Material und Zustand werden in RHF bearbeitet; Animation bleibt im
   capability-gesteuerten Animationsschritt, Richtung ausschließlich im
   vorhandenen `directional`-Schritt.
4. Sämtliche Moving-Object-Werte durch Form-Snapshot, minimale
   Base→Category→Asset-Projektion, Autosave, Profilstart und Resume führen.
   Klassifikationswechsel bereinigen die Daten, ein Basiswechsel erhält sie;
   ausdrücklich geleerte Elternwerte dürfen beim Resume nicht zurückkehren.
5. Summary, Dashboard und Profilkarten um tatsächliche Objektklasse,
   Bewegung, Footprint, Anker und konfigurierte Sequenzen ergänzen, ohne beim
   pulsierenden nicht-directional Kristall ein Richtungsset zu erfinden.
6. Domain-, Schema-, Routing-, Lifecycle- und RTL-Tests für Wagen und
   schwebenden Kristall, Vererbung, Legacy-Hydration, Framegrenzen,
   Richtungs-Gating, Autosave/Resume und Datenbereinigung ergänzen. Danach
   Dokumentation, Vollverifikation, Abschlussaudit und separaten Prompt-15-
   Commit ausführen.

## Ausführungsplan Prompt 14

1. Das gemeinsame strikte `CharacterAnswersSchema` additiv um den vollständigen
   Figuren- und NPC-Katalog erweitern. Bestehende V2-Felder bleiben lesbar;
   `characterHeight` bleibt ausschließlich technischer Profilwert und wird nie
   als Figurenantwort dupliziert.
2. Den bisherigen einzelnen Animationswert durch eine kanonisch geordnete,
   eindeutige Liste gewählter Aktionen mit eigener Framezahl (1–8) ergänzen.
   Idle, Walk, Run, Attack, Use und Talk sind Pflichtoptionen; bestehende
   Interact-/Hurt-/Special-Daten bleiben kompatibel. Richtung und Animation
   werden weiterhin unabhängig über Capabilities validiert.
3. Einen eigenständigen, responsiven `character-editor` als Wizard-Schritt
   direkt nach dem Basisprofil ergänzen. Er zeigt Identität, Körper, Kopf,
   Kleidung, Ausrüstung, Material, Palette, Ausdruck und Silhouette sowie
   bedingte NPC-Fragen. Die wirksame Figurenhöhe erscheint nur read-only mit
   Quelle und Lock-Status.
4. Character-Animationen im bestehenden capability-gesteuerten
   Animationsschritt als zugängliche Aktionsauswahl mit Frames je Aktion
   abbilden. Die Richtungswahl bleibt ausschließlich im `directional`-Schritt;
   feste Kamera, Weltlicht, Fußanker und Neuzeichnung asymmetrischer Details
   werden sichtbar erklärt.
5. Alle neuen Werte vollständig durch RHF-Rohsnapshot, Draft-Hydration,
   minimale Draft-Projektion, Autosave, Resume und Live-Zusammenfassung führen.
   Kategorie-/Untertypwechsel entfernen Character-Daten, ein Basiswechsel
   behält sie; Nicht-Character-Flows erhalten weder Step noch Antworten.
6. Schema-, Domain-, Routing-, Lifecycle- und RTL-Tests für vollständigen
   Roundtrip, alte V2-Daten, 80-px-Vererbung, Locks, acht Richtungen,
   Aktionen/Frames, schreibfreie Hydration und Bereinigung ergänzen. Danach
   Dokumentation, Vollverifikation, Abschlussaudit und separaten Prompt-14-
   Commit ausführen.

## Ausführungsplan Prompt 13

1. Die reine Profilbibliotheks-Domain um das sichere Anlegen und Duplizieren
   von `BaseProfile`-Familien erweitern. Neue Familien erhalten validierte
   Identität/Zeitstempel; vorhandene Familien und ihre Nachkommen bleiben
   unverändert. Der React-Provider übergibt weiterhin ausschließlich den
   vollständigen, vorab validierten Profilgraphen an einen gemeinsamen Write.
2. Den Core-Wizard in der verbindlichen Reihenfolge
   `Projekt → Bildart → Basisprofil → capability-gesteuerte Fragen` erweitern.
   Ein ausgewähltes Profil muss in der aktuellen Bibliothek existieren;
   Pre-Base-Drafts bleiben auf `wizard/profile`, nachfolgende Schritte wechseln
   erst mit gültiger Base-ID auf `wizard/editor`.
3. Alle globalen Basiswerte aus `BaseProfileValuesSchema` in RHF/Zod abbilden.
   Wirksame Werte und ihre Quelle werden sichtbar; Figurenhöhe erscheint nur
   bei `scaledCharacter`, Welt-Raster und Kamera nicht bei `freeComposition`.
   Entsperrte Abweichungen werden als minimale Asset-Overrides normalisiert,
   redundante und irrelevante Werte entfernt.
4. Gesperrte Felder nicht direkt veränderbar machen. Der Konfliktworkflow bietet
   Abbrechen, Wechsel der Familie, Duplizieren oder eine neue Familie. Erst ein
   erfolgreich persistiertes Duplikat/eine neue Familie wird in den Draft
   übernommen; Originalprofil und Draft bleiben bei Fehlern unangetastet.
5. Profilwechsel explizit bestätigen, wenn Elternreferenzen oder Overrides
   betroffen sind. Dabei Antworten behalten, aber Kategorieprofil,
   Assetprovenienz und technische Overrides bewusst bereinigen; Auswahl,
   Resume und Hydration bleiben bis zur Nutzeraktion schreibfrei.
6. Pure Domain-/Routing-/Reducer-Tests sowie RTL-Flows für Vererbung,
   Lock-Konflikt, Duplikation/Neuanlage, Profilwechsel, Capability-Relevanz,
   Recovery und fehlgeschlagene Gesamtgraph-Writes ergänzen. Danach Dokumentation,
   Vollverifikation, Diff-Review und den separaten Prompt-13-Commit ausführen.

## Aktuelle Agentenübergabe

- Öffentliche V2-Taxonomie: `src/domain/assets/index.ts`
- Öffentliche Zod-Vertragsgrenze: `src/schemas/index.ts`
- Persistierte und importierte Daten immer als `unknown` an die dortigen
  `parse*`-Funktionen übergeben; keine parallelen handgeschriebenen Profiltypen.
- Öffentliche Profilauflösung: `src/domain/profiles/index.ts`. Der Aufrufer
  übergibt bereits validierte Profile an `resolveProfile()` und verzweigt über
  `status: "resolved" | "conflict"`; Konfliktergebnisse besitzen kein
  produktiv nutzbares `profile`.
- `createCompatibilityKey()` erzeugt ausschließlich aus aufgelösten,
  relevanten Werten einen versionierten `pf2-compat-v1__...`-Schlüssel.
- Lock-, Referenz- und Pflichtwertfehler sind strukturierte Konflikte.
  Redundante, irrelevante und veraltete Overrides/Keys sind strukturierte
  Hinweise. `characterHeight` wird ohne `scaledCharacter` entfernt.
- `pixelDensity` bleibt der kanonische Feldname. Einen gespeicherten
  `compatibilityKey` nie blind übernehmen, sondern aus den aufgelösten,
  tatsächlich relevanten Werten neu berechnen und validieren.
- `characterHeight` bei Kategorien ohne `scaledCharacter` weder in den
  Compatibility Key noch still in fachliche Overrides einfließen lassen.
- Öffentliche Infrastrukturgrenze: `src/services/index.ts`. UI-Code verwendet
  `createBrowserV2StorageAdapter()`; nur dieser Adapter greift direkt auf
  `window.localStorage` zu. Tests und Domain-Aufrufer injizieren den schmalen
  `KeyValueStorage`-Port.
- Kanonische V2-Keys stehen in `V2_STORAGE_KEYS`; `pixelforge:v2:draft` ist der
  einzige Draft-Key. Profil-Namespaces enthalten versionierte
  Collection-Envelopes. Reads liefern `valid | empty | invalid | unavailable`
  und werfen bei korruptem Browser-Storage nicht.
- `writeProfileLibrary()` validiert Profile, Referenzen, Locks und neu
  berechnete Compatibility Keys vor einem Best-Effort-Gesamtwrite mit
  Rollback-Versuch.
- `migrateLegacyV1Storage()` sichert die exakten V1-Rohstrings zuerst, belässt
  die V1-Keys unverändert und markiert den Backup-Status erst nach allen
  Profilwrites als `completed`. Ein `prepared`-Backup wird deterministisch
  wiederaufgenommen; ein `completed`-Backup macht Folgeläufe zu einem No-op.
- Migrierte Profile tragen `migratedFromVersion: 1`; nur das AssetProfile trägt
  das isolierte, JSON-validierte `legacyData`. Diese Provenienz wird weder vom
  Resolver noch später von der Prompt Engine ausgewertet.
- Öffentliche JSON-Übertragung: `createProfileExportBundle()`,
  `serializeExportBundle()`, `parseExportBundleJson()`,
  `inspectProfileImport()` und `importProfileBundle()`. Teil-Exporte schließen
  Base-/Category-Abhängigkeiten ein. Gleiche IDs mit gleichen Daten sind No-op;
  abweichende Daten benötigen die explizite Strategie `replaceExisting`.
- Öffentliche Brand-Konfiguration: `src/config/index.ts`. Sichtbare Texte
  verwenden `BRAND`; `EXPORT_APPLICATION_ID` bleibt als persistierter
  Protokollwert unabhängig von späterem Rebranding stabil.
- Öffentliche Theme-Domain: `src/domain/theme/index.ts`. `ThemePreference`
  (`light | dark | system`) und `ResolvedTheme` (`light | dark`) dürfen nicht
  vermischt werden.
- Öffentliche Settings-Grenze: `src/store/settings/index.ts`.
  `SettingsProvider` erhält einen schmalen `readSettings`/`writeSettings`-Port,
  bewahrt das vollständige AppSettings-Objekt und schreibt nur nach expliziter
  Nutzeraktion. System-Mediaevents ändern weder Storage noch `updatedAt`.
- `main.tsx` erzeugt den Browser-Storage-Adapter einmalig am Composition Root.
  Komponenten greifen weiterhin niemals direkt auf `localStorage` zu.
- Am `<html>`-Root steht ausschließlich das aufgelöste
  `data-theme="light|dark"`; die Präferenz `system` bleibt im Settings-State.
- Wiederverwendbare Basiskomponenten werden über `src/components/ui/index.ts`
  exportiert. Komponentenfarben und Maße stammen aus `styles/tokens.css`.
- Öffentliche View-Taxonomie: `src/domain/navigation/index.ts`. Die sechs IDs
  `dashboard | profiles | wizard | review | output | settings` sind zugleich
  die einzige Quelle für `AppSettings.startView`.
- Öffentliche Navigationsinfrastruktur: `NavigationAdapter` und
  `createBrowserNavigationAdapter()` aus `src/services/index.ts`. Die Route
  liegt im Query-Key `?view=…`; Fragmentanker bleiben für In-Page-Navigation
  wie `#main-content` frei.
- Öffentliche React-Navigationsgrenze: `src/store/navigation/index.ts`.
  Gültige URL-Ansicht gewinnt vor `settings.startView`; fehlende oder ungültige
  Werte werden mit `replaceView()` kanonisiert, Nutzerwechsel mit `pushView()`.
- Normale Navigation verändert AppSettings und `updatedAt` nicht. Browser-
  History-Events aktualisieren ausschließlich den View-State und erzeugen
  selbst keinen neuen History-Eintrag.
- `App` benötigt Storage- und Navigation-Adapter. `main.tsx` erzeugt beide
  Browseradapter einmalig; Tests verwenden `MemoryStorage` und
  `MemoryNavigation`.
- Öffentliche Dashboard-Metadaten und reine Read-Model-Projektion liegen in
  `src/features/dashboard/dashboardCatalog.ts` und `dashboardData.ts`. Die
  Kategorien werden exhaustiv aus `ASSET_CATEGORY_IDS` abgeleitet; UI-Code
  pflegt keine zweite Taxonomie.
- Das Dashboard liest `ProfileLibrary` und `WizardDraft` ausschließlich über
  den schmalen `DashboardStorage`-Port. Anzeigen, Kategorie-, Profil- und
  Draft-Start schreiben nichts; nur eine ausdrückliche Basisprofilwahl
  aktualisiert validierte AppSettings über den Settings-Provider.
- Öffentliche lokale Kategorie-/Materialicons werden über
  `src/components/icons/index.ts` exportiert. Sie sind dekorativ; sichtbare
  Kategorien und Materialien behalten immer Textlabels.
- `src/store/wizard/index.ts` exportiert den flüchtigen `WizardStartIntent`
  (`newAsset | profile | resume`). Dieser Übergabestatus ist noch kein
  persistierter `WizardDraft`; dessen Autosave bleibt Prompt 11 vorbehalten.
- `ViewLink` aus `src/components/navigation/index.ts` ist die gemeinsame
  zugängliche Link-Grenze für Shell und Dashboard. Ein `onNavigate` kann einen
  fachlichen Startintent setzen, bevor die bestehende View-Navigation läuft.
- Öffentliche immutable Assetprofil-Mutationen liegen in
  `src/domain/profiles/index.ts`. Favorisieren verändert nur
  Organisationsmetadaten; Duplikate erhalten neue ID/Zeit, aber dieselbe
  validierte Elternkette und denselben effektiven Compatibility Key; Löschen
  entfernt nie Base-/Kategorieprofile kaskadierend.
- `src/store/profiles/index.ts` ist die React-Grenze für die geladene
  Gesamtbibliothek, Profilfilter und Mutationen. Der Provider übernimmt einen
  Kandidaten erst nach Zod-Prüfung und erfolgreichem Best-Effort-
  `writeProfileLibrary()` mit Rollback-Versuch; Fehler bleiben fail-closed
  sichtbar.
- `src/features/profiles/profileLibraryData.ts` filtert und gruppiert
  aufgelöste Profile rein. Compatibility Keys bleiben opak und stammen aus
  `resolveProfile()`, nicht blind aus dem gespeicherten Snapshot.

## Ergebnis Prompt 07

1. Die zentrale `BRAND`-Konfiguration und eine pure Auflösung von
   `light | dark | system` wurden als öffentliche, UI-unabhängige Verträge angelegt.
2. Ein React-Settings-Provider mit typisiertem Context/Reducer lädt validierte
   App-Einstellungen über den vorhandenen Storage-Adapter und persistiert
   ausschließlich explizite Änderungen ohne Reload.
3. Die wirksame Systempräferenz wird über `prefers-color-scheme` beobachtet und
   als aufgelöstes `data-theme="light|dark"` am Dokument-Root angewandt.
4. Semantische Light-/Dark-Tokens, globale Grundregeln, zugänglicher
   Theme-Schalter und wiederverwendbare CSS-Module-Basiskomponenten sind aktiv.
5. Gespeicherte Einstellungen, Theme-Wechsel, Systemwechsel, StrictMode und
   degradierte Storage-Pfade sind mit Vitest/React Testing Library abgedeckt.

## Ausführungsplan Prompt 08

1. Einen frameworkfreien, typisierten View-Vertrag mit Query-Parsing und einen
   injizierbaren Browser-/Memory-Navigationsadapter anlegen.
2. Navigation per Context und Reducer aufbauen; gültige URL-Ansichten haben
   Vorrang, andernfalls gilt die gespeicherte `startView`.
3. Semantische App Shell mit Header, Primärnavigation, globalen Aktionen,
   Hauptbereich, View-Platzhaltern und responsivem Layout umsetzen.
4. Navigation, aktive Ansicht, History-Synchronisation, ungültige URLs und
   StrictMode-Lifecycle mit Vitest und Testing Library absichern.
5. Architektur- und Übergabedokumentation aktualisieren, vollständig
   verifizieren und Prompt 08 separat committen.

## Ergebnis Prompt 08

1. Sechs Top-Level-Ansichten besitzen einen gemeinsamen typisierten Vertrag,
   den auch das Zod-Schema der gespeicherten Startansicht verwendet.
2. Ein injizierbarer Query-/History-Adapter trennt Browserzugriffe vom React-
   State und lässt echte Links, modifizierte Klicks und Zurück/Vorwärts zu.
3. Der Navigation-Context löst initial `gültige URL → startView`, repariert
   fehlende oder ungültige Routen per Replace und verhindert Same-View-Pushes.
4. Die responsive, zugängliche App Shell enthält Branding, sechs primäre Ziele,
   zwei globale Aktionen, Theme-Steuerung, fokussierbares Main-Landmark und
   genau eine aktive View mit aktualisiertem Dokumenttitel.
5. Das bisherige visuelle Fundament lebt als Dashboard-Platzhalter weiter;
   Profile, Wizard, Prüfung, Ausgabe und Einstellungen haben bewusst nur
   vorbereitete Flächen, damit Prompt 09 und Folgephasen nicht vorgezogen sind.
6. Pure Domain-/Reducer-Tests, Browseradapter-Tests und RTL-Interaktionstests
   decken URL-Priorität, Fallback, Tastatur, History und StrictMode ab.

## Übergabe an Prompt 09

- `src/features/dashboard/DashboardView.tsx` ist die gezielte Austauschgrenze
  für Hero, letzte Profile, Favoriten und neun Kategorie-Karten.
- Top-Level-IDs, `?view=…`-Protokoll und `NavigationProvider` bleiben stabil;
  eine Kategorieauswahl ergänzt nur den fachlichen Wizard-Startzustand.
- Das Dashboard behält `dashboard-view-title`, damit Main-Landmark,
  Dokumenttitel und bestehende Shell-Tests stabil bleiben.
- Neue Kategorie- und Material-Icons gehören als lokale SVG-React-Komponenten
  unter `src/components/icons/`; keine Icon-Abhängigkeit hinzufügen.
- Prompt 09 ersetzt ausschließlich den Dashboard-Platzhalter. Profile und
  Wizard-Inhalte bleiben ihren eigenen Folgephasen vorbehalten.

## Ausführungsplan Prompt 09

1. Exhaustive Dashboard-Metadaten für die neun bestehenden Asset-Kategorien
   sowie lokale Kategorie- und Material-SVG-Komponenten anlegen.
2. Einen kleinen typisierten Wizard-Start-Intent für neue Kategorien,
   Profilstarts und Resume einführen, ohne `WizardDraft` vorzeitig zu schreiben.
3. Profilbibliothek und einzelnen Draft über einen injizierten Read-Port laden;
   letzte Profile, Favoriten, Basisprofile und relevante Kartenwerte rein
   selektieren und Fehler-/Leerzustände abbilden.
4. Das Phase-08-Fundament durch Hero, Aktionen, 3×3-Kategorieraster,
   Material-Vorlagen, Profilbereiche, Basisprofilübersicht und Resume ersetzen.
5. Kategorie→Wizard, Profil-/Draft-Start, Tastatur, Sortierung, Relevanz,
   Icons, Storage-Degradation und Shell-Regressionen testen.
6. Architektur- und Agentenübergabe aktualisieren, `npm run verify` sowie
   `git diff --check` ausführen und Prompt 09 separat committen.

## Ergebnis Prompt 09

1. Das Dashboard ersetzt den technischen Phase-08-Platzhalter durch einen
   produktorientierten Hero, die Aktionen „Neues Asset“/„Profil laden“, neun
   große Asset-Karten, Materialsprache sowie getrennte Bereiche für letzte
   Profile, Favoriten, eine Basisprofil-Schnellauswahl und einen fortsetzbaren
   Entwurf.
2. Alle neun Kategorien verwenden die bestehende Domain-Taxonomie und eigene
   lokale SVG-React-Icons. Holz, Stein, Schnee, Eis, Metall, Stoff und Leder
   besitzen ebenfalls textbegleitete lokale Materialicons.
3. Ein reines Dashboard-Read-Model löst gespeicherte Profile über die
   Base→Category→Asset-Kette auf, sortiert letzte/Favoriten deterministisch und
   zeigt Tile-, Figuren-, Perspektiv-, tatsächlich konfigurierte Bewegungs-/
   Animations- und Materialdaten nur dort, wo sie fachlich relevant sind.
4. Leere, beschädigte und nicht verfügbare Storage-Zustände bleiben getrennt
   sichtbar; korrupte Daten werden weder ersetzt noch still bereinigt. Das
   Dashboard erfindet keine Demo-Profile.
5. Kategorie-, Profil- und Draft-Einstiege erzeugen einen typisierten,
   flüchtigen Wizard-Startintent. Ein allgemeiner Neustart entfernt eine alte
   Kategorieauswahl; Persistenz und eigentliche Wizard-Schritte folgen später.
6. Kategorie- und Profilkarten sind native Tastaturziele, alle Bereiche
   semantisch beschriftet und die Kartenraster wechseln responsiv von drei über
   zwei auf eine Spalte. Focus- und Reduced-Motion-Regeln sind enthalten.
7. Pure Selector-/Storage-Port-Tests und RTL-Integrationstests decken alle
   Kategorien, relevante Kartenwerte, Sortierung, Favoriten, Icons, Keyboard,
   Resume sowie Fehlerzustände ab.

## Übergabe an Prompt 10

- Ersetze ausschließlich die `profiles`-Platzhalteransicht; Dashboard und
  `dashboard-view-title` bleiben stabil.
- Die Profilbibliothek verwendet dieselben validierten `ProfileLibrary`-
  Verträge und `resolveProfile()` statt Kartenwerte neu zu berechnen. Bei
  Bedarf darf die reine Projektion aus `dashboardData.ts` in einen neutraleren
  gemeinsamen Selector extrahiert werden.
- Kategorie-Labels und Icons kommen aus `dashboardCatalog.ts` beziehungsweise
  `CategoryIcon`; keine zweite Kategorienliste oder Remote-Iconquelle anlegen.
- Profil laden setzt denselben `{ kind: "profile", assetProfileId }`-Intent
  wie eine Dashboard-Karte und navigiert danach in den Wizard.
- Suchen, Kategorie-/Basisfilter, Compatibility-Key-Gruppierung, Favorisieren,
  Duplizieren und Löschen gehören jetzt in Prompt 10. Mutationen müssen die
  komplette Bibliothek über `writeProfileLibrary()` validieren und sichtbare
  Storage-Fehler liefern.
- Löschen benötigt eine ausdrückliche Bestätigung und darf referenzierte
  Profilketten nicht still beschädigen. Prompt 10 erhält eigene RTL-Tests für
  Filter, Gruppierung, Favorit und Laden.

## Ausführungsplan Prompt 10

1. Frameworkfreie, immutable Bibliotheksoperationen für Favorisieren,
   Duplizieren und Löschen von Assetprofilen anlegen; Basis- und
   Kategorieprofile bleiben dabei unveränderte Referenzen der gültigen Kette.
2. Einen `ProfileLibraryProvider` mit Context + Reducer als einzige UI-
   Mutationsgrenze einführen. Jede Kandidatenbibliothek wird vor dem
   Best-Effort-`writeProfileLibrary()` mit Rollback-Versuch erneut mit Zod
   validiert; Fehler bleiben sichtbar und verändern den Bibliotheksgraphen im
   Provider nicht.
3. Aus der vorhandenen Profilauflösung ein gemeinsames Präsentationsmodell
   ableiten und darüber Suche, Kategorie-, Basisprofil- und Favoritenfilter
   sowie eine opake Gruppierung nach dem neu berechneten Compatibility Key
   implementieren.
4. Den `profiles`-Platzhalter durch eine responsive Profilbibliothek mit
   Filterleiste, Ergebnisstatus, relevanten Kerndaten und getrennten Aktionen
   für Laden, Favorisieren, Duplizieren und bestätigt Löschen ersetzen.
5. Pure Mutationen/Selektoren und Nutzerflüsse mit Vitest beziehungsweise RTL
   prüfen, inklusive Keyboard, kombinierter Filter, Storage-Ausfall,
   ID-Kollision und abgebrochener Löschung.
6. Architektur-, Änderungs- und Agentenübergabe aktualisieren, anschließend
   `npm run verify` und `git diff --check` ausführen und Prompt 10 separat
   committen.

## Ergebnis Prompt 10

1. Die echte Profilbibliothek ersetzt ausschließlich die `profiles`-
   Platzhalteransicht und bietet eine beschriftete Suche, Kategorie-,
   Basisprofil- und Favoritenfilter sowie umschaltbare Kategorie- oder
   technische Compatibility-Gruppierung.
2. Alle Kartendaten entstehen aus der bestehenden Profilauflösung. Gleiche
   effektive Werte gruppieren auch über verschiedene Base-IDs zusammen;
   Figurenhöhe erscheint nur für `scaledCharacter`, Tile-/Weltkameraangaben
   nicht bei freier Artwork-Komposition.
3. Assetprofilkarten sind nicht selbst interaktiv, sondern besitzen getrennte
   native Aktionen für Laden, Favorisieren, Duplizieren und Löschen. Laden
   setzt den bestehenden typisierten Profilintent und bleibt schreibfrei.
4. Pure Bibliotheksoperationen ändern immutable ausschließlich das Zielblatt.
   Duplikate erhalten eine neue validierte ID, neue Zeitstempel und keine
   geerbte V1-Migrationsprovenienz; Elternreferenzen und Compatibility bleiben
   erhalten. Basis-/Kategorieprofil-CRUD bleibt den späteren Editor- und
   Konvertierungsphasen vorbehalten.
5. Jede Mutation validiert und schreibt den vollständigen Profilgraphen über
   den zentralen Adapter. Ungültige, nicht verfügbare oder teilweise
   fehlgeschlagene Writes verändern weder Bibliotheksgraph noch sichtbare
   Karten; der Context veröffentlicht dazu eine Fehlermeldung. Löschung erfolgt
   erst nach einem zugänglichen Bestätigungsdialog.
6. Profilfilter leben im appweiten Reducer und bleiben beim Navigieren erhalten.
   Ein erfolgreich gelöschtes Asset entfernt außerdem ausschließlich einen
   exakt passenden flüchtigen Profilstartintent.
7. Domain-, Selector-, Reducer-, Provider- und RTL-Tests decken Filter,
   Gruppierung, relevante 32-/80-px-Fakten, Keyboard-Laden, Favoriten,
   Duplikation, Dialogfokus, Referenzerhalt sowie Storage-Fehler ab.

## Übergabe an Prompt 11

- Ersetze ausschließlich den `wizard`-Platzhalter durch die wiederverwendbare
  Engine; Dashboard, Profilbibliothek und ihre IDs/Überschriften bleiben stabil.
- Der Wizard konsumiert `WizardStartIntent` aus `src/store/wizard/index.ts`:
  `newAsset` darf noch keinen Untertyp erfinden, `profile` muss die ID gegen
  den aktuellen `ProfileLibraryProvider` auflösen und `resume` den validierten
  Draft über den Storage-Adapter laden.
- Die Profilbibliothek ist jetzt der appweite autoritative UI-Stand. Neue
  Profil-Save-Flows dürfen den Adapter nicht direkt umgehen, sondern müssen
  später eine validierte Provider-Aktion ergänzen, damit dessen Ref nicht
  veraltet.
- Der `storageAdapter` ist innerhalb eines App-Lifecycles eine stabile
  Abhängigkeit. Prompt 10 synchronisiert weder Adapterwechsel noch parallele
  externe/localStorage-Tab-Writes; Import und Restore müssen deshalb über eine
  Provider-Hydration laufen, bevor sie eigene Bibliothekswrites auslösen.
- Filterzustand und Profilmutationsmeldung gehören nicht in React Hook Form.
  Die Wizard Engine besitzt stattdessen ihren temporären Formularzustand,
  deklarative Step-Konfiguration, Zod-Schrittschemas, Dirty State sowie den
  einzigen Draft-Autosave-Pfad.
- Autosave darf ausschließlich einen vollständigen, für die aktuelle Route
  gültigen `WizardDraft` schreiben. Fehlende/gelöschte Profil- oder Draft-IDs
  benötigen einen sichtbaren, nicht abstürzenden Wiederherstellungszustand.
- Prompt 11 baut noch keine großen Kategorieeditoren ein; deren Routing und
  Capability-bedingte Felder folgen in Prompt 12.

## Ausführungsplan Prompt 11

1. Den vorhandenen `WizardStartIntent` um einen aktiven, validierten
   Session-Draft ergänzen, ohne React Hook Form als Eigentümer der aktuellen
   Eingabewerte zu ersetzen. Ein neuer Start verwirft nur den flüchtigen
   Sessionstand, nicht ungefragt den persistierten Draft-Slot.
2. Eine deklarative Core-Step-Konfiguration mit stabilen IDs,
   schrittbezogenen Zod-Schemas und RHF-Feldpfaden anlegen. Prompt 11 enthält
   nur Projektstart und die vorbereitete Asset-Grundlage; Untertyp- und
   Capability-Routing bleiben Prompt 12 vorbehalten.
3. Neue, Profil- und Resume-Starts über pure Lifecycle-Funktionen auflösen.
   Resume akzeptiert ausschließlich die exakt angeforderte Draft-ID; Profil-
   starts verwenden den aktuellen `ProfileLibraryProvider` und bewahren
   technische Asset-Overrides im Draft-Snapshot.
4. Die echte Wizard-Ansicht mit semantischem Fortschritt, Vor/Zurück,
   Pflichtfeldfokus, Dirty-/Autosave-Status und einer dauerhaft sichtbaren,
   fachlich wahrheitsgetreuen technischen Zusammenfassung aufbauen.
5. Autosave nur nach einer gültigen Benutzeränderung oder bewusster
   Schrittnavigation auslösen. Mount, Profil-Hydration und Resume bleiben
   schreibfrei; Invalid-/Unavailable-Fehler überschreiben keinen letzten
   gültigen Draft.
6. Pure Lifecycle-/Step-Tests und RTL-Nutzerflüsse für Navigation,
   Pflichtfeldfehler, Autosave, Resume, Recovery, StrictMode und technische
   Relevanz ergänzen; danach Dokumentation, `npm run verify`, Diff-Review und
   separaten Prompt-11-Commit ausführen.

## Ergebnis Prompt 11

1. Der `wizard`-Platzhalter ist durch die generische React-Hook-Form-Engine
   `GuidedWizardEngine` ersetzt. Navigation, Fortschritt, Fokus, Dirty State und
   Persistenz sind von der externen `WIZARD_CORE_FLOW`-Definition getrennt.
   Deren zwei stabile Core-Schritte `project` und `category` besitzen eigene
   Komponenten, Zod-Schrittschemas und tatsächlich genutzte RHF-Feldpfade;
   große Kategorieeditoren sind nicht in die Engine eingebaut.
2. Fortschrittsanzeige, Vor/Zurück, fokussierte Pflichtfeldfehler, sichtbarer
   Dirty-/Save-Status und eine responsive technische Seitenzusammenfassung
   sind semantisch und tastaturbedienbar umgesetzt. Die Zusammenfassung zeigt
   nur bekannte fachlich relevante Werte und keine opaken Compatibility Keys.
3. Neue Starts bleiben zunächst flüchtig. Profilstarts werden gegen den
   aktuellen `ProfileLibraryProvider` aufgelöst und bewahren Eltern-IDs,
   Kategorie, Untertyp, Antworten, optionale Quellprovenienz sowie einen
   validierten Asset-Override-Snapshot. Konflikte starten keinen Ersatzdraft.
4. Resume akzeptiert ausschließlich die exakt angeforderte Draft-ID und prüft
   bei selektierten Drafts ihre Base-/Category-Referenzen sowie den portablen
   Override-Snapshot gegen aktuelle Locks. Unbekannte Step-IDs fallen nur in
   der Session auf einen sicheren Core-Schritt zurück; fehlende, beschädigte,
   widersprüchliche oder nicht verfügbare Daten bleiben unangetastet und führen
   in einen sichtbaren Recovery-Zustand.
5. Der Wizard-Reducer hält aktiven Draft, strukturelle Baseline, ungültige
   transiente Core-Formwerte und expliziten transienten/persistierten Status
   über View-Unmounts hinweg. Jeder neue Start erhöht die Session-Revision,
   setzt dadurch auch innerhalb der offenen Wizard-Ansicht eine frische Session
   auf und verschiebt den Fokus wieder auf den neuen Hauptinhalt.
6. Ein gültiger Benutzer-Edit wird nach 300 ms lokal gesichert; bewusste
   Navigation schreibt den neuen Step unmittelbar. Mount, Profil-Hydration und
   Resume schreiben nichts. Fehlgeschlagene Writes verschieben die Baseline
   nicht, zeigen den Fehler und erhalten die Eingaben als dirty Sessionstand.
7. Schema-, Step-, Lifecycle-, Reducer-, Provider- und RTL-Tests decken
   Navigation, Pflichtfelder, Autosave, Resume, Recovery, Session-Neustart,
   Profil-Snapshots, StrictMode und technische Relevanz ab.

## Übergabe an Prompt 12

- Erweitere `WIZARD_CORE_FLOW` mit typisierten Formwerten, Step-Komponenten,
  Zod-Schemas, Feldpfaden und Draft-Mapping. Baue Kategorie-, Untertyp- und
  Capability-Schritte nicht als Sonderfälle in `GuidedWizardEngine` ein.
- Die Dashboard-Kategorie ist bis zur verbindlichen Auswahl nur
  `categoryHint`. Prompt 12 überführt sie zusammen mit einem gewählten Untertyp
  und gültigen initialen Antworten in die selektierte Draft-Union; frühe Drafts
  erfinden weiterhin keine Kategorie- oder Capability-Daten.
- Sichtbarkeit von Richtungen, Animation, Tileability, Character Scale und
  freier Komposition muss ausschließlich aus `resolveCapabilities()` folgen.
  Insbesondere darf ein nicht-directional Asset keine 4/8-Auswahl erhalten.
- Profil- und Resume-Drafts behalten `sourceAssetProfileId`, `overrides`,
  Elternreferenzen und bestehende Antworten. Ein Kategorienwechsel muss
  irrelevante Felder kontrolliert entfernen oder bewusst in einer getrennten
  Rückkehrhistorie halten.
- Nutze weiter den einzigen `WizardSessionProvider`- und Draft-Storage-Pfad und
  erweitere dessen transienten Rohwert-Snapshot typisiert um neue Core-Felder.
  Hydration bleibt schreibfrei; nur gültige Benutzeränderungen oder bewusste
  Navigation dürfen die persistierte Baseline verschieben.

## Ausführungsplan Prompt 12

1. Den Core-Formvertrag um Kategorie, Untertyp und die kleinen gemeinsamen
   Capability-Felder erweitern. Kategorie-only bleibt ein transienter RHF-
   Zustand; erst ein zur Kategorie passender Untertyp erzeugt einen gültigen
   selektierten `WizardDraft`.
2. Eine pure Routing- und Draft-Projektion ergänzen, die alle Untertypen aus
   der zentralen Taxonomie bezieht, Capabilities ausschließlich über
   `resolveCapabilities()` bestimmt und bei Klassifikationswechseln alte
   Antworten, Profilprovenienz sowie irrelevante Overrides kontrolliert
   entfernt.
3. Den externen `WIZARD_CORE_FLOW` deklarativ auf Projekt, Hauptkategorie,
   Untertyp und Asset-Verhalten erweitern. Die generische Engine erhält nur
   die Fähigkeit, valide, aber noch nicht persistierbare Formularzwischenstände
   ohne Fehlermeldung zu navigieren; projektspezifische Zweige bleiben außen.
4. Kategorie- und Untertypwahl als zugängliche native Controls umsetzen. Im
   Verhalten-Schritt erscheinen Bewegungs-, Richtungs-, Animations- und
   Tileability-Fragen sowie Scale-/Kompositionshinweise nur bei der jeweils
   aufgelösten Capability; ein bestätigter Kategorienwechsel verwirft die
   betroffenen Detaildaten sichtbar.
5. Den transienten Session-Snapshot und die technische Zusammenfassung auf die
   neuen Felder ausweiten. Neue selektierte Drafts ohne Basisprofil bleiben auf
   `wizard/profile` sicher fortsetzbar, damit Prompt 13 anschließend das
   Basisprofil ergänzen kann.
6. Pure Routing-/Lifecycle-/Reducer-Tests und RTL-Flows für NPC, Holztextur,
   Windbaum, Bereinigung, Profil-/Resume-Hydration, Fokus und schreibfreie
   Initialisierung ergänzen; anschließend Dokumentation, Vollverifikation,
   Diff-Review und den separaten Prompt-12-Commit ausführen.

## Ergebnis Prompt 12

1. Der deklarative Core-Flow fragt nach dem Projektnamen zuerst die
   Hauptkategorie und anschließend einen gültigen Untertyp ab. Kategorie-only
   bleibt bewusst ein transienter RHF-Zustand; erst die vollständige Auswahl
   erzeugt einen strikt validierten selektierten `WizardDraft`.
2. `wizardCategoryRouting.ts` ist die pure Grenze zwischen Formular und
   Domainmodell. Es validiert Kategorie/Untertyp gegen die zentrale Taxonomie,
   löst Capabilities ausschließlich mit `resolveCapabilities()` auf und
   projiziert nur die für Prompt 12 kontrollierten Antworten zurück in den
   Draft.
3. `GuidedWizardEngine` unterstützt deklarative `isApplicable`-Prädikate und
   verwendet dieselbe gefilterte Schrittliste für Fortschritt, Vor/Zurück,
   Fehlerfokus und Resume-Fallback. Die Engine enthält weiterhin keine
   projektspezifische Kategorieverzweigung. Eine `null`-Projektion kennzeichnet
   valide, aber noch nicht persistierbare Formularzwischenstände; Navigation
   bleibt möglich, ohne den alten Draft erneut zu schreiben.
4. Richtungen erscheinen nur bei `directional`, Animation nur bei `animated`
   und Kachelbarkeit nur bei `tileable`. Directional Assets können bewusst
   keine, vier oder acht Ansichten wählen. Damit erhält ein NPC Richtungs- und
   Animationsfragen, eine Holztextur ausschließlich Kachelbarkeit und ein
   Windbaum Animation ohne Richtungswahl.
5. Ein bestätigter Kategorie- oder Untertypwechsel startet mit leeren
   Kategorieantworten, entfernt Kategorieprofil- und Assetprovenienz, leert
   alte Validierungsergebnisse und entfernt einen fachlich irrelevanten
   Figurenhöhen-Override. Allgemeine Basisreferenz und relevante technische
   Overrides bleiben erhalten.
6. Der Session-Snapshot umfasst nun alle Core-Routingwerte. Ein gültiger
   ausgewählter Draft darf vor der Basisprofilwahl auf `wizard/profile` ohne
   erfundene Base-ID fortgesetzt werden; vorhandene, aber fehlende Referenzen
   bleiben weiterhin ein Recovery-Fehler. Hydration und Resume bleiben
   schreibfrei.
7. Pure Routing-/Lifecycle-Tests und RTL-Nutzerflüsse decken dynamische
   Schrittlisten, NPC, Holztextur, Windbaum, Datenbereinigung, Klassifikations-
   bestätigung, transienten Back/Forward-Erhalt, Fokus und Pre-Base-Resume ab.

## Ergebnis Prompt 13

1. Der Wizard führt nach Projekt und vollständiger Assetklassifikation durch
   einen verpflichtenden Basisprofil-Schritt. Capability-Schritte werden erst
   mit einer in der aktuellen Bibliothek vorhandenen, kompatiblen Base-ID
   zugänglich; Pre-Base-Drafts bleiben weiterhin sicher fortsetzbar.
2. Der Editor bildet sämtliche globalen Produktionswerte mit RHF und Zod ab,
   zeigt pro Wert Quelle und Sperrstatus und begrenzt Figurenhöhe sowie
   Raster-/Kamerafelder auf passende Capabilities. Entsperrte Abweichungen
   werden gegen die gesamte Base→Category-Vererbung minimal normalisiert;
   redundante oder unsichtbar irrelevante Overrides werden entfernt.
3. Gesperrte Werte sind nicht direkt editierbar. Der sichtbare Konfliktweg
   bietet Abbruch, andere Familie, eigenständiges Duplikat oder neue Familie.
   Bestehende Base-Profile und ihre Nachkommen werden dabei nie still mutiert
   oder umgehängt.
4. Neue und duplizierte Produktionsfamilien erhalten validierte IDs und
   Zeitstempel. Der Provider prüft den vollständigen Profilgraphen und übergibt
   ihn an einen gemeinsamen Adapter-Write; erst dessen Erfolg und die
   aktualisierte Bibliothek aktivieren die neue Familie im Draft. Fehler lassen
   Bibliothek und Auswahl unverändert.
5. Ein Wechsel der Produktionsfamilie benötigt Bestätigung, übernimmt deren
   Werte als vollständigen Formular-Snapshot, behält Fachantworten und entfernt
   alte Kategorieeltern, Assetprovenienz sowie technische Overrides.
   Mehrfeldänderungen werden über
   einen generischen Engine-Hook genau einmal als vollständiger Snapshot in den
   normalen Autosave-Pfad projiziert.
6. Domain-, Provider-, Routing- und RTL-Tests decken Vererbung, Locks,
   Wechsel, Duplikation, Neuanlage, Recovery, fehlgeschlagene Gesamtgraph-Writes
   und Capability-Relevanz ab. Hydration und Resume bleiben schreibfrei.

## Übergabe an Prompt 14

- `WIZARD_CORE_FLOW` garantiert jetzt die Reihenfolge
  `Projekt → Kategorie/Untertyp → Basisprofil → Capability-Schritte`. Der
  Character-Editor wird außen als eigener Schritt/Feature-Zweig ergänzt; die
  generische Engine erhält keine Character-Sonderlogik.
- Figuren lesen den wirksamen Maßstab aus der aufgelösten Profilkette. Eine
  etwa 80 px hohe Standardfigur darf im Character-Editor weder als separater
  Assetwert dupliziert noch an einem gelockten `characterHeight` vorbeigeführt
  werden.
- Rollen-, Körper-, Kopf-, Kleidungs-, Ausrüstungs-, Ausdrucks- und
  Silhouettenfragen gehören in das strikt validierte Character-Antwortschema.
  Bereits vorhandene unbekontrollierte Freitextantworten sind keine zweite
  technische Profilquelle.
- Richtungswahl bleibt ausschließlich capability-gesteuert. Vier und acht
  Richtungen sind bei `directional` möglich; Animationen und Frames werden
  davon getrennt nach `animated` modelliert.
- Neue Felder müssen den transienten RHF-Snapshot, Draft-Roundtrip,
  schreibfreie Profil-/Resume-Hydration, Zusammenfassung und responsive
  Tastaturbedienung gemeinsam abdecken.

## Ergebnis Prompt 14

1. Die öffentliche Character-Domain stellt kanonische Kataloge für Körper,
   Darstellung und Animation sowie NPC-/Humanoid-Untertypregeln bereit. Das
   gemeinsame strikte `CharacterAnswersSchema` umfasst den vollständigen
   Character-/NPC-Katalog; alle neuen Antworten bleiben optional und
   `characterHeight` ist weiterhin ausschließlich ein technischer Profilwert.
2. Ein eigener Schritt `Figur und Rolle` liegt nach der Basisprofilwahl und
   vor Richtung und Animation. Der responsive RHF-Editor gliedert Identität,
   Körper, Kopf, Kleidung, Zubehör, Material, Palette und Lesbarkeit,
   blendet NPC-Kontext nur für passende Untertypen ein und entfernt humanoide
   Kleidungsfragen bei Tier und Kreatur.
3. Der Editor zeigt die wirksame Figurenhöhe read-only mit Quelle und
   Lock-Status. Damit bleiben die 80 px der Standardfamilie geerbt;
   Character-Antworten und redundante technische Asset-Overrides duplizieren
   den geerbten Wert nicht.
4. Richtungswahl bleibt allein im `directional`-Schritt und unterstützt vier
   oder acht Ansichten. Animation bleibt davon getrennt: eine kanonisch
   geordnete, eindeutige `animationActions`-Liste speichert pro gewählter
   Aktion ein bis acht Frames. Walk startet bei fünf Frames; vorhandene
   Einzelaktionsdaten bleiben lesbar und werden beim nächsten gültigen
   Benutzer-Write in die neue Form überführt.
5. Sämtliche Character-Werte laufen verlustfrei durch RHF-Rohsnapshot,
   Draft-Hydration, Autosave und Resume. Ein Basisfamilienwechsel behält
   Character-Antworten, während Kategorie- oder Untertypwechsel sie selbst bei
   einem veralteten Formularsnapshot an der Mapper-Grenze entfernen.
   Wird ein geerbtes optionales Character-Default ausdrücklich geleert, löst
   der Draft die Kategorieprovenienz und materialisiert alle übrigen wirksamen
   Fach- und Technikwerte, damit der gelöschte Wert beim Resume nicht zurückkehrt.
   Profilstart, Resume und Mount bleiben schreibfrei.
6. Live-Zusammenfassung und Dashboard-Projektion zeigen die tatsächliche Rolle,
   geerbte Höhe, gewählte Richtungszahl sowie jede konfigurierte Aktion mit
   eigener Framezahl. Schema-, Domain-, Routing-, Lifecycle-, Dashboard- und
   RTL-Tests decken zusätzlich Locks, Legacy-Hydration und Nicht-Character-
   Ausschluss ab.

## Übergabe an Prompt 15

- Ergänze den Moving-Object-Editor als eigenen Feature-Schritt außerhalb der
  generischen `GuidedWizardEngine`. Er folgt demselben Base-/Capability-Vertrag,
  darf aber keine Character-Felder oder NPC-Untertypregeln wiederverwenden.
- Erweitere das strikte `MovingObjectAnswersSchema` um Objektklasse,
  Bewegungsart, Footprint, Anker, Material und Zustand. Neue Antworten müssen
  wieder durch Rohsnapshot, Draft-Mapping, Autosave, Resume und Summary laufen.
- Richtung bleibt ausschließlich über `directional` sichtbar: Ein Wagen kann
  vier oder acht Ansichten erhalten, ein nur pulsierender beziehungsweise
  schwebender Kristall darf durch `animated` nicht automatisch richtungsfähig
  werden.
- Das Character-spezifische `animationActions`-Modell und dessen Framebereich
  bleiben isoliert. Definiere für bewegliche Nicht-Figuren die fachlich
  passende Animations-/Frameabbildung, ohne Legacy-V2-Daten unlesbar zu machen.
- Kategorie-/Untertypwechsel müssen Moving-Object-Daten defensiv bereinigen;
  ein reiner Basiswechsel behält sie. Prompt Engine, Review und Export bleiben
  weiterhin späteren Phasen vorbehalten.

## Ergebnis Prompt 15

1. Eine öffentliche, frameworkfreie Moving-Object-Domain definiert
   Objektklassen, Bewegung, Anker, Mechanik, Material, Zustand, Licht,
   Schatten und kanonisch geordnete Animationssequenzen. Das additive strikte
   Schema akzeptiert pro eindeutiger Sequenz 1 bis 16 Frames und hält die
   bisherigen `animationType`-/`framesPerDirection`-Daten lesbar.
2. Der eigene responsive Schritt `Objekt und Bewegung` folgt direkt auf die
   Basisprofilwahl. Er erfasst Objektklasse, Zweck, Grundform, Beschreibung,
   Footprint, Höhe, Anker, Bewegungsart, Mechanik, Material, Zustand sowie
   Licht- und Schattenverhalten; die aus dem Untertyp abgeleitete Objektklasse
   bleibt read-only sichtbar.
3. Richtung und Animation sind unabhängig: Ein Wagen erhält den
   capability-gesteuerten 4-/8-Richtungs-Schritt, während ein pulsierender
   schwebender Kristall Sequenzen und Frames ohne Richtungsfrage bearbeiten
   kann. Animationsdefaults entstehen ausschließlich durch das ausdrückliche
   Aktivieren einer Sequenz.
4. Moving-Object-Werte laufen durch Base→Category→Asset-Auflösung,
   RHF-Rohsnapshot, minimale Draft-Projektion, Autosave und schreibfreies
   Resume. Ein Basiswechsel erhält wirksame Fachdaten; Kategorie- oder
   Untertypwechsel entfernt sie. Ausdrückliches Leeren geerbter Werte löst die
   Elternprovenienz und verhindert deren Wiederkehr beim Resume.
5. Wizard-Zusammenfassung und Dashboard zeigen Objektklasse, Bewegung,
   Footprint, Anker, capability-gesteuerte Richtungen, Sequenzen mit Frames,
   Material und Zustand. Legacy-Einzelanimationen werden weiterhin angezeigt,
   ohne beim reinen Lesen kanonische Writes auszulösen.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Dashboard- und RTL-Tests
   decken insbesondere den Wagen- und Kristall-Flow, Legacy→Canonical,
   Vererbung, Detach, Basiswechsel, Bereinigung, Autosave und Resume ab.

## Übergabe an Prompt 16

- Ergänze ausschließlich den fokussierten Texture-/Material-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Materialart, Einsatz, Seamless-Verhalten,
  Tilegröße, Strukturgrad, Zustand, Oberfläche, Feuchtigkeit/Vereisung und
  Licht.
- Texture-Daten erhalten einen eigenen strikt typisierten Schema-, Domain- und
  Feature-Zweig. Character- und Moving-Object-Felder werden nicht
  wiederverwendet; Richtung, Kleidung und Figurenfragen bleiben vollständig
  ausgeblendet.
- Neue Werte müssen wieder durch Klassifikationsbereinigung,
  Base→Category→Asset-Vererbung, Rohsnapshot, minimale Draft-Projektion,
  Autosave, schreibfreies Resume, Summary und Dashboard laufen.
- Ein Holzprofil ist der verbindliche End-to-End-Fall. Es darf ausschließlich
  Texturfragen und relevante gespeicherte Texturdaten erzeugen.
- Prompt Engine, Review-/Output-Workspace und alle Editoren ab Prompt 17
  bleiben späteren, getrennt zu committenden Phasen vorbehalten.

## Ergebnis Prompt 16

1. Eine öffentliche, frameworkfreie Texture-Domain definiert stabile Kataloge
   für Materialart, Einsatz, Orientierung, Struktur, Zustand, Oberfläche,
   Feuchtigkeit, Vereisung und Licht. Das additive strikte Schema hält alle
   bisherigen V2-Texturdaten ohne schreibende Defaults lesbar und prüft die
   Übereinstimmung von Materialtyp und Untertyp.
2. Der eigene responsive Schritt `Textur und Material` folgt direkt auf die
   Basisprofilwahl. Er zeigt den aus dem Untertyp abgeleiteten Materialtyp und
   die zentral geerbte Tilegröße read-only; Nahtlosigkeit bleibt ausdrücklich
   dreiwertig (`nicht festgelegt`, `ja`, `nein`).
3. Texture besitzt den Seamless-Wert ausschließlich im Spezialeditor und
   überspringt den generischen `tileability`-Schritt. Richtungs-, Animations-,
   Bewegungs-, Kleidungs- und Figurenfelder erscheinen nicht; ältere Texture-
   Drafts auf `tileability` werden beim Resume gezielt zu `textureDetails`
   weitergeführt.
4. Sämtliche Texture-Werte laufen durch Base→Category→Asset-Auflösung,
   RHF-Rohsnapshot, minimale Draft-Projektion, Autosave und schreibfreies
   Resume. Basiswechsel erhalten wirksame Fachdaten, Klassifikationswechsel
   entfernen sie und Explicit Clear löst geerbte Provenienz zuverlässig.
5. Wizard-Zusammenfassung und Dashboard zeigen nur tatsächlich konfigurierte
   Material-, Einsatz-, Seamless-, Struktur-, Zustands-, Oberflächen-,
   Feuchtigkeits-, Vereisungs-, Orientierungs- und Lichtfakten sowie die
   zentrale Tilegröße.
6. Domain-, Schema-, Routing-, Lifecycle-, Session-, Dashboard- und RTL-Tests
   decken insbesondere das Holzprofil, Vererbung, Detach, Basiswechsel,
   Bereinigung, Autosave, Resume und alte V2-Texturdaten ab.

## Übergabe an Prompt 17

- Ergänze ausschließlich den Nature-/Tree-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Pflanzentyp und Art, Klimazone, Saison, Stamm,
  Krone, Wurzeln, Moos, Pilze, Schnee, Ranken, Footprint beziehungsweise Basis,
  Varianten sowie optional eine Windanimation.
- Ein normaler Baum bleibt nicht-directional. Eine optionale Windanimation darf
  den Animationsschritt aktivieren, aber niemals automatisch einen
  Richtungsschritt erzeugen.
- Zentrale technische Werte bleiben in der Base→Category→Asset-Kette und
  werden im Nature-Editor nicht dupliziert. Neue Fachwerte müssen vollständig
  durch minimale Vererbung, Explicit Clear, Basis-/Klassifikationswechsel,
  Rohsnapshot, Autosave, schreibfreies Resume, Summary und Dashboard laufen.
- Nutze mindestens einen vollständigen Baum-Flow als End-to-End-Fall und prüfe,
  dass weder Texture-, Character- noch Moving-Object-Daten fortgeführt werden.
- Static-Object-Editor, Prompt Engine, Review und Output bleiben späteren,
  getrennt zu committenden Phasen vorbehalten.

## Ergebnis Prompt 17

1. Eine öffentliche frameworkfreie Nature-Domain definiert stabile readonly
   Kataloge, ein vollständiges Untertyp→Pflanzentyp-Mapping und gemeinsame
   Guards für Stamm, Krone und Wurzeln. Das strikte additive Schema hält alte
   V2-Naturdaten ohne schreibende Defaults lesbar und weist widersprüchliche
   Pflanzentypen sowie anatomisch irrelevante Felder zurück.
2. Der responsive Schritt `Pflanze und Natur` folgt direkt auf die
   Basisprofilwahl. Er erfasst Art, Klima, Saison, Alter, Silhouette,
   untertypabhängige Anatomie, Moos, Pilze, Schnee, Ranken, vollständigen
   Footprint, Bodenanschluss, Varianten und Zusatzdetails. Pflanzentyp und
   zentrale Tilegröße bleiben read-only und werden nicht fachlich dupliziert.
3. Animation und Richtung bleiben getrennte Capabilities: animierbare
   Natur-Untertypen können einen Wind-, Magie- oder individuellen Loop
   besitzen, während kein Natur-Untertyp einen 4/8-Richtungsschritt erhält.
4. Sämtliche Nature-Felder laufen durch Base→Category→Asset-Auflösung,
   minimale Draft-Projektion, RHF-Rohsnapshot, Autosave und schreibfreies
   Resume. Basiswechsel erhalten wirksame Fachwerte,
   Klassifikationswechsel bereinigen sie und Explicit Clear löst geerbte
   Provenienz ohne Wiederkehr entfernter Defaults.
5. Live-Zusammenfassung und Dashboard zeigen kompakte, untertypgültige
   Pflanzen-, Umwelt-, Anatomie-, Bewuchs-, Footprint-, Varianten- und
   Animationsfakten. Lange Fachtexte bleiben vollständig gespeichert, werden
   aber nicht in Karten oder Screenreader-Beschreibungen vervielfacht; ein
   defensiver Pflanzentypkonflikt führt zum fokussierbaren Untertyp und besitzt
   eine explizite Reparaturaktion.
6. Domain-, Schema-, Routing-, Lifecycle-, Session-, Dashboard- und RTL-Tests
   decken insbesondere Windbaum ohne Richtungsset, Pilz-Gating, Vererbung,
   Detach, Basis-/Untertypwechsel, kompakte Summary, Autosave, Resume und alte
   V2-Naturdaten ab.

## Übergabe an Prompt 18

- Ergänze ausschließlich den Static-Object-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Funktion, Material, Footprint, Zustand,
  Varianten, Interaktion und optionale Animation für Möbel, Brunnen, Kisten,
  Fässer, Säulen und sonstige statische Weltobjekte.
- Statische Weltobjekte erhalten keine Richtungswahl ohne `directional`-
  Capability. Eine vorhandene Animation wie Öffnen, Leuchten oder Zerbrechen
  bleibt ein davon unabhängiger Capability-Schritt.
- Erweitere den bestehenden strikten `StaticObjectAnswers`-Vertrag additiv
  und halte alte Schema-V2-Daten ohne eager Defaults lesbar. Technische Werte
  bleiben ausschließlich in der Base→Category→Asset-Profilkette.
- Führe alle neuen Werte wieder durch minimale Vererbung, Explicit Clear,
  Basis-/Klassifikationswechsel, Rohsnapshot, Autosave, schreibfreies Resume,
  kompakte Summary und Dashboard.
- Gebäudeeditor, Tilesets, Items, Artwork, Prompt Engine, Review und Output
  bleiben späteren, separat zu committenden Phasen vorbehalten.

## Ergebnis Prompt 18

1. Eine öffentliche frameworkfreie Static-Object-Domain definiert stabile
   Kataloge und das vollständige Untertyp→Objektklassen-Mapping. Das strikte
   additive Schema hält alte V2-Daten ohne schreibende Defaults lesbar.
2. `StaticWorldObjectEditor` erfasst im eigenen `staticObjectDetails`-Schritt
   Funktion, Form, Materialien, Zustand, Interaktion, Footprint, Schatten und
   Varianten; Objektklasse und zentrale Tilegröße bleiben read-only.
3. Animation und Richtung bleiben getrennt. Capability-gültige Öffnen-,
   Leuchten-, Zerbrechen- und benutzerdefinierte Animationen erzeugen kein
   Richtungsset.
4. Vererbung, minimale Projektion, Explicit Clear, Basis-/Klassifikationswechsel,
   Rohsnapshot, Autosave, schreibfreies Resume, Summary und Dashboard umfassen
   sämtliche Static-Object-Fachwerte.

## Übergabe an Prompt 19

- Ergänze ausschließlich den Building-/Architecture-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Nutzung, Footprint und Höhe, Stockwerke,
  Materialien, Dach, Fassade, Türen, Fenster, Zustand, Belegung,
  Mapping-Kompatibilität und Licht.
- Gebäude übernehmen Tilegröße, Perspektive, Kamera und Projektion aus der
  Base→Category→Asset-Kette. Figurenhöhe und Richtungsset bleiben vollständig
  ausgeschlossen; eine Toranimation ist eine separate Capability.
- Führe alle Building-Werte durch striktes additives Schema, minimale
  Vererbung, Explicit Clear, Basis-/Klassifikationswechsel, Rohsnapshot,
  Autosave, schreibfreies Resume, kompakte Summary und Dashboard.
- Tilesets, Items, Artwork, Prompt Engine, Review und Output bleiben späteren,
  separat zu committenden Phasen vorbehalten.

## Ergebnis Prompt 19

1. Eine öffentliche frameworkfreie Building-Domain definiert readonly
   Kataloge und ein vollständiges Untertyp→Gebäudetyp-Mapping für Bauform,
   Größe, Material, Dach, Fassade, Öffnungen, Zustand, Belegung, Mapping,
   Kollision, Licht und Toranimation.
2. Das strikt additive `BuildingAnswersSchema` hält frühere V2-Felder ohne
   eager Defaults lesbar, prüft Typ-/Untertyp-Konsistenz, Wertebereiche und
   modulare Capability-Grenzen und schließt technische sowie Richtungsfelder
   aus.
3. `BuildingArchitectureEditor` erfasst alle Fachwerte im eigenen
   `buildingDetails`-Schritt. Gebäudetyp, Tilegröße und Weltgeometrie bleiben
   read-only; modulare Optionen sind untertypabhängig, Toranimation und
   Richtung bleiben getrennt.
4. Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit Clear,
   Basis-/Klassifikationswechsel, transienter Rohzustand, Autosave und
   schreibfreies Resume umfassen sämtliche Building-Felder.
5. Live-Zusammenfassung und Dashboard zeigen kompakte tatsächliche Gebäude-,
   Footprint-, Material-, Dach-, Fassaden-, Öffnungs-, Mapping-, Belegungs-
   und Lichtfakten ohne Figurenhöhe oder Richtungsset.

## Übergabe an Prompt 20

- Ergänze ausschließlich den Tileset-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Tiletyp, Kanten, Innen-/Außenecken, Übergänge,
  Nachbarschaften, Seam-Regeln, Varianten und Atlaslayout.
- Nutze die bestehende zentrale Tilegröße und Capability-Auflösung; führe
  keine Building-Felder oder vorgezogene Prompt-Engine-/Output-Logik fort.
- Alle neuen Felder müssen wieder durch strikte Schemas, Vererbung,
  Rohsnapshot, Autosave, schreibfreies Resume, Summary und Dashboard laufen.

## Ergebnis Prompt 20

1. Eine öffentliche frameworkfreie Tileset-Domain definiert readonly Kataloge,
   das vollständige Untertyp→Tiletyp-Mapping und pure Relevanzregeln für
   Kanten, Innen-/Außenecken und Übergänge.
2. `resolveTilesetAtlasMetrics()` und
   `createTilesetTechnicalSpecification()` berechnen Raster, Kapazität,
   Leerplätze und exakte Canvasmaße deterministisch aus zentraler Tilegröße,
   Slotzahl, Layout, Zwischenraum und Rand.
3. Das strikt additive `TilesetAnswersSchema` hält frühere V2-Felder ohne eager
   Defaults lesbar, prüft Typ-/Untertyp- sowie Layoutkonsistenz und schließt
   technische, Figuren- und Richtungswerte aus.
4. `TilesetEditor` erfasst Gridkontext, Kanten, Ecken, Übergänge, Seam-Regeln,
   Wiederholung, Varianten und Atlaslayout im eigenen `tilesetDetails`-Schritt.
   Animierte Tiles nutzen weiterhin einen getrennten Capability-Schritt; kein
   Tileset erhält Richtungsansichten.
5. Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit Clear,
   Basis-/Klassifikationswechsel, Rohzustand, Autosave und schreibfreies Resume
   umfassen alle Tileset-Felder. Alte Tileset-Drafts auf `tileability` werden
   in-memory auf den Fachschritt umgeleitet.
6. Live-Zusammenfassung und Dashboard zeigen kompakte tatsächliche
   Verbindungs-, Seam-, Varianten- und berechnete Atlasfakten. Domain-, Schema-,
   Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und RTL-Tests decken
   den vollständigen Autotile-Roundtrip ab.

## Ergebnis Prompt 21

1. `domain/items` stellt stabile readonly Kataloge, das vollständige
   Untertyp→Itemklassen-Mapping und einen puren Wearable-Guard bereit.
2. `ItemAnswersSchema` ist strikt und additiv um Klasse, Material, Zustand,
   Funktion, Bedeutung, Größe, Silhouette, Lesbarkeit, Glow, Schatten und
   Varianten erweitert. Frühere V2-Items bleiben ohne eager Defaults lesbar.
3. `ItemEquipmentEditor` ist als eigener `itemDetails`-Schritt integriert. Er
   zeigt Itemklasse, Hintergrund und Produktionsmaßstab read-only und erfasst
   nur RHF-gesteuerte Item-Fachwerte; nicht tragbare Untertypen erhalten keine
   ausgerüstete Darstellung oder Trageposition.
4. Base→Category→Asset-Hydration, minimale lokale Projektion, Explicit Clear,
   Klassifikationsbereinigung, Rohsnapshot, Autosave und schreibfreies Resume
   umfassen sämtliche Item-Felder.
5. Live-Zusammenfassung und Dashboard zeigen kompakte tatsächliche
   Itemklassen-, Material-, Zustands-, Funktions-, Bedeutungs-, Größen-,
   Lesbarkeits-, Schatten- und Variantenfakten sowie bekannte Materialbadges.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests sichern den Roundtrip ab. Kein Item-Untertyp erhält Richtungs- oder
   Animationsfragen.

## Übergabe an Prompt 22

- Ergänze ausschließlich den Artwork-/Konzeptbild-Editor aus
  `docs/erledigt/CODEX-V2-PROMPTS.md`: Zweck, Motiv, Komposition, Format, Hintergrund,
  Fokus, Stimmung und freie Produktionsbeschreibung.
- Nutze `freeComposition` als zentrale Grenze; erzwinge für Artwork weder
  Tilegröße, Figurenhöhe, Sprite-Richtung noch Animation.
- Führe neue Artwork-Felder erneut durch strikte additive Schemas, minimale
  Projektion, Explicit Clear, Rohsnapshot, Autosave, schreibfreies Resume,
  Summary und Dashboard.
- Prompt Engine, Review und Output bleiben späteren, separat zu committenden
  Phasen vorbehalten.

## Ergebnis Prompt 22

1. `domain/artworks` stellt stabile readonly Kataloge und das vollständige
   Untertyp→Artworktyp-Mapping bereit. Der Typ wird aus dem Untertyp abgeleitet
   und nicht redundant in Artwork-Antworten gespeichert.
2. `ArtworkAnswersSchema` ist strikt und additiv um Motiv, Szene,
   Kompositionsdetails, Lichtdramaturgie, Lichtdetails und Detailgrad
   erweitert. Frühere V2-Artworks bleiben ohne eager Defaults lesbar;
   Tile-, Kamera-, Figuren-, Sprite-, Animations- und Richtungswerte sind keine
   Artwork-Fachantworten.
3. `ArtworkConceptEditor` ist als eigener `artworkDetails`-Schritt direkt nach
   der Basisprofilwahl integriert. Er erfasst Zweck, Motiv, Szene,
   Komposition, Format, Hintergrund, Fokus, Licht und Detailgrad in React Hook
   Form und zeigt ausschließlich allgemeine geerbte Art Direction read-only.
4. Base→Category→Asset-Hydration, minimale lokale Projektion, Explicit Clear,
   Klassifikationsbereinigung, Rohsnapshot, Autosave und schreibfreies Resume
   umfassen sämtliche Artwork-Felder. Der Wizard speichert für
   `freeComposition` keine Weltgeometrie-Overrides neu; der Compatibility Key
   ignoriert diese Dimensionen ebenfalls.
5. Live-Zusammenfassung und Dashboard zeigen kompakte tatsächliche
   Artworktyp-, Zweck-, Motiv-, Szenen-, Kompositions-, Format-, Hintergrund-,
   Fokus-, Licht- und Detailfakten ohne Tile-, Kamera-, Richtungs- oder
   Animationsregeln.
6. Domain-, Schema-, Resolver-, Routing-, Lifecycle-, Session-, Dashboard- und
   RTL-Tests sichern den vollständigen Artwork-Roundtrip und die Lesbarkeit
   alter Schema-V2-Daten ab.

## Übergabe an Prompt 25

- Nutze die strukturierten Resolver-Konflikte und den vorhandenen
  Review-Zustand; erzeuge aus einem Konflikt weiterhin niemals einen
  Teilprompt.
- Biete ausschließlich die vier vorgesehenen kontrollierten Optionen:
  abbrechen, BaseProfile duplizieren, neues BaseProfile anlegen oder ein
  kompatibles Profil wählen.
- Ändere keine gesperrten Basiswerte still und führe kein implizites
  Reparenting von Geschwister- oder Kindprofilen durch. Compatibility-Key-
  Änderungen müssen deterministisch und vor dem Commit sichtbar sein.
- Die querschnittliche Accessibility-Politur wurde mit Prompt 26
  abgeschlossen; Release-Cleanup und Legacy-Entfernung wurden anschließend
  evidenzgebunden in Prompt 27 abgeschlossen.

## Historisch erfasster Legacy-Ist-Stand (Prompt 00)

- Reproduzierbare Detailaufnahme: `docs/LEGACY-V1-BASELINE.md`
- V1 besitzt acht Formularabschnitte mit 51 flachen State-Feldern.
- Zwei localStorage-Namespaces, zwei mitgelieferte Import-Presets und vier
  Promptausgaben sind als Migrationsverträge erfasst.
- Synthetische Autosave-/Preset-Fixtures und Signaturen der Standardprompts
  liegen seit der Release-Abnahme unter `src/test/fixtures/legacy-v1/`.
- Abweichung vom Zielmodell: V1 koppelt Richtungsmodi noch nicht an
  Capabilities und führt irrelevante flache Werte weiter. Diese Daten werden in
  V2 migriert, das Verhalten aber bewusst nicht fortgeschrieben.
- Die ausführbare V1 nutzte Node.js `>=18`, Vanilla JavaScript und den
  eingebauten Node-Testläufer. Sie diente bis einschließlich Prompt 27 als
  Paritätsreferenz und wurde danach entfernt; der Stand bleibt in der
  Git-Historie erhalten. Das aktive Root-Projekt nutzt ausschließlich den
  verbindlichen V2-Stack.

## Verbindliche Quellen

- `AGENTS.md`
- `docs/TECHNOLOGIE-STACK-V2.md`
- `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md`
- `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
- `docs/erledigt/CODEX-V2-PROMPTS.md`

## Meilensteine

| Nr. | Meilenstein | Ergebnis | Status |
|---:|---|---|---|
| 0 | Baseline + Migrationsinventar | V1-Verhalten, Storage-Keys und Promptregeln dokumentiert | abgeschlossen |
| 1 | React/TS/Vite-Grundgerüst | Vite React-TS, npm, strict TS, Testsetup | abgeschlossen |
| 2 | Legacy-Domain extrahieren | Defaults, Prompt-, Validierungs- und Metriklogik als frameworkfreies TypeScript | abgeschlossen |
| 3 | Kategorien + Capabilities | neun Assetarten und getrennte Richtungs-/Animationslogik | abgeschlossen |
| 4 | Zod-Schemas + V2-Domainmodell | Profile und Importverträge typisiert | abgeschlossen |
| 5 | Profilauflösung + Locks | Vererbung und Compatibility Key | abgeschlossen |
| 6 | Storage V2 + V1-Migration | validierte Persistenz mit Backup | abgeschlossen |
| 7 | Design Tokens + Theme | Light/Dark/System und Brand-Konfiguration | abgeschlossen |
| 8 | App Shell + Navigation | React-App-Struktur und Views | abgeschlossen |
| 9 | Dashboard | Kategorie- und Profilkarten | abgeschlossen |
| 10 | Profilbibliothek | Suche, Filter, Gruppierung, Favoriten | abgeschlossen |
| 11 | Wizard Engine | Schritte, Navigation, Resume, RHF/Zod | abgeschlossen |
| 12 | Kategorie-Routing | Capability-gesteuerte Fragen | abgeschlossen |
| 13 | Basisprofil-Editor | globale Parameter, Locks, Konflikte | abgeschlossen |
| 14 | Charakter-/NPC-Editor | vollständige Figurenfragen + Bewegung | abgeschlossen |
| 15 | Bewegliches-Objekt-Editor | Richtung/Animation nach Capability | abgeschlossen |
| 16 | Textur-/Materialeditor | Material, Seamless, Oberfläche | abgeschlossen |
| 17 | Natur-/Baumeditor | Klima, Saison, Krone, Stamm etc. | abgeschlossen |
| 18 | Statische Objekte | Objektparameter ohne unnötige Bewegung | abgeschlossen |
| 19 | Gebäudeeditor | Architektur und Mappingparameter | abgeschlossen |
| 20 | Tileset-Editor | Tile-/Transition-/Seam-Regeln | abgeschlossen |
| 21 | Item-/Ausrüstungseditor | Spielasset-spezifische Darstellung | abgeschlossen |
| 22 | Artwork-Editor | freie Komposition ohne erzwungene Tilelogik | abgeschlossen |
| 23 | Prompt Engine 2.0 | modulare TS-Promptbausteine | abgeschlossen |
| 24 | Review + Output Workspace | vier Ausgaben, Kopieren, Export | abgeschlossen |
| 25 | Profilkonvertierung | technische Konflikte sichtbar lösen | abgeschlossen |
| 26 | Accessibility + Responsive | Tastatur, Kontrast, mobile Layouts | abgeschlossen |
| 27 | Release-Abnahme | Migration, Tests, Build, Dokumentation und belegte Legacy-Entfernung | abgeschlossen |
| 28 | Optional PWA | erst nach V2-Release | später |
| 29 | Optional Tauri 2 | erst nach stabiler Web-V2 | später |

## Definition of Done pro Phase

- ein klar abgegrenztes Ergebnis
- TypeScript `strict` ohne Fehler
- neue pure Logik mit Vitest getestet
- relevantes React-Verhalten mit Testing Library getestet
- `npm run verify` erfolgreich
- `git diff --check` erfolgreich
- keine manuelle Änderung in `dist/`
- kein neues Vanilla-DOM-V2-System
- Dokumentation und ggf. Migrationshinweise aktualisiert

## Entscheidete Architekturpunkte

1. **TypeScript + React + Vite** ist verbindlich.
2. React Hook Form steuert komplexe Formulare.
3. Zod validiert Form-, Import- und Persistenzdaten.
4. Context + Reducer reicht als globaler V2-State zum Start.
5. CSS Modules + semantische CSS Custom Properties bilden das Designsystem.
6. Eigene SVG-React-Komponenten bilden die Iconbibliothek.
7. Vitest + React Testing Library bilden das Testfundament.
8. V2 bleibt ohne Backend.

## Optionale Folgeentscheidungen

- genaue Sheet-Layoutoptionen für mehrere Aktionen
- Rückkehrhistorie beim Kategorienwechsel
- Umfang einer grafischen Frame-/Canvas-Vorschau

## Hauptrisiken

| Risiko | Gegenmaßnahme |
|---|---|
| Big-Bang-Rewrite verliert V1-Regeln | Legacy zuerst inventarisieren, dann Domain schrittweise portieren |
| React-Komponenten enthalten Geschäftslogik | pure Domain-Module + Hooks als Adapter |
| Context wird zu groß | getrennte Contexts/Reducer nach Verantwortlichkeit, erst bei Bedarf weiter skalieren |
| Profilimporte sind unsicher | `unknown` → Zod → Migration → Domain |
| technische Profile laufen auseinander | Locks + Compatibility Key + Konfliktworkflow |
| 8 Richtungen erscheinen bei falschen Assets | zentrales Capability-System |
| Wizard wird monolithisch | deklarative Step-Konfiguration + Feature-Editoren |
| Theme driftet | semantische Tokens + CSS Modules |
