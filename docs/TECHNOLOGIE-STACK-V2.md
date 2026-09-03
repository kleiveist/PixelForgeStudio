<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — verbindlicher Technologie-Stack

## Status

Dieses Dokument ist für Version 2 **verbindlich**. Die vorhandene Vanilla-JavaScript-Anwendung im Repository ist ausschließlich Legacy-Bestand und Migrationsquelle. Neue V2-Oberflächen oder V2-Domänenfunktionen dürfen nicht mehr als Vanilla-DOM-Anwendung umgesetzt werden.

## Haupttechnologien

| Bereich | Technologie | Vorgabe |
|---|---|---|
| Sprache | TypeScript | verbindlich; `strict: true` |
| UI | React | verbindlich; funktionale Komponenten und Hooks |
| Entwicklung / Build | Vite | verbindlich |
| Paketverwaltung | npm | verbindlich |
| Formulare | React Hook Form | verbindlich für Wizard- und Editorformulare |
| Schema-/Datenvalidierung | Zod | verbindlich an Daten- und Importgrenzen |
| Globaler Zustand | React Context + `useReducer` | Startlösung; keine zusätzliche State-Bibliothek ohne nachgewiesenen Bedarf |
| Lokale Speicherung | `localStorage` + JSON-Import/-Export | verbindlich |
| Größere lokale Daten | IndexedDB | nicht in V2-Basis; nur spätere Erweiterung |
| Styling | CSS Modules + globale CSS Custom Properties | verbindlich |
| Icons | eigene lokale SVG-React-Komponenten | verbindlich |
| Unit-/Integrationstests | Vitest + React Testing Library | verbindlich |
| DOM-Testumgebung | jsdom | verbindlich für Komponententests |
| Backend | keines | V2 bleibt lokal / clientseitig |
| Python | kein Bestandteil der Haupt-App | nur optionale externe Hilfsskripte |
| PWA | optionaler späterer Meilenstein | nicht Teil des V2-Kerns |
| Desktop | Tauri 2 | optionaler späterer Meilenstein |

## Laufzeitvorgabe

Die V2 soll auf einer aktuellen Node.js-LTS-/kompatiblen Version entwickelt werden. Da aktuelle Vite-Versionen Node.js 20.19+ beziehungsweise 22.12+ verlangen können, gilt für das Projekt als Mindestanforderung:

> **Node.js >= 20.19 und npm >= 10**

Wenn das konkret installierte Vite-Template eine höhere Mindestversion verlangt, ist dessen Warnung maßgeblich.

## Architekturprinzip

React ist ausschließlich die UI-Schicht. Fachlogik bleibt als frameworkunabhängiges TypeScript testbar.

```text
React UI
  ↓
Feature Controller / Hooks
  ↓
Domain Services / Reducer Actions
  ↓
Pure TypeScript Domain
  ↓
Storage / Import / Export Adapter
```

Die Prompt-Engine darf keine React-Abhängigkeit besitzen.

## Abhängigkeiten

Zielabhängigkeiten:

```json
{
  "dependencies": {
    "@hookform/resolvers": "<current>",
    "react": "<current>",
    "react-dom": "<current>",
    "react-hook-form": "<current>",
    "zod": "<current>"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "<current>",
    "@testing-library/react": "<current>",
    "@testing-library/user-event": "<current>",
    "@types/react": "<current>",
    "@types/react-dom": "<current>",
    "@vitejs/plugin-react": "<current>",
    "jsdom": "<current>",
    "typescript": "<current>",
    "vite": "<current>",
    "vitest": "<current>"
  }
}
```

Keine Versionen hart aus diesem Plan übernehmen. Bei der tatsächlichen Migration installiert Codex die zu diesem Zeitpunkt aktuellen kompatiblen Releases und commitet `package-lock.json`.

## TypeScript-Regeln

`tsconfig` mindestens:

- `strict: true`
- keine impliziten `any`
- Domain-Typen aus Zod-Schemas ableiten, wenn das Schema die Datenquelle der Wahrheit ist
- `unknown` an Import- und Storage-Grenzen, anschließend Zod-Parsing
- keine ungeprüften Type Assertions für persistierte Daten
- discriminated unions für Asset-Kategorien und Capability-Zustände

## React-Regeln

- Funktionskomponenten
- keine Klassenkomponenten
- keine Geschäftslogik in JSX
- keine riesigen Universalformulare
- Kategorieeditoren als eigene Features
- Wizard-Schritte als deklarative Step-Konfiguration
- globale UI-/Profilzustände über Context + Reducer
- temporärer Formularzustand primär in React Hook Form
- Context nicht als Ersatz für jeden lokalen Komponentenstate verwenden

## Formular- und Validierungsregeln

React Hook Form steuert:

