# PixelForge Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Prompt 37 — PNG-Part-Import und Normalisierung (abgeschlossen)
- **Nächste Aufgabe:** Prompt 38 — Humanoid-80-Rig-Vorlage (nicht begonnen)
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Aktive Serie:** Phase A mit Prompts 28–31 abgeschlossen; Phase B mit
  Prompts 32–35 und Phase C mit Prompts 36–37 abgeschlossen sowie Prompts
  38–51 offen unter
  `docs/aufgaben/pixelforge-studio-v3/prompts/`
- **Arbeitsregel:** genau eine beauftragte Phase umsetzen, prüfen und getrennt committen

## Prompt 37 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `e24bd94`
- Baseline: Prompt 36 abgeschlossen mit 135 Testdateien und 842 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: ausschließlich decodierbare PNG-Dateien bis 16 MiB und
  2048 × 2048 px; mindestens ein sichtbares Pixel; deterministische pure
  Alpha-Bounds und RGBA-Crops bei Standardschwelle 1
- Architektur: injizierter frameworkfreier `ImageDecoder`-Port, Browseradapter
  mit `createImageBitmap` und kontrolliertem Fallback, kurzlebige und sicher
  widerrufene Object URLs nur in Hook/Service sowie unverändertes Originalblob
- Persistenz: PartAsset-Metadaten mit explizitem `anchorsPending`, Originalmaß
  und Trim in Originalkoordinaten atomar mit dem Blob schreiben; aktive
  Projektzuweisung erst nach erfolgreichem Repository-Write aktualisieren
- Oberfläche: additive Datei- und Dropzone-Bedienung, Slot und Richtung,
  Vorschau, Dateiname, Maße, Trim, Warnungen, Bestätigen/Abbrechen sowie eine
  erste Richtungs-/Slot-Coverage ohne erfundene Anker oder automatische
  Platzierung
- Fehlergrenze: ungültige/zu große/transparente Dateien, Decoder- und
  Repositoryfehler lassen die bestehende Projektzuweisung unverändert;
  ersetzte Parts werden nicht gelöscht und bleiben der Garbage Collection
  vorbehalten
- Dokumentation: öffentliche Modulgrenzen, Nutzerhilfe, Changelog,
  V3-Implementierungsstand und Übergabe auf Prompt 38 aktualisieren

## Prompt 37 — Ergebnis

1. Der injizierbare `ImageDecoder`-Port und sein Browseradapter trennen
   Decodierung von Domain und React. Der Adapter bevorzugt
   `createImageBitmap`, verwendet einen kontrollierten Image-Fallback und
   widerruft dessen Object URL in jedem Ausgang; Dimensionen werden vor einer
   unbeschränkten Canvas-/RGBA-Allokation begrenzt.
2. `prepareAnimationPartImport()` behandelt Dateien als `unknown` und prüft
   MIME-Typ, PNG-Signatur, positive Größe, 16-MiB-Grenze, Decodierbarkeit,
   2048-×-2048-Grenze, RGBA-Länge und sichtbaren Alpha-Inhalt. JPG,
   umbenannte oder beschädigte Nicht-PNGs, transparente und übergroße Quellen
   enden vor jedem Write mit konkretem Fehler.
3. Pure Domainfunktionen bestimmen bei Standardschwelle 1 deterministisch die
   Alpha-Bounds, erzeugen einen kopierten RGBA-Crop und erkennen vollständig
   opake Außenrandpixel. Das Originalblob bleibt unverändert; Trimwerte bleiben
   Originalkoordinaten.
4. PartAssets unterstützen additiv `anchorStatus`. Bestehende V1-Daten ohne
   Feld normalisieren zu `ready`; neue Imports erhalten
   `anchorsPending` ohne erfundene `anchors`. Die Produktionsvalidierung führt
   diesen Status als eigenen Blocker.
5. Dateiinput und additive Dropzone, Zielslot/-richtung, lokale Vorschau,
   Dateiname, Originalmaß, Trim, Warnungen, Bestätigung und Abbruch sind im
   Teileinventar produktiv. Der Inspector zeigt persistierte Partdaten; die
   Coverage-Matrix unterscheidet Quelle, fehlende Pflichtquelle, optionalen
   Slot und offene Anker je tatsächlich authorender Richtung.
