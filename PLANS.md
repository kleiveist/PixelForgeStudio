# PixelForge Prompt Studio V2 — React/TypeScript-Ausführungsplan

## Status

- **Legacy:** V1 als Vanilla HTML/CSS/JavaScript unter `legacy/v1/` eingefroren
- **Ziel:** V2 als TypeScript + React + Vite; Grundgerüst aktiv
- **Abgeschlossene Aufgabe:** Prompt 13 — Basisprofil-Editor
- **Nächste Aufgabe:** Prompt 14 — Character/NPC Editor
- **Arbeitsregel:** genau eine Phase umsetzen → testen → prüfen → committen

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

## Erfasster Legacy-Ist-Stand

- Reproduzierbare Detailaufnahme: `docs/LEGACY-V1-BASELINE.md`
- V1 besitzt acht Formularabschnitte mit 51 flachen State-Feldern.
- Zwei localStorage-Namespaces, zwei mitgelieferte Import-Presets und vier
  Promptausgaben sind als Migrationsverträge erfasst.
- Synthetische Autosave-/Preset-Fixtures und Signaturen der Standardprompts
  liegen unter `legacy/v1/tests/fixtures/v1/`.
- Abweichung vom Zielmodell: V1 koppelt Richtungsmodi noch nicht an
  Capabilities und führt irrelevante flache Werte weiter. Diese Daten werden in
  V2 migriert, das Verhalten aber bewusst nicht fortgeschrieben.
- V1 nutzt weiterhin Node.js `>=18`, Vanilla JavaScript und den eingebauten
  Node-Testläufer, ist aber vollständig unter `legacy/v1/` isoliert. Das aktive
  Root-Projekt nutzt den verbindlichen V2-Stack.

## Verbindliche Quellen

- `AGENTS.md`
- `docs/TECHNOLOGIE-STACK-V2.md`
- `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md`
- `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
- `docs/CODEX-V2-PROMPTS.md`

## Meilensteine

| Nr. | Meilenstein | Ergebnis | Status |
|---:|---|---|---|
| 0 | Baseline + Migrationsinventar | V1-Verhalten, Storage-Keys und Promptregeln dokumentiert | abgeschlossen |
| 1 | React/TS/Vite-Grundgerüst | Vite React-TS, npm, strict TS, Testsetup | abgeschlossen |
| 2 | Legacy-Domain extrahieren | Defaults, Prompt-, Validierungs- und Metriklogik als frameworkfreies TypeScript | abgeschlossen |
| 3 | Zod-Schemas + V2-Domainmodell | Kategorien, Profile, Capabilities und Importverträge typisiert | abgeschlossen |
| 4 | Profilauflösung + Locks | Vererbung und Compatibility Key | abgeschlossen |
| 5 | Storage V2 + V1-Migration | validierte Persistenz mit Backup | abgeschlossen |
| 6 | Design Tokens + Theme | Light/Dark/System und Brand-Konfiguration | abgeschlossen |
| 7 | App Shell + Navigation | React-App-Struktur und Views | abgeschlossen |
| 8 | Dashboard | Kategorie- und Profilkarten | abgeschlossen |
| 9 | Profilbibliothek | Suche, Filter, Gruppierung, Favoriten | abgeschlossen |
| 10 | Wizard Engine | Schritte, Navigation, Resume, RHF/Zod | abgeschlossen |
| 11 | Kategorie-Routing | Capability-gesteuerte Fragen | abgeschlossen |
| 12 | Basisprofil-Editor | globale Parameter, Locks, Konflikte | abgeschlossen |
| 13 | Charakter-/NPC-Editor | vollständige Figurenfragen + Bewegung | offen |
| 14 | Bewegliches-Objekt-Editor | Richtung/Animation nach Capability | offen |
| 15 | Textur-/Materialeditor | Material, Seamless, Oberfläche | offen |
| 16 | Natur-/Baumeditor | Klima, Saison, Krone, Stamm etc. | offen |
| 17 | Statische Objekte | Objektparameter ohne unnötige Bewegung | offen |
| 18 | Gebäudeeditor | Architektur und Mappingparameter | offen |
| 19 | Tileset-Editor | Tile-/Transition-/Seam-Regeln | offen |
| 20 | Item-/Ausrüstungseditor | Spielasset-spezifische Darstellung | offen |
| 21 | Artwork-Editor | freie Komposition ohne erzwungene Tilelogik | offen |
| 22 | Prompt Engine 2.0 | modulare TS-Promptbausteine | offen |
| 23 | Review + Output Workspace | vier Ausgaben, Kopieren, Export | offen |
| 24 | Profilkonvertierung | technische Konflikte sichtbar lösen | offen |
| 25 | Accessibility + Responsive | Tastatur, Kontrast, mobile Layouts | offen |
| 26 | Release-Abnahme | Migration, Tests, Build, Dokumentation | offen |
| 27 | Optional PWA | erst nach V2-Release | später |
| 28 | Optional Tauri 2 | erst nach stabiler Web-V2 | später |

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

## Noch lokal zu entscheiden

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