- Eingaben
- Field Arrays
- Dirty State
- Validierungsstatus
- schrittweise Wizard-Prüfung

Zod steuert:

- Basisprofile
- Kategorieprofile
- Assetprofile
- Importdateien
- persistierte Daten
- Kategorie-spezifische Formdaten

Nicht relevante Felder werden beim Kategorie-Wechsel bewusst entfernt oder in einer separaten Rückkehrhistorie gehalten; sie dürfen nicht ungeprüft in den finalen Prompt gelangen.

## Zustand und Profilvererbung

React Context + Reducer verwaltet mindestens:

- App-Einstellungen
- Theme
- aktive Basisprofil-ID
- Basisprofile
- Kategorieprofile
- Assetprofile
- aktuellen Wizard-Entwurf
- Profilfilter

Die Profilauflösung selbst ist eine pure Domain-Funktion und gehört nicht in den Reducer.

Seit Prompt 10 hält `ProfileLibraryProvider` den validierten Gesamtgraphen,
Profilfilter und sichtbare Mutationsresultate über Ansichtswechsel hinweg. Seit
Prompt 13 umfasst die Mutationsgrenze neben den Assetprofil-Operationen auch
das immutable Anlegen und Duplizieren von Basisfamilien. Eine neue Familie
erhält eine validierte ID und Zeitstempel; Original, Nachkommen und bestehende
Elternreferenzen werden weder in-place geändert noch umgehängt. Jeder Kandidat
wird vor der Übernahme erneut als vollständige Bibliothek mit Zod geprüft und
ausschließlich über einen gemeinsamen `writeProfileLibrary()`-Aufruf
persistiert. Der Storage-Adapter versucht bei Teilfehlern einen Rollback, kann
aber keine atomare Browser-Speicherung garantieren. Fehlgeschlagene Writes
lassen Bibliotheksgraph und Karten unverändert; nur der sichtbare Mutationsstatus
im Reducer wechselt auf den
konkreten Fehler. Der injizierte Storage-Adapter bleibt über einen
App-Lifecycle stabil. Spätere Import-/Restore-Flows müssen den Provider
rehydrieren, statt parallel direkt in dieselben Namespaces zu schreiben.

Die Top-Level-Navigation nutzt seit Prompt 08 bewusst keine Router-Abhängigkeit.
Ein injizierbarer Adapter kapselt `history.pushState`, `history.replaceState`
und `popstate`; der aktuelle View-State liegt in einem eigenen Context/Reducer.
Die URL verwendet `?view=…`, damit Fragmentanker für Skip-Links und spätere
In-Page-Ziele frei bleiben. `startView` ist nur der validierte Startfallback und
wird beim normalen Ansichtswechsel nicht als „zuletzt besucht“ überschrieben.

Seit Prompt 11 hält ein eigener `WizardSessionProvider` den aktiven validierten
Draft, seine strukturelle Dirty-Baseline, einen nicht persistierten Rohwert-
Snapshot für schema-ungültige Core-Eingaben und den Persistenzstatus über
Ansichtswechsel hinweg. React Hook Form bleibt Eigentümer der sichtbaren
Formularwerte. `GuidedWizardEngine` ist generisch; die externe Flow-Definition
liefert Step-Komponenten, Zod-Schemas, relevante RHF-Feldpfade, Draft-Mapping
und Zusammenfassung. Profil- und Resume-Hydration schreiben nicht. Gültige
Benutzeränderungen werden verzögert, bewusste Schrittwechsel sofort über den
schmalen Draft-Storage-Port persistiert. Seit Prompt 12 können Schritte ein
deklaratives `isApplicable`-Prädikat besitzen. Hauptkategorie und Untertyp
werden zuerst gewählt. Seit Prompt 13 folgt danach verpflichtend die Wahl,
Anlage oder Duplikation eines Basisprofils; Richtung, Animation und
Kachelbarkeit erscheinen erst anschließend nach zentral aufgelöster
Capability. Kategorie-only bleibt transient, während ein vollständiger
Pre-Base-Draft auf `wizard/profile` fortsetzbar ist. Eine explizite
`null`-Draftprojektion hält unvollständige Klassifikationswechsel bei
Vor-/Zurück-Navigation im Formular, ohne den alten Draft erneut zu speichern.

Der Basisprofil-Schritt bildet die vollständigen technischen Werte in React
Hook Form ab, zeigt ihren wirksamen Wert, ihre Quelle und den Lock-Status und
blendet Figurenhöhe, Weltgeometrie sowie Alpha-Rand capability-gerecht ein.
Entsperrte Abweichungen werden beim Draft-Mapping gegen die wirksame
Base→Category-Vererbung verglichen; nur nicht redundante und relevante Werte
gelangen in den Asset-Level-Override-Snapshot. Gesperrte Felder sind read-only
und öffnen einen
bewussten Abbruch-/Wechsel-/Duplikat-/Neu-Workflow. Für die programmatische
Übernahme aller Base-Werte stellt die generische Engine dem Schritt
`notifyProgrammaticChange()` bereit. Ein Aufruf führt den fertigen
Mehrfeld-Snapshot durch dieselbe Draft-Projektion, Dirty-Logik und
Autosave-Strecke wie eine native Eingabe. Mount, Profil-Hydration und Resume
bleiben weiterhin schreibfrei.