6. `writePartAssetToProject()` validiert und schreibt neues PartAsset,
   Originalblob und aktualisierte Projektzuweisung gemeinsam in Memory- oder
   IndexedDB-Transaktion. IDs und Zeitstempel stammen aus injizierten
   Factories; ein Ersatz löst nur die alte Projektzuweisung und löscht weder
   Alt-Part noch Alt-Blob.
7. Repository-/Providerfehler lassen den bisherigen Projektstand und alle drei
   Stores unverändert. Der Provider übernimmt erst das erfolgreich persistierte
   Ergebnis als sauberen Aktivstand; Vorschau-URLs werden bei Ersatz, Abbruch,
   Unmount und damit Projektwechsel widerrufen.
8. `npm run verify` bestand mit 141 Testdateien und 866 Tests sowie
   erfolgreichem Strict-Typecheck und Produktionsbuild. Einzige Ausgabe bleibt
   die bekannte Vite-Warnung zum über 500 kB großen Hauptchunk. PyGitIndex
   2.1.0 meldet alle 65 Markdown-Dateien aktuell; der Root-/Dokuindex enthält
   keine doppelten Linkziele. Prompt 38 wurde nicht begonnen und bleibt die
   nächste getrennte Aufgabe.

## Prompt 36 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `28ae7c6`
- Baseline: Prompt 35 abgeschlossen mit 132 Testdateien und 825 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: produktive, responsive Workspace-Shell für das geladene aktive
  Animationsprojekt mit Toolbar, domänenbasiertem Teileinventar, DOM-basiertem
  128-×-128-Viewport, kontextuellem Inspektor und Walk-Timeline
- Bedienung: temporäre Auswahl für Richtung, Clip, Frame, Slot, Zoom, Overlays
  und aktive Paneele; vollständige Tastatur- und DOM-Alternativen sowie
  fokuserhaltende Mittel-/Kleinbreiten-Navigation
- Zustände: getrennte Loading-, Fehler-, No-Project- und Missing-Blob-
  Darstellungen; Speicherstatus bleibt Eigentum des Projekt-Providers
- Grenze: kein PNG-Import, keine persistierten Beispieldaten, kein Canvas-
  Renderer, kein Playback, keine Exportpipeline und kein Prompt 37

## Prompt 36 — Ergebnis

1. Die geladene Projekt-ID führt jetzt in eine vollständige produktive
   Workspace-Shell mit Projekt-/Clip-Toolbar, domänenbasiertem
   39-Slot-Inventar, zentralem DOM-Viewport, kontextuellem Inspektor und
   acht Walk-Frameplätzen samt FPS-Anzeige.
2. Ein purer lokaler Reducer besitzt ausschließlich Richtung, Clip, Frame,
   Slot, Inspektorkontext, die sechs ganzzahligen Zoomstufen, fünf Overlays,
   Pan und responsive Paneelauswahl. Projekt- und Save-Metadaten bleiben im
   `AnimationProjectProvider`; kein Workspace-Unterbaustein liest das
   Repository oder persistiert temporäre Auswahl.
3. Desktop zeigt alle vier Arbeitsbereiche, mittlere Breiten schalten das
   Seitenpaneel zwischen Teileinventar und Inspektor um, kleine Breiten bieten
   die progressive Reihenfolge Teile → Viewport → Eigenschaften → Timeline.
   Paneelwechsel übertragen Fokus; Tabs, Slots und Frames sind vollständig per
   Tastatur auswählbar.
4. Zoom, Panning und alle Overlay-Schalter besitzen Button-/Checkbox- und
   Textalternativen. No-Project, Loading, Not-Found, Repositoryfehler, leere
   Projekte und nicht aufgelöste Asset-/Blob-Referenzen sind getrennt sichtbar.
   Import, Play/Pause und Export bleiben mit sichtbarer Begründung deaktiviert.
5. 17 neue Reducer-, Katalog-, Workspace-, Responsive-, Fokus-, Tastatur-,
   Lifecycle- und Fehlerfalltests ergänzen die Abdeckung. `npm run verify`
   bestand mit 135 Testdateien und 842 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk.
6. `git diff --check` ist sauber. PyGitIndex 2.1.0 bestätigt alle 64
   Markdown-Dateien als aktuell. Prompt 37 wurde nicht begonnen und bleibt die
   nächste getrennte Aufgabe.