Seit Prompt 14 folgt bei der Kategorie `character` unmittelbar nach dem
Basisprofil ein eigener, deklarativer Character-/NPC-Schritt. Seine
vollständigen Fachwerte liegen in React Hook Form, werden über das strikte
additive `CharacterAnswersSchema` in Drafts projiziert und durchlaufen dieselbe
Dirty-, Autosave- und Resume-Strecke wie die Core-Felder. Initialisierung,
Profil-Hydration und Resume bleiben schreibfrei. NPC-Kontextfelder und
humanoide Kleidungsgruppen werden über pure Untertypprüfungen eingeblendet;
Kategorie- oder Untertypwechsel entfernen alte Character-Daten, während ein
Basiswechsel sie erhält.
Beim ausdrücklichen Leeren eines geerbten Character-Defaults wird die
Kategorieverknüpfung gelöst; die Projektion materialisiert alle übrigen
wirksamen Fach- und Technikwerte relativ zur Base, damit kein Default beim
Resume unbeabsichtigt zurückkehrt.

Die wirksame Figurenhöhe bleibt ein technischer Wert der
Base→Category→lokal-Kette. Der Character-Editor zeigt sie mit Quelle und Lock
read-only und speichert sie weder in `CharacterAnswers` noch redundant als
neuen lokalen Override. Richtung und Animation bleiben getrennte
Capabilities: 4/8 Richtungen erscheinen nur bei `directional`, während
`animated` eine eindeutige Aktionsliste mit 1 bis 8 Frames je Aktion öffnet.
Walk startet bei Neuauswahl mit 5 Frames. Bestehende Schema-V2-Werte
`animationAction` und `framesPerDirection` werden beim Hydrieren weiterhin
verstanden; neue Projektionen schreiben kanonisch sortierte
`animationActions`.

Seit Prompt 15 folgt für `movingObject` direkt nach dem Basisprofil der eigene
Schritt `movingObjectDetails`. Objektklasse, Zweck, Grundform, Beschreibung,
Tile-Footprint, Höhe, Anker, Bewegung, Mechanik, Material, Zustand, Licht und
Schatten verbleiben vollständig in React Hook Form und nutzen denselben
Rohzustands-, Dirty-, Autosave- und Resume-Vertrag wie der Wizard-Core.
Kategorie- oder Untertypwechsel bereinigen die Daten, ein Basiswechsel erhält
sie. Beim ausdrücklichen Leeren eines geerbten Moving-Object-Defaults werden
Kategorie-/Assetprovenienz gelöst und alle übrigen wirksamen Fach- und
Technikwerte relativ zur Base materialisiert.

Animation und Richtung bleiben auch für Moving Objects getrennt. Ein eigener
Animationseditor schreibt eindeutige, kanonisch sortierte
`animationSequences` mit 1 bis 16 Frames je Sequenz. Vorhandene
`animationType`-/`framesPerDirection`-Daten werden weiterhin schreibfrei
gelesen. Ein Karren kann 4/8 Richtungen erhalten; ein animierter
`floatingCrystal` erhält trotz Bewegung keine Richtungsfrage. Live-
Zusammenfassung und Dashboard zeigen nur tatsächlich konfigurierte und
capability-gültige Moving-Object-Fakten.

Seit Prompt 16 folgt für `texture` direkt nach dem Basisprofil der eigene
Schritt `textureDetails`. `TextureMaterialEditor` erfasst Materialtyp, Einsatz,
Beschreibung, die dreiwertige Nahtlosigkeitsentscheidung, Struktur, Zustand,
Oberflächenaufbau und -richtung, Feuchtigkeit, Vereisung, Materiallicht und
Zusatzdetails vollständig in React Hook Form. Materialtyp und wirksame
Tilegröße werden read-only aus Untertyp beziehungsweise technischer
Base→Category→Asset-Vererbung dargestellt. `tileSize` wird deshalb nicht in
`TextureAnswers` dupliziert. Der Fachschritt besitzt die dreiwertige
Nahtlosigkeitsentscheidung selbst; der generische `tileability`-Schritt wird
für Texturen nicht zusätzlich angezeigt.