## Prompt 35 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `d245f7b`
- Baseline: Prompt 34 abgeschlossen mit 126 Testdateien und 799 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: pure Projektlisten-/Aktivprojekt-/Load-/Save-/Revision-/Rohfehler-
  State-Machine; `AnimationProjectProvider` mit injiziertem Repository, Uhr
  und ID-Factory; schreibfreie Hydration; debounced Autosave und expliziter
  beziehungsweise projektwechselbedingter Flush
- Oberfläche: vollständige Projektübersicht mit validierter Standardanlage,
  Suche/Sortierung, Öffnen samt stabiler Workspace-Route, Umbenennen,
  Duplizieren und bestätigtem Löschen; verständlicher Unknown-ID-State;
  echte letzte Animationsprojekte auf Studio Home
- Grenze: keine PNGs oder Blobs im Provider, kein Canvas/Rig-Editor, keine
  Character-Kit-Fachfunktion, keine Undo/Redo-History und kein Prompt 36

## Prompt 35 — Ergebnis

1. Eine pure Projekt-State-Machine verwaltet sortierte Summaries, das aktive
   validierte Projekt, Load-/Save-Status, Dirty- und Persistenzrevisionen sowie
   abgewiesene Rohfehler getrennt vom letzten gültigen In-Memory-Modell.
2. Der injizierbare `AnimationProjectProvider` hydratisiert und öffnet
   schreibfrei, serialisiert Repository-Writes, autosaved valide Änderungen
   debounced und flusht vor explizitem Speichern oder bewusstem Projektwechsel.
   Write-Fehler behalten das gültige Modell und einen konkreten Fehlerstatus.
3. Die produktive Projektansicht unterstützt Zod-/RHF-validierte Anlage,
   Suche, vier Sortierungen, Öffnen, Umbenennen, Copy-on-write-Duplizieren und
   bestätigt Löschen. Der Startvertrag verwendet `humanoid-80-v1`, 128 × 128,
   Figurenhöhe 80, Fußanker 64/112, `fiveAuthoredPlusMirror` und Walk mit acht
   Frames bei 10 FPS.
4. Workspace-Routen tragen die stabile Projekt-ID. Ein fehlendes oder bereits
   gelöschtes Projekt bleibt als erklärter Error State ohne automatisches
   Umschreiben oder Ladeschleife sichtbar; Editor, Import, Kits und Rigs
   bleiben kontrollierte Platzhalter für spätere Prompts.
5. Studio Home liest maximal drei zuletzt bearbeitete Projekte über einen
   schmalen Summary-Port und öffnet sie ausschließlich nach Nutzeraktion.
   Dirty-Projekte aktivieren einen gezielten Browser-Unload- und internen
   Navigationsschutz; sauberer State installiert keine globale Unload-Warnung.
6. 26 zusätzliche beziehungsweise angepasste Lifecycle-, Provider-, Reducer-,
   Daten-, Home-, Dialog-, Fokus-, Tastatur-, Routing- und Fehlerfalltests
   decken die Prompt-35-Abnahme ab.
7. `npm run verify` bestand mit 132 Testdateien und 825 Tests sowie
   erfolgreichem Typecheck und Produktionsbuild. Einzige Ausgabe bleibt die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk;
   `git diff --check` ist sauber.
8. Prompt 36 wurde nicht begonnen und bleibt die nächste getrennte Aufgabe.

## Prompt 34 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `e32f47e`
- Baseline: Prompt 33 abgeschlossen mit 124 Testdateien und 782 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: öffentlicher asynchroner `AnimationRepository`-Port mit
  strukturierten Ergebnissen; austauschbare Memory- und native IndexedDB-
  Adapter; validierte Projekt-/Part-/Kit-Metadaten; atomare Part-/Blob-Writes;
  Copy-on-write-Projektduplikation; pure Referenzanalyse und explizite sichere
  Garbage Collection; schmale sortierte Projektzusammenfassungen
- Datenbankvertrag: `pixelforge-studio`, Version 1, getrennte Stores für
  Projekte, Part-Metadaten, Bildblobs, Character Kits und Previews sowie
  additive Upgrade-Schritte
- Grenze: keine React-UI oder Provider, kein globales Repository-Singleton,
  keine Base64-/JSON-Binärspeicherung, keine Änderung am Prompt-V2-
  localStorage und kein Prompt 35

## Prompt 34 — Ergebnis

1. Der öffentliche asynchrone `AnimationRepository`-Port unterscheidet valide
   Reads/Queries/Writes, Schemafehler, fehlende Datensätze, ID-Konflikte,
   fehlende beziehungsweise nicht öffnende IndexedDB und
   Transaktionsfehler. Projektzusammenfassungen bleiben ein schmales,
   deterministisch nach `updatedAt` und ID sortiertes Read-Model.
2. `MemoryAnimationRepository` und `IndexedDbAnimationRepository` decken
   Projekt-, PartAsset-, Bildblob-, Preview- und Character-Kit-Operationen
   über denselben Vertrag ab. Metadaten werden vor jedem Write mit den
   Prompt-33-Schemas validiert; Prompt-V2-localStorage und seine sechs Keys
   wurden nicht verändert.
3. Die native Datenbank `pixelforge-studio` Version 1 besitzt fünf getrennte
   Key-Path-Stores sowie Indizes für Projekt-/Kit-`updatedAt`, Part-Slot und
   Part-Richtung. Die Browserfactory liefert ohne oder bei nicht öffnender
   IndexedDB `unavailable`; keine globale Verbindung wird geteilt.
4. PartAsset und Bildblob werden in einer gemeinsamen Transaktion geschrieben.
   Ein absichtlich ausgelöster DataClone-/Transaktionsfehler belegt den
   Rollback auf die alten Metadaten und den alten Blob. Projektduplikate
   erhalten eine neue Projekt-ID und neue Zeitstempel, teilen aber
   unveränderliche Part-/Blob-/Previewreferenzen ohne Binärkopie.
5. Projekt-, Part- und Kit-Löschungen kaskadieren nicht. Eine pure
   Referenzanalyse steuert die einzige explizite Garbage Collection; sie
   entfernt nur nicht referenzierte Bild-/Previewdatensätze und bricht bei
   ungültigen gespeicherten Metadaten vor jeder Löschung ab.
6. Gezielte Prüfung: 2 neue Testdateien mit 17 Tests bestanden. Vollständige
   Prüfung: `npm run verify` bestand mit 126 Testdateien und 799 Tests sowie
   erfolgreichem Typecheck und Produktionsbuild; einzige Ausgabe bleibt die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk.
7. `git diff --check` ist sauber. Prompt 35 wurde nicht begonnen; Lifecycle-
   Provider und UI bleiben die nächste getrennte Aufgabe.

## Prompt 28 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `b708a3b`
- Ausgangs-Remote: `https://github.com/kleiveist/PixelartPromptStudio.git`
- GitHub CLI: als `kleiveist` angemeldet; Remote-Rename wird vor der lokalen
  URL-Änderung gegen GitHub geprüft
- Baseline: `npm run verify` erfolgreich mit 107 Testdateien und 614 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: Dachmarke und beide Modulnamen zentral typisiert; npm-Paket und
  sichtbare Produkttexte umbenannt; Prompt-Export-ID, Storage-Keys sowie
  Schema-/Formatversion 2 unverändert; Altbundle-Regression grün
- Grenze: keine Studio-Shell, keine neue Navigation und kein Prompt 29

## Prompt 28 — Ergebnis

1. Das private GitHub-Repository wurde mit bestätigtem `ADMIN`-Recht zu
   `kleiveist/PixelForgeStudio` umbenannt; `origin` verwendet weiterhin HTTPS
   und zeigt auf den neuen Namen.
2. npm-Paket, HTML-Metadaten, README und sichtbare Dachmarke verwenden
   `PixelForge Studio`; die Paketversion bleibt `2.0.0`.
3. `BRAND` veröffentlicht Dachprodukt sowie Prompt- und Animationsmodul zentral
   typisiert. Bestehende Prompt-Ausgaben verwenden weiterhin exakt
   `PixelForge Prompt Studio`; die Animations-ID ist nur reserviert.
4. Storage-Namespaces, Schema-/Formatversion 2, Promptdefaults und
   Profilauflösung wurden nicht verändert. Alte ExportBundles bleiben lesbar.
5. Gezielte Prüfung: 3 Testdateien und 37 Tests bestanden. Vollständige
   Prüfung: 108 Testdateien und 617 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. Prompt 29 wurde nicht begonnen. Die bestehende Prompt-Studio-App-Shell und
   Navigation bleiben funktional unverändert.