Der öffentliche Katalog unter `src/domain/textures/` und das strikt additive
`TextureAnswersSchema` halten bestehende Schema-V2-Felder ohne eager Defaults
lesbar. Texture-Werte werden wirksam Base→Category→Asset aufgelöst, als minimale
lokale Abweichungen projiziert und bei Explicit Clear mit derselben
Provenienzablösung wie Character und Moving Objects behandelt. Basiswechsel
erhalten Texture-Fachwerte, Klassifikationswechsel bereinigen sie. Mount,
Profil-Hydration und Resume bleiben schreibfrei; gültige Nutzeränderungen
verwenden den gemeinsamen Autosave-Pfad. Holz erhält fokussierte
Materialhinweise, aber keine Figuren-, Kleidungs-, Bewegungs- oder
Richtungsfragen. Live-Zusammenfassung und Dashboard zeigen ausschließlich
tatsächlich konfigurierte Texture- und zentrale Tile-Fakten.

Seit Prompt 17 folgt für `nature` direkt nach dem Basisprofil der eigene
Schritt `natureDetails`. `NatureTreeEditor` erfasst Art, Beschreibung, Klima,
Saison, Alter, Silhouette, untertypabhängige Stamm-, Kronen- und Wurzeldaten,
Moos, Pilze, Schnee, Ranken, Standfläche, Bodenanschluss und 1 bis 12 Varianten
in React Hook Form. Pflanzentyp und wirksame Tilegröße werden read-only aus
Untertyp beziehungsweise technischer Base→Category→Asset-Vererbung gezeigt;
`tileSize` wird nicht in `NatureAnswers` dupliziert.

Der öffentliche Katalog unter `src/domain/nature/` stellt readonly IDs, das
vollständige `NATURE_PLANT_TYPE_BY_SUBTYPE`-Mapping,
`getDefaultNaturePlantType()` sowie die puren Guards
`natureSubtypeHasTrunk()`, `natureSubtypeHasCrown()` und
`natureSubtypeHasRoots()` bereit. `NatureAnswersSchema` erweitert den
Schema-V2-Vertrag strikt und additiv: vorhandene Naturdaten bleiben ohne eager
Defaults lesbar, ein gespeicherter Pflanzentyp muss zum Untertyp passen und
anatomisch irrelevante Felder werden abgewiesen.

Nature-Werte werden Base→Category→Asset aufgelöst und nur als nicht redundante
lokale Abweichungen gespeichert. Explicit Clear löst Kategorie-/Assetprovenienz
und materialisiert die übrigen wirksamen Fach- und Technikwerte relativ zur
Base. Basiswechsel erhalten die Fachwerte, Klassifikationswechsel bereinigen
sie. Rohzustand, Dirty State, 300-ms-Autosave und exaktes Resume gelten auch
für Naturfelder; Mount, Profil-Hydration und Resume schreiben nicht.
Zusammenfassung und Dashboard zeigen nur relevante Naturfakten.

Wind-, Magie- und benutzerdefinierte Animationen bleiben ein eigener
`animated`-Capability-Schritt. Nature-Untertypen sind nicht `directional` und
erhalten keine 4/8-Richtungsfrage.

Seit Prompt 18 folgt für `staticObject` direkt nach dem Basisprofil der eigene
Schritt `staticObjectDetails`. `StaticWorldObjectEditor` erfasst Funktion,
Beschreibung, Form, Proportion, Symmetrie, Haupt- und Nebenmaterial,
Materialdetails, Zustand, Konstruktion, Inhalt, Standfläche, Schatten und 1 bis
12 Varianten in React Hook Form. Objektklasse und wirksame Tilegröße werden
read-only aus Untertyp beziehungsweise technischer Base→Category→Asset-
Vererbung dargestellt; `tileSize` wird nicht in `StaticObjectAnswers`
dupliziert.

Der öffentliche Katalog unter `src/domain/static-objects/` stellt readonly
IDs, das vollständige `STATIC_OBJECT_CLASS_BY_SUBTYPE`-Mapping und
`getDefaultStaticObjectClass()` bereit. `StaticObjectAnswersSchema` erweitert
den Schema-V2-Vertrag strikt und additiv; vorhandene Werte bleiben ohne eager
Defaults lesbar und eine gespeicherte Objektklasse muss zum Untertyp passen.

Static-Object-Werte werden Base→Category→Asset aufgelöst und nur als nicht
redundante lokale Abweichungen gespeichert. Explicit Clear löst Kategorie-/
Assetprovenienz und materialisiert die übrigen Fach- und Technikwerte relativ
zur Base. Basiswechsel erhalten Fachwerte, Klassifikationswechsel bereinigen
sie. Rohzustand, Dirty State, 300-ms-Autosave und exaktes Resume gelten auch
hier; Mount, Profil-Hydration und Resume schreiben nicht. Zusammenfassung und
Dashboard zeigen nur kompakte, tatsächlich konfigurierte Objektfakten.

Öffnen, Leuchten, Zerbrechen und benutzerdefinierte Animation bleiben ein
eigener `animated`-Capability-Schritt. Static-Object-Untertypen sind nicht
`directional` und erhalten keine 4/8-Richtungsfrage.

Seit Prompt 19 folgt für `building` direkt nach dem Basisprofil der eigene
Schritt `buildingDetails`. `BuildingArchitectureEditor` erfasst Nutzung,
Bauform, Größe, vollständigen Tile-Footprint, Gebäudehöhe, Stockwerke,
Materialien, Dach, Fassade, Türen, Fenster, Zustand, Belegung,
Umgebungskontext, Mapping, Kollision, Modularität und lokales Licht in React
Hook Form. Gebäudetyp sowie wirksame Tilegröße, Perspektive, Kameraneigung und
Projektion werden read-only aus Untertyp und technischer
Base→Category→Asset-Vererbung gezeigt; diese Technikwerte werden nicht in
`BuildingAnswers` dupliziert.

Der öffentliche Katalog unter `src/domain/buildings/` stellt readonly IDs, das
vollständige `BUILDING_TYPE_BY_SUBTYPE`-Mapping und
`getDefaultBuildingType()` bereit. `BuildingAnswersSchema` erweitert den
Schema-V2-Vertrag strikt und additiv; vorhandene Building-Werte bleiben ohne
eager Defaults lesbar. Ein gespeicherter Gebäudetyp muss zum Untertyp passen;
modulare Ausgabe und `modularSet`-Mapping sind nur für modular fähige
Untertypen gültig.

Building-Werte werden Base→Category→Asset aufgelöst und minimal lokal
gespeichert. Explicit Clear löst Elternprovenienz und materialisiert die
übrigen wirksamen Fach- und Technikwerte relativ zur Base. Basiswechsel
erhalten die Fachwerte, Klassifikationswechsel bereinigen sie. Rohzustand,
Dirty State, 300-ms-Autosave und exaktes Resume gelten unverändert; Mount,
Profil-Hydration und Resume schreiben nicht. Zusammenfassung und Dashboard
zeigen kompakte tatsächliche Architekturfakten.

Nur ein Tor erhält den separaten `animated`-Capability-Schritt. Kein
Building-Untertyp ist `directional`, daher erscheinen weder 4/8 Richtungen
noch Figurenhöhe.

Seit Prompt 20 folgt für `tileset` direkt nach dem Basisprofil der eigene
Schritt `tilesetDetails`. `TilesetEditor` erfasst Mapping-Einsatz,
untertyprelevante Kanten, Ecken, Übergänge und Materialgrenzen, Seam-Regeln,
Wiederholung, Varianten und Atlasparameter in React Hook Form. Tiletyp,
wirksame Tilegröße und Pixelmaßstab werden read-only aus Untertyp und
Base→Category→Asset-Vererbung gezeigt und nicht in Fachantworten dupliziert.

Der öffentliche Katalog unter `src/domain/tilesets/` stellt readonly IDs, das
vollständige `TILESET_TYPE_BY_SUBTYPE`-Mapping sowie pure Relevanz-Guards
bereit. `resolveTilesetAtlasMetrics()` und
`createTilesetTechnicalSpecification()` berechnen Zeilen, Spalten, Kapazität,
freie Slots und Canvasgröße deterministisch. `TilesetAnswersSchema` bleibt
strikt und additiv; alte V2-Daten werden ohne eager Defaults gelesen, während
Typ-/Untertyp-, Verbindungs- und Atlaslayoutkonflikte abgewiesen werden.

Tileset-Werte werden Base→Category→Asset aufgelöst und minimal lokal
gespeichert. Explicit Clear, Basis-/Klassifikationswechsel, Rohzustand, Dirty
State, Autosave und schreibfreies Resume folgen dem gemeinsamen Vertrag.
Der generische `tileability`-Schritt wird für Tilesets durch den Fachschritt
ersetzt; alte Drafts werden in-memory dorthin umgeleitet. Nur das animierte
Tile erhält einen separaten Animationsschritt, kein Tileset 4/8 Richtungen oder
Figurenhöhe.

Seit Prompt 21 folgt für `item` direkt nach dem Basisprofil der eigene Schritt
`itemDetails`. `ItemEquipmentEditor` erfasst Zweck, Darstellung, Materialien,
Zustand, Funktion, Bedeutung, Größe, Silhouette, Lesbarkeit, Glow, Schatten
und Varianten in React Hook Form. Itemklasse, wirksamer Hintergrund,
Tilegröße und Pixelmaßstab werden read-only aus Untertyp und
Base→Category→Asset-Vererbung gezeigt.