## Prompt 29 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `2dc6b20`
- Baseline: `npm run verify` erfolgreich mit 108 Testdateien und 617 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Bestehende URL: `?view=<PromptStudioView>` mit sechs stabilen Prompt-Views
- Abnahme: typisierte Dachrouten für Home, Prompt Studio und Animation Studio;
  strukturierter Parser, kanonischer Serializer, StableId-Projektparameter,
  Browser-History und Übergangsaliase für die bestehende Prompt-Oberfläche
- Grenze: keine sichtbare Studio-Shell, keine Animationsprojektlogik und kein
  Prompt 30

## Prompt 29 — URL-Matrix

| Form | Ergebnis |
|---|---|
| `?studio=home` | kanonische Home-Route |
| `?studio=prompt&view=<PromptStudioView>` | kanonische Prompt-Route |
| `?studio=animation&view=<AnimationStudioView>` | kanonische Animationsroute |
| `?studio=animation&view=workspace&project=<StableId>` | kanonischer Workspace mit Projekt |
| `?view=<PromptStudioView>` | gültige Bestandsroute; wird mit `replaceState` kanonisiert |
| ohne kontrollierte Routenparameter | injizierter Prompt-Fallback |
| unbekannte, unvollständige oder doppelte kontrollierte Parameter | strukturiert ungültig; injizierter Fallback |

## Prompt 29 — Ergebnis

1. `StudioId`, beide Modulkataloge und die diskriminierte `StudioRoute` sind
   readonly und öffentlich verfügbar; nur der Animation-Workspace darf eine
   validierte `StableId` als Projekt führen.
2. Der pure Parser unterscheidet kanonische, fehlende, gültige Legacy- und
   strukturiert ungültige Routen. Der Serializer ist roundtrip-stabil, erhält
   fremde Parameter und akzeptiert kontrollierte Dopplungen nicht still.
3. Browseradapter und Navigation-Provider führen vollständige Studio-Routen.
   Legacy-URLs und Fallbacks werden mit `replaceState` kanonisiert; explizite
   Navigation verwendet `pushState`, und `popstate` hält URL und Context synchron.
4. Die bestehende Prompt-Shell kompiliert über klar markierte Übergangsaliase
   weiter. Ihre sechs Views, Settings-V2-Verträge, Storage-Keys, Promptdaten und
   sichtbare Struktur wurden nicht verändert.
5. Gezielte Prüfung: 6 Testdateien und 76 Tests bestanden. Vollständige Prüfung:
   110 Testdateien und 658 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. PyGitIndex ist aktuell und alle 43 Paketchecksummen sind gültig. Prompt 30
   wurde nicht begonnen.

## Prompt 30 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `11d44a7`
- Baseline: `npm run verify` erfolgreich mit 110 Testdateien und 658 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: globale Dach-Shell mit Home-Brandlink, semantischem Modulumschalter,
  globalem Theme/Skip-Link und sichtbarem Modulkontext; unveränderte sechs
  Prompt-Views; vier zugängliche Animation-Placeholder-Views
- Grenze: keine Animationsdomain, kein IndexedDB/Canvas, keine produktive
  Home-Datenfläche und kein Prompt 31

## Prompt 30 — Ergebnis

1. `StudioShell` besitzt den einzigen globalen Header, Brandlink, Skip-Link,
   Theme-Umschalter, sichtbaren Modulkontext, Hauptbereich und Footer. Titel und
   Fokus folgen vollständigen Studio-Routen sowie neuen Wizard-Sessions.
2. `StudioSwitcher` ist eine echte Navigation aus zentralen Moduldefinitionen.
   Beide Ziele haben kanonische URLs; nur das aktive Modul trägt
   `aria-current="page"`.
3. Die bestehende Prompt-Oberfläche bleibt mit allen sechs Views und ihren
   Providern erhalten. Ein Modulwechsel verwirft weder Theme noch transienten
   Wizard-Zustand.
4. Animation Studio stellt Projekte, Workspace, Character Kits und
   Rig-Vorlagen als vier eindeutige, zugängliche Platzhalter bereit. Der
   Workspace ohne Projekt zeigt einen kontrollierten Empty State; Fachdomain,
   IndexedDB und Canvas bleiben bewusst ausstehend.
5. Alte `?view=`-URLs werden weiter ins Prompt Studio kanonisiert. Home,
   Prompt- und Animationsansichten erhalten routeabhängige Titel, genau eine H1
   und denselben fokussierbaren Hauptbereich.