Der öffentliche Katalog unter `src/domain/items/` stellt readonly IDs, das
vollständige `ITEM_CLASS_BY_SUBTYPE`-Mapping sowie den puren Wearable-Guard
bereit. `ItemAnswersSchema` bleibt strikt und additiv; alte V2-Daten werden
ohne eager Defaults gelesen, während Klassenkonflikte und Wearable-Daten auf
nicht tragbaren Untertypen abgewiesen werden.

Item-Werte werden Base→Category→Asset aufgelöst und minimal lokal gespeichert.
Explicit Clear, Basis-/Klassifikationswechsel, Rohzustand, Dirty State,
Autosave und schreibfreies Resume folgen dem gemeinsamen Vertrag. Kein
Item-Untertyp ist `directional` oder `animated`; technische Hintergrund- und
Maßstabswerte werden nicht in Item-Fachantworten dupliziert.

Seit Prompt 22 folgt für `artwork` direkt nach dem Basisprofil der eigene
Schritt `artworkDetails`. `ArtworkConceptEditor` erfasst Zweck, Motiv, Szene,
Komposition, Format, Hintergrund, Fokus, Lichtdramaturgie und Detailgrad in
React Hook Form. Artworktyp wird aus dem Untertyp abgeleitet; Pixelstil,
Stilprofil und Outline erscheinen als allgemeine geerbte Art Direction
read-only.

Der öffentliche Katalog unter `src/domain/artworks/` stellt readonly IDs und
das vollständige `ARTWORK_TYPE_BY_SUBTYPE`-Mapping bereit.
`ArtworkAnswersSchema` bleibt strikt und additiv; alte V2-Daten werden ohne
eager Defaults gelesen. Artworktyp sowie Tile-, Kamera-, Figuren-, Sprite-,
Richtungs- und Animationswerte werden nicht in Artwork-Fachantworten
dupliziert.

Artwork-Werte werden Base→Category→Asset aufgelöst und minimal lokal
gespeichert. Explicit Clear, Basis-/Klassifikationswechsel, Rohzustand, Dirty
State, Autosave, schreibfreies Resume, Summary und Dashboard folgen dem
gemeinsamen Vertrag. `freeComposition` erzeugt keine neuen Weltgeometrie-
Overrides; alte Werte bleiben verlustfrei lesbar, werden jedoch weder als
relevant angezeigt noch in den Compatibility Key aufgenommen.

Seit Prompt 23 stellt `src/domain/prompt-engine/` eine frameworkfreie Strict-
TypeScript-Engine bereit. `buildPromptPackages()` verarbeitet ausschließlich
validierte `ResolvedProfile`-Werte und erzeugt immutable Haupt-, Negativ-,
Technik- und kombinierte Ausgaben. Zwölf feste pure Module halten
Kategorieinhalte getrennt, deduplizieren Regeln stabil und erzeugen für
`styleProfile: both` eigenständige klassische und düstere Pakete. Sprache ist
eine explizite, kanonisch deduplizierte Option.

Capability-Gates begrenzen Richtungsregeln auf `directional` und halten
Animation separat. Kamera, Bodenanker und Weltlicht bleiben im Richtungsset
konstant; freie Artworks erhalten keine Weltgeometrie-, Figurenmaßstabs- oder
Animationsregeln. Die technische Tileset-Ausgabe verwendet die bestehende
pure Atlasmetrik. Prompt 24 ergänzt als React-basierte Review-/Output-
Oberfläche die sichtbare Produktionsintegration; Prompts 00 bis 24 sind damit
abgeschlossen.

Seit Prompt 24 liest `src/features/review-output/` ausschließlich einen
validierten aktiven oder persistierten Wizard-Draft und die validierte
Profilbibliothek. Die pure Vorbereitung löst Base→Category→Asset auf und ruft
danach die öffentliche Prompt Engine auf; unvollständige Drafts, ungültige
Storage-Daten und Profilkonflikte erzeugen keine Teilprompts. Die responsive
React-Ansicht zeigt Quellen und Locks, Konflikt-/Validierungshinweise,
Sprach-/Stilpakete sowie vier tastaturbedienbare Output-Tabs.

`src/services/outputWorkspaceAdapter.ts` kapselt Clipboard und lokale Blob-
Downloads als injizierbaren Port. TXT exportiert die aktive Ausgabe; JSON
verwendet weiterhin `ExportBundleSchema` samt benötigten Base-/Category-
Abhängigkeiten und Draft. Das pure `saveAssetProfile()` erzeugt neue
Assetprofile oder aktualisiert geladene Quellen unter ihrer stabilen ID;
Provider und Storage-Adapter validieren den vollständigen Graphen vor jedem
Write.