6. Gezielte Prüfung: 7 Testdateien und 58 Tests bestanden. Vollständige
   Prüfung: 112 Testdateien und 669 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber. PyGitIndex meldet 63 unveränderte
   Markdown-Dateien, und alle 43 Paketchecksummen sind gültig.

## Prompt 31 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `f5510ce`
- Baseline: `npm run verify` erfolgreich mit 112 Testdateien und 669 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: additive AppSettings-V2-Defaults und pure Startziel-Helfer; drei
  getrennt persistierbare Startentscheidungen; produktive Studio-Home mit zwei
  gleichwertigen Modulkarten, vorhandenen Prompt-Zusammenfassungen und echtem
  Animation-Empty-State; Dashboard-Schnellaktionen und alte/neue Bundle-
  Kompatibilität
- Grenze: keine Schemaversion 3, keine Animationsdomain oder IndexedDB, keine
  automatische Projektöffnung und kein Prompt 32

## Prompt 31 — Ergebnis

1. `AppSettings` V2 besitzt additive Zod-Defaults für `startStudio: home` und
   `animationStartView: projects`; `startView` bleibt unverändert die Prompt-
   Startansicht. Alte strikte Settings und Export-Bundles werden ohne Write und
   ohne Schemaversionserhöhung normalisiert.
2. Pure Helfer lösen die Startdestination auf und ändern Dach-, Prompt- oder
   Animationsstart unabhängig. Der SettingsProvider bleibt die einzige
   UI-Mutationsgrenze; die drei Entscheidungen sind sichtbar persistierbar und
   melden nicht verfügbare beziehungsweise ungültige Writes explizit.
3. Die produktive Studio-Startseite bietet zwei gleichwertige Modulkarten,
   einen optional fortsetzbaren Prompt-Entwurf und letzte Prompt-Profile über
   bestehende Provider/Ports. Animation-Projekte bleiben bis Prompt 35 ein
   ehrlicher Empty State; Home schreibt keine Domainwerte.
4. Das Prompt-Dashboard behält den vollständigen Neun-Kategorien-Einstieg im
   Vordergrund und ergänzt darunter tastaturbedienbare Schnellaktionen zu Home
   und Animation.
5. Alte und neue Settings-/ExportBundle-Formen, jede Startdestination,
   Persistenzfehler, Home-Zusammenfassungen, Empty States, Tastatur und Fokus
   sind durch Domain-, Schema-, Transfer- und React-Tests abgedeckt.
6. Gezielte Prüfung: 8 Testdateien und 98 Tests bestanden. Vollständige
   Prüfung: 113 Testdateien und 684 Tests, Typecheck und Produktionsbuild
   bestanden; einzige Ausgabe ist die bekannte Vite-Warnung zum über 500 kB
   großen Hauptchunk. `git diff --check` ist sauber. PyGitIndex meldet 63
   unveränderte Markdown-Dateien, alle 43 Paketchecksummen sind gültig.
7. Phase A ist abgeschlossen. Prompt 32 ist als nächste Aufgabe dokumentiert,
   aber nicht begonnen; Animationsdomain, -schemas und IndexedDB bleiben offen.

## Nachtrag zu Prompt 31 — kompakte Home-Karten und Scrollstabilität

1. Routen- und Wizard-Fokus setzt weiterhin den semantischen Hauptbereich,
   verwendet dabei aber `preventScroll`. Brand-, Home-, Prompt- und
   Animationswechsel behalten dadurch die aktuelle Viewport-Position; der
   Skip-Link scrollt weiterhin bewusst zum Hauptinhalt.
2. Die beiden gleichwertigen Modulkarten besitzen eigene lokale, dekorative
   SVG-React-Illustrationen für Prompt-Erstellung beziehungsweise Rig/
   Timeline. Karte, Text und Aktionszeile begrenzen und umbrechen lange Inhalte
   innerhalb ihrer Fläche.
3. Letzter Prompt-Entwurf und Animation-Empty-State stehen als gleich breite,
   kompakte Aktivitätskarten nebeneinander. Letzte Prompt-Profile erhalten ein
   eigenes kompaktes Read-Model und zeigen nur Kategorie/Typ, Titel, Icon und
   gegebenenfalls den Favoritenstern; technische Fakten, Basisprofil,
   Materialien und Tags werden auf Home nicht mehr dargestellt.
4. Gezielte Prüfung: 2 Testdateien und 36 Tests bestanden. `npm run verify`
   bestand mit 113 Testdateien und 684 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. Die Shell-Regression trennt den zulässigen
   zeitgesteuerten Draft-Autosave von der exakt einmaligen Settings-Mutation.

## Prompt 32 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `bc25455`
- Baseline: `npm run verify` erfolgreich mit 113 Testdateien und 684 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: öffentliche, frameworkfreie `domain/animation` mit kanonischen
  Richtungen und SourceModes, vollständigem Production-Humanoid-Slotkatalog,
  stabiler Joint-/Bone-Topologie, readonly Grundtypen und Standardframe sowie
  getesteter Vektor-, Winkel- und affiner Matrixmathematik
- Grenze: keine Zod-Schemas, Persistenz, UI, Canvas, konkrete Gelenkpose,
  Renderingfunktion, Tier-/Fahrzeugrigs oder Arbeit an Prompt 33

## Prompt 32 — Ergebnis

1. `domain/animation/index.ts` veröffentlicht den stabilen Richtungskanon,
   alle drei SourceModes, Spiegel-/Gegenrichtungsauflösung und die je Modus
   exakt erforderlichen, unveränderlichen Quellrichtungen.
2. Der vollständige Production-Humanoid-Vertrag umfasst 15 Pflicht- und 24
   optionale Slots mit Domainlabels, zehn Gruppen und Required-Status. Alle 15
   Pflichtslots sind einmalig an eine gültige Parent-/Child-Joint-Kante
   gebunden; anatomische Seiten bleiben von visueller Spiegelung unabhängig.
3. 21 Joint- und 20 Bone-IDs bilden eine koordinatenfreie, deterministisch
   geordnete Topologie. Konkrete Neutralposen und Rigkoordinaten bleiben wie
   vorgesehen Prompt 38 vorbehalten.
4. Readonly Grundtypen, Mirror-/Rig-/Action-Kataloge und der unveränderliche
   `humanoid-80-v1`-Standard definieren 128 × 128 px, 80 px Figurenhöhe,
   Fußanker 64/112 und Contract-Version 1.
5. Pure Vektor-, Radiantwinkel- und affine Matrixfunktionen decken Addition,
   Subtraktion, Länge, Nullvektor, Clamp, Normalisierung, Identity,
   Komposition, Anwendung, Inversion und Roundtrip ab. Die Domain enthält
   keine React-, Zod-, DOM-, Canvas-, Storage- oder IndexedDB-Abhängigkeit.
6. Gezielte Prüfung: 5 Testdateien und 38 Tests bestanden. `npm run verify`
   bestand mit 118 Testdateien und 722 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. PyGitIndex meldet 63 unveränderte Markdown-
   Seiten, und alle 43 Paketchecksummen sind gültig.
7. Prompt 33 wurde nicht begonnen. Animationsschemas, Persistenz, konkrete
   Posen, Rendering und UI bleiben bewusst nachfolgenden Einzelprompts
   vorbehalten.

## Prompt 33 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `cbaac06`
- Baseline: `npm run verify` erfolgreich mit 118 Testdateien und 722 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: getrennte strikte Zod-V1-Schemas für Animationsprojekt, Part,
  Character Kit und Bundlegraph; aus Zod abgeleitete readonly Typen;
  Cross-Field-Prüfungen für Anker/Trim, eindeutige IDs, Walk-Frames,
  Overrides und Bundle-Referenzen; separate Draft-Produktionsvalidierung
- Grenze: keine Persistenz, IndexedDB, Blobs/Base64 im JSON, UI, Projekt-
  Provider, konkrete Rigdaten, Schemaänderung an Prompt-V2 oder Prompt 34

## Prompt 33 — Ergebnis

1. Projekt, PartAsset und Character Kit besitzen getrennte, strikte
   `schemaVersion: 1`-Schemas; das `.pfanim`-Manifest verwendet unabhängig
   `formatVersion: 1` und den stabilen Animation-Application-Identifier.
   Sämtliche öffentlichen Metadatentypen werden mit `z.infer` abgeleitet.
2. Gemeinsame Zod-Primitives validieren finite Pixelkoordinaten, positive
   Dimensionen, Frameprofile, Source-Anker, Trim-Rechtecke und alle stabilen
   Direction-/SourceMode-/Slot-/Joint-/Mirror-/Rig-/Action-Domainwerte ohne
   Zahlen-Coercion oder unbekannte Keys.