Prompt 25 erweitert den fail-closed Konfliktzustand um eine kontrollierte
Konvertierung, ohne die Schichtengrenzen zu verändern. Die pure
`profileConversionData.ts` berechnet aus Resolver-Teilprofil und strukturierten
Lock-Konflikten den gewünschten wirksamen Stand, prüft vorhandene Basen und
vergleicht den neu berechneten Compatibility Key. React Hook Form und Zod
validieren ausschließlich den Namen einer neuen oder duplizierten Familie;
Profilanlage und -duplikation bleiben Provider-Operationen, der bestätigte
Draft bleibt ein separater Storage-Write.

Die Oberfläche bietet Abbruch, Duplikation, Neuanlage und Wahl einer
kompatiblen Familie erst nach einer Folgenvorschau. Der konvertierte Draft
materialisiert geerbte Kategorieantworten und löst alte Category-/Asset-
Provenienz, ohne bestehende Profile oder deren Kinder umzuhängen. Andere
Referenz- und Klassifikationskonflikte bleiben angehalten und erzeugen keine
Ausgabe.

Prompt 26 schließt die querschnittliche UI-Härtung ab, ohne eine neue
Fachschicht einzuführen. Semantische native Controls, sichtbare tokenbasierte
Fokusringe, kontrollierte Fokusübergaben und roving Output-Tabs bilden den
Tastaturvertrag. CSS Modules verantworten weiterhin den lokalen Reflow; lange
Profil-, Technik- und Promptinhalte bleiben bei 360 px innerhalb ihrer
Oberflächen. Das globale Stylesheet deaktiviert unter
`prefers-reduced-motion: reduce` Übergänge, begrenzt Animationen und erhält in
erzwungenen Systemfarben einen sichtbaren Fokusring. Die geprüfte
Desktop-/Tablet-/Schmalviewport-Matrix und die Kontrastwerte stehen in
`V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md`. Prompts 00 bis 26 sind abgeschlossen;
Prompt 27 bleibt die nächste separate Phase.

## Speicherung

V2 benutzt lokale Namespaces, z. B.:

```text
pixelforge:v2:settings
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:draft
pixelforge:v2:migration-backup
```

Persistierte Daten werden immer über Zod validiert. Korrupte oder inkompatible Daten dürfen die App nicht unbrauchbar machen.

Der implementierte Einstiegspunkt ist `src/services/index.ts`. Komponenten
verwenden ausschließlich den dort exportierten Browser-Adapter; direkter
`localStorage`-Zugriff bleibt auf dessen Composition Root beschränkt. Die drei
Profil-Namespaces speichern jeweils ein `schemaVersion: 2`-Envelope und dürfen
nur gemeinsam über `writeProfileLibrary()` verändert werden, damit
Referenzen, Locks und Compatibility Keys als Gesamtgraph gültig bleiben.
Adapter-Reads liefern `valid`, `empty`, `invalid` oder `unavailable` statt
Storage- und Parsefehler bis in React durchzuwerfen.

## Styling

- `src/styles/tokens.css`: globale semantische Design-Tokens
- `src/styles/globals.css`: Reset, Typografie, globale Regeln
- pro Komponente / Feature ein `.module.css`
- Theme per `data-theme="light|dark"` auf Root-Ebene
- Systemmodus wird über `prefers-color-scheme` aufgelöst
- keine Inline-Styles für normale Layout-/Designaufgaben

Implementierter Vertrag: `SettingsProvider` aus `src/store/settings/` hält das
vollständige validierte `AppSettings`-Objekt und persistiert eine Theme-Wahl nur
nach expliziter Nutzeraktion über den injizierten Storage-Adapter. Die
Präferenz `system` bleibt gespeichert, während am `<html>`-Element immer nur
das wirksame `data-theme="light|dark"` steht. Media-Query-Änderungen aktualisieren
die Oberfläche live, verändern aber weder Storage noch `updatedAt`. Vor dem
React-Start bietet `tokens.css` für den Systemmodus einen CSS-Media-Fallback.

## Tests

Vitest testet Domain- und Infrastrukturcode. React Testing Library testet Benutzerverhalten.

Pflichtbereiche:

- Capability-Auflösung
- Profilvererbung / Locks
- Compatibility Key
- Zod-Schemas
- V1→V2-Migration
- Prompt-Module
- Wizard-Routing
- bedingte Felder
- Basisprofilwahl, Lock-Konflikt, Profilwechsel, Anlage und Duplikation
- schreibfreie Wizard-Hydration und gebündelte programmatische RHF-Änderungen
- Character/NPC-Feldgrenzen, Untertyp-Gating und Draft↔RHF-Roundtrip
- eindeutige Character-Aktionen, 1–8 Frames, Walk-Default und Legacy-Lesbarkeit
- geerbte/gesperrte Figurenhöhe ohne Duplikation in Character-Antworten
- Moving-Object-Feldgrenzen, Subtyp/Objektklasse, Footprint und
  Draft↔RHF-Roundtrip