3. Projektrefinements sichern eindeutige PartAsset-/Clip-IDs, exakt acht
   Frames pro V1-Walk, eindeutige Frameziele und Overrides auf vorhandene
   Clips, kanonische Richtungen und gültige Frameindizes. Ein leerer Draft
   bleibt absichtlich schema-validierbar.
4. PartAssets halten ausschließlich Blob-Referenzen; Source-Anker und Trim
   müssen vollständig im ungetrimmten Original liegen. Der Bundlegraph löst
   Projekt→PartAsset→Blob sowie optionale Previewreferenzen vollständig auf
   und lehnt fehlende oder doppelte IDs ab.
5. `validateAnimationProjectProductionSources()` trennt Produktionsreife von
   Schema-Gültigkeit und meldet fehlende Pflichtquellen je SourceMode,
   unbekannte PartAsset-Referenzen und fehlende Distalanker. Kein Blob,
   Base64, IndexedDB-, Canvas-, Storage- oder UI-Verhalten wurde vorgezogen.
6. Gezielte Prüfung: 6 Testdateien und 60 Tests bestanden. `npm run verify`
   bestand mit 124 Testdateien und 782 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. PyGitIndex meldet 64 aktuelle Markdown-
   Seiten, und alle 43 Aufgabenpaket-Prüfsummen sind gültig.
7. Prompt 34 wurde nicht begonnen. Der IndexedDB-Port, Browser-/Memoryadapter,
   Transaktionen und Binärspeicherung bleiben vollständig der nächsten
   Einzelaufgabe vorbehalten.

## Plan — Dokumentationsordnung

1. Aktive Leitdokumente von abgeschlossenen V2- und V1-Unterlagen trennen.
2. Historische Markdown-Dateien ohne Inhaltsverlust nach `docs/erledigt/`
   verschieben.
3. Prüfen, ob ausführbarer V1-JavaScript-Code übrig ist; TypeScript-
   Kompatibilitätscode und Migrationsfixtures erhalten.
4. Die offene Serie 28–51 separat ausweisen, ohne Prompt 28 zu beginnen.
5. Alle verschobenen Verweise aktualisieren und die Navigation mit
   PyGitIndex 2.1.0 neu erzeugen.
6. Links, Paketchecksummen, `npm run verify` und `git diff --check` prüfen.

## Ergebnis — Dokumentationsordnung

1. `ASSISTANT-MASTER-PROMPT.md`, `CODEX-V2-UMSETZUNGSANWEISUNG.md` und
   `LEGACY-V1-BASELINE.md` wurden bytegleich nach `docs/erledigt/` verschoben.
2. Direkt unter `docs/` verbleiben nur die drei weiterhin aktiven
   Prompt-Studio-Verträge und die Dokumentationsübersicht.
3. Ausführbarer V1-JavaScript-Code ist im Arbeitsbaum nicht mehr vorhanden.
   Die aktive TypeScript-Kompatibilitätsdomain und ihre Migrationsfixtures
   bleiben erhalten.
4. Die Prompts 28–51 sind als offene Serie verlinkt; Prompt 28 wurde nicht
   begonnen. Alle 43 SHA-256-Prüfungen des Pakets sind erfolgreich.
5. PyGitIndex 2.1.0 ist aktuell. Alle 64 Markdown-Dateien besitzen gültige
   lokale Links; `npm run verify` bestand mit 107 Testdateien und 614 Tests.

## Nachtrag — einsatzbereite Aufgabenstruktur

1. Die vollständige offene Serie liegt unter
   `docs/aufgaben/pixelforge-studio-v3/`.
2. Verbindliche Planungsunterlagen liegen unter `grundlagen/`, ausführbare
   Einzelaufträge unter `prompts/` und Übergabevorlagen unter `templates/`.
3. Alle Pfade in den Einzelprompts zeigen vom Repository-Root auf diese
   Struktur; der Einstieg erfolgt über `START_HERE.md`.
4. PyGitIndex indexiert die Aufgabenserie direkt. Die Prüfung aller neun
   Indizes meldet 58 eindeutige Einträge und keine Dopplungen.

## Übergabe

- Prompt 32 ist der nächste Einzelauftrag und beginnt erst nach einem neuen
  konkreten Auftrag.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