- eindeutige Moving-Object-Sequenzen, 1–16 Frames und Legacy-Lesbarkeit
- Base→Category→Asset-Vererbung sowie Explicit-Clear-Detach für Moving Objects
- Karren mit Richtungen gegen animierten `floatingCrystal` ohne Richtungen
- Texture-Feldgrenzen, Untertyp/Materialtyp und additive Schema-V2-Lesbarkeit
- dreiwertiges `seamless`, zentrale Tilegröße ohne Fachantwort-Duplikation und
  Texture-Draft↔RHF-Roundtrip
- Base→Category→Asset-Vererbung, minimale Projektion und
  Explicit-Clear-Detach für Texturen
- Holzprofil mit Material-, Oberflächen- und Kacheldaten, aber ohne Figuren-
  oder Richtungsfragen
- schreibfreie Texture-Hydration/Resume sowie Summary-/Dashboard-Projektion
- Nature-Kataloge, vollständiges Untertyp-/Pflanzentyp-Mapping, pure
  Anatomie-Guards und additive Schema-V2-Lesbarkeit ohne Defaults
- subtype-gesteuerte Stamm-, Kronen- und Wurzelfelder sowie vollständige
  Footprints von 1–64 Tiles und 1–12 Varianten
- Base→Category→Asset-Vererbung, minimale Nature-Projektion und
  Explicit-Clear-Detach
- schreibfreie Nature-Hydration/Resume, Autosave und
  Summary-/Dashboard-Projektion
- Wind-/Magieanimation für animierbare Nature-Untertypen ohne Richtungsset
- Static-Object-Kataloge, vollständiges Untertyp-/Objektklassen-Mapping und
  additive Schema-V2-Lesbarkeit ohne Defaults
- vollständige Static-Object-Footprints von 1–64 Tiles, 1–12 Varianten sowie
  Funktions-, Form-, Material-, Zustands-, Interaktions- und Schattenwerte
- Base→Category→Asset-Vererbung, minimale Static-Object-Projektion und
  Explicit-Clear-Detach
- schreibfreie Static-Object-Hydration/Resume, Autosave und
  Summary-/Dashboard-Projektion
- animierte Truhe oder Tür ohne Richtungsset
- Building-Kataloge, vollständiges Untertyp-/Gebäudetyp-Mapping und additive
  Schema-V2-Lesbarkeit ohne Defaults
- vollständige Building-Footprints von 1–64 Tiles, Höhe, Stockwerke,
  Materialien, Dach, Fassade, Türen, Fenster, Mapping, Kollision und Licht
- Base→Category→Asset-Vererbung, minimale Building-Projektion und
  Explicit-Clear-Detach
- schreibfreie Building-Hydration/Resume, Autosave und
  Summary-/Dashboard-Projektion
- modularer animierter Torbau ohne Richtungsset oder Figurenhöhe
- Tileset-Kataloge, vollständiges Untertyp-/Tiletyp-Mapping, pure
  Verbindungs-Guards und additive Schema-V2-Lesbarkeit ohne Defaults
- deterministische Atlasmetriken und technische Spezifikation aus zentraler
  Tilegröße, Slotzahl, Layout, Zwischenraum und Rand
- Base→Category→Asset-Vererbung, minimale Tileset-Projektion und
  Explicit-Clear-Detach
- schreibfreie Tileset-Hydration/Resume, Autosave und
  Summary-/Dashboard-Projektion
- strukturierter Autotile-Flow ohne Richtungsset oder Figurenhöhe
- Item-Kataloge, vollständiges Untertyp-/Itemklassen-Mapping, Wearable-Guard
  und additive Schema-V2-Lesbarkeit ohne Defaults
- Base→Category→Asset-Vererbung, minimale Item-Projektion, Explicit Clear,
  schreibfreie Hydration/Resume, Autosave sowie Summary-/Dashboard-Projektion
- Artwork-Kataloge, vollständiges Untertyp-/Artworktyp-Mapping und additive
  Schema-V2-Lesbarkeit ohne Defaults
- Base→Category→Asset-Vererbung, minimale Artwork-Projektion, Explicit Clear,
  Rohzustand, schreibfreie Hydration/Resume, Autosave sowie
  Summary-/Dashboard-Projektion
- freier Artwork-Flow ohne Tile-, Sprite-, Weltkamera-, Figuren-, Richtungs-
  oder Animationsfelder
- 8 Richtungen nur bei richtungsabhängig beweglichen Assets
- Speichern / Laden / Import / Export
- Theme-Umschaltung

## Nicht Teil der V2-Basis

- Server
- Benutzerkonten
- Cloud-Synchronisation
- Datenbankserver
- Python-Backend
- Electron
- Tauri-Paketierung
- PWA-Offline-Installationslogik

Diese Punkte dürfen nur in einem späteren eigenen Meilenstein eingeführt werden.
