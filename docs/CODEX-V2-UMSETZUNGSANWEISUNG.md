<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Codex-Umsetzungsanweisung — PixelForge Prompt Studio V2

## 0. Zweck und Priorität

Dieses Dokument ist der technische Bauplan für die Migration und vollständige V2-Überarbeitung des bestehenden Pixelart Prompt Studios.

**Prioritätsreihenfolge bei Widersprüchen:**

1. `AGENTS.md`
2. `docs/TECHNOLOGIE-STACK-V2.md`
3. dieses Dokument
4. `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
5. `docs/PROMPT-SPECIFICATION.md`

Codex bearbeitet immer genau einen Auftrag aus `docs/CODEX-V2-PROMPTS.md`, testet ihn vollständig und stoppt danach.

> Die V1 ist Legacy. Die verbindliche V2-Zielarchitektur ist **TypeScript + React + Vite + npm**.

---

# 1. Ausgangslage und Migrationsprinzip

Die vorhandene Anwendung besitzt bereits funktionierende Promptregeln, Presets, lokale Speicherung und Exporte. Diese Funktionen sind fachliche Referenz und Migrationsquelle. Sie werden nicht blind weggeworfen.

Die Migration erfolgt **inkrementell**, aber nicht als dauerhafte Mischarchitektur:

```text
V1 inventarisieren
    ↓
React/TS/Vite-Grundgerüst herstellen
    ↓
fachliche V1-Logik in pure TypeScript-Domain portieren
    ↓
Zod-Schemas + V2-Profile + Storage aufbauen
    ↓
React-App-Shell und neue UX entwickeln
    ↓
Spezialeditoren migrieren
    ↓
Prompt Engine 2.0 aktivieren
    ↓
V1-UI entfernen, wenn Feature-Parität und Migration bestätigt sind
```

Keine neue V2-Funktion darf als zusätzliche Vanilla-DOM-Insel implementiert werden.

---

# 2. Verbindlicher Technologie-Stack

| Schicht | Technologie |
|---|---|
| Sprache | TypeScript, `strict: true` |
| UI | React |
| Dev/Build | Vite |
| Paketverwaltung | npm |
| Formulare | React Hook Form |
| Validierung | Zod |
| Globaler Zustand | React Context + `useReducer` |
| Persistenz | localStorage + JSON Import/Export |
| Styling | CSS Modules + globale CSS Custom Properties |
| Icons | eigene SVG-React-Komponenten |
| Tests | Vitest + React Testing Library + jsdom |
| Backend | keines |

Node.js mindestens 20.19; bei höherer Vite-Anforderung gilt die Template-Anforderung.

---

# 3. Zielarchitektur

## 3.1 Layer

```text
src/
├── app/          React bootstrap, providers, navigation
├── components/   wiederverwendbare UI-Komponenten
├── config/       zentrale Marken- und stabile Protokollkonfiguration
├── domain/       frameworkfreie Fachlogik
├── features/     Dashboard, Profile, Wizard, Editoren, Output
├── schemas/      Zod-Schemas und abgeleitete Typen
├── services/     Storage, Import/Export, Migration
├── store/        Context, Reducer, Actions, Selectors
├── styles/       Design-Tokens und globale Styles
└── test/         gemeinsames Testsetup
```

## 3.2 Domain ist frameworkfrei

In `domain/` gehören:

- Asset-Kategorien und Untertypen
- Capabilities
- Profilauflösung
- Locks
- Compatibility Key
- Prompt Engine
- Canvas-/Frame-Metriken
- Migrations-Transformationen, soweit DOM-unabhängig
- Validierungsregeln, die nicht zur Formdarstellung gehören

`domain/` importiert **kein React**, kein React Hook Form und keine Browser-DOM-Komponenten.

## 3.3 Feature-Struktur

```text
features/
├── dashboard/
├── profiles/
├── wizard/
├── base-profile-editor/
├── character-editor/
├── moving-object-editor/
├── static-object-editor/
├── texture-editor/
├── nature-editor/
├── building-editor/
├── tileset-editor/
├── item-editor/
├── artwork-editor/
└── output-workspace/
```

Jeder große Editor besitzt nach Bedarf:

- `components/`
- `hooks/`
- `.schema.ts`
- `.types.ts`
- `.tsx`
- `.test.tsx`

---

# 4. App-Zustände und Navigation

Die Anwendung benötigt diese Hauptansichten:

1. Dashboard
2. Profilbibliothek
3. Neuer-Asset-Wizard
4. Basisprofil-Editor
5. spezialisierter Kategorieeditor
6. Review/Zusammenfassung
7. Output Workspace
8. Einstellungen

Für V2 ist kein externer Router vorgeschrieben. Eine kleine interne Navigation ist ausreichend, solange Browser-Zurück/Vorwärts sinnvoll funktioniert. Keine Router-Bibliothek nur aus Gewohnheit hinzufügen.

Umgesetzter Vertrag seit Prompt 08:

- Die sechs Shell-Ansichten sind `dashboard`, `profiles`, `wizard`, `review`,
  `output` und `settings`.
- Der Query-Key `?view=…` hält Routen von Fragmentankern wie `#main-content`
  getrennt und funktioniert ohne serverseitige Rewrite-Regeln.
- Eine gültige URL-Ansicht hat Vorrang vor dem validierten `startView`; fehlende
  oder ungültige Werte werden per History-Replace kanonisiert.
- Explizite Nutzerwechsel erzeugen einen History-Push, `popstate` synchronisiert
  nur den View-State. Normale Navigation schreibt keine App-Einstellungen.
- Browserzugriff liegt im injizierbaren Adapter unter `src/services/`, der
  React-Context unter `src/store/navigation/`.
- Der Basisprofil-Schritt ist seit Prompt 13 innerhalb des Wizard-Zweigs
  umgesetzt und daher keine zusätzliche Shell-Route. Kategorie- und
  Spezialeditoren folgen weiterhin in ihren jeweiligen Phasen innerhalb
  dieses Zweigs.

---

# 5. Rebranding und Designsystem

Arbeitsmarke:

> **PixelForge Prompt Studio**

Zentrale Konfiguration:

```ts
export const BRAND = {
  productName: 'PixelForge Prompt Studio',
  shortName: 'PixelForge',
  versionLabel: 'V2',
  tagline: 'Geführte Prompt-Produktion für konsistente Pixelart-Assets',
} as const;
```

## Theme

Unterstützen:

- Light
- Dark
- System

Umsetzung:

- semantische Tokens in `src/styles/tokens.css`
- Theme auf Root über `data-theme`
- Systemmodus über `prefers-color-scheme`
- Einstellung lokal speichern
- Theme-Wechsel ohne Reload
- CSS Modules für komponentenspezifische Styles

Implementierte Modulgrenzen:

- `src/config/index.ts` exportiert sichtbares Branding; der separate
  `EXPORT_APPLICATION_ID` bleibt als Dateiformat-Discriminator stabil.
- `src/domain/theme/index.ts` löst die gespeicherte Präferenz pure zu einem
  wirksamen Light-/Dark-Modus auf.
- `src/store/settings/index.ts` stellt den Context/Reducer-Vertrag bereit und
  bindet validierte App-Einstellungen über einen injizierten Storage-Port an.
- `src/components/theme/ThemeSwitcher.tsx` bietet die zugängliche Radiogruppe;
  `src/components/ui/` enthält die ersten wiederverwendbaren CSS-Module-Primitives.

`system` wird nie als `data-theme` geschrieben. Änderungen der
`prefers-color-scheme`-Media-Query verändern nur den wirksamen Modus, nicht die
persistierte Präferenz oder deren `updatedAt`.

## Icon-System

Eigene lokale SVG-React-Komponenten, mindestens für:

- Character
- Moving Object
- Static Object
- Texture
- Nature
- Building
- Tileset
- Item
- Artwork
- Material-Badges wie Wood, Stone, Snow, Ice, Metal, Cloth

Keine Remote-Iconabhängigkeit.

---

# 6. Dashboard

Die Startseite ist ein Dashboard, kein langes Formular.

Pflichtbereiche:

- Hero-/Brand-Bereich
- „Neues Asset“
- „Profil laden“
- letzte Profile
- Favoriten
- Kategorie-Kacheln
- Basisprofil-Schnellauswahl
- Such-/Filterzugriff
- Autosave-Entwurf fortsetzen

Profilkarten zeigen mindestens:

- Name
- Kategorie + Untertyp
- Icon + optional Material-Badge
- Basisprofil
- Tilegröße
- Figurenhöhe, falls relevant
- Pixelstil
- Perspektive
- Bewegungs-/Richtungsstatus, falls relevant
- Änderungsdatum

Umgesetzter Vertrag seit Prompt 09:

- Die neun Kategorie-Karten werden exhaustiv aus der öffentlichen
  `AssetCategory`-Taxonomie erzeugt und starten den Wizard mit einem typisierten
  `{ kind: 'newAsset', category }`-Intent.
- Profilkarten und ein valider lokaler Entwurf verwenden getrennte
  `profile`-/`resume`-Intents. Ein allgemeiner „Neues Asset“-Start setzt eine
  zuvor gewählte Kategorie zurück.
- Das Dashboard liest ausschließlich über einen injizierten
  `readProfileLibrary`-/`readDraft`-Port und verändert beim Anzeigen oder
  Öffnen keine persistierten Daten.
- Effektive Kartendaten werden mit der Profilauflösung berechnet. Tile,
  Figurenhöhe und Perspektive erscheinen nur, wenn sie fachlich relevant sind;
  Richtung, Bewegung und Animation zeigen tatsächliche Antworten statt bloßes
  Capability-Potenzial.
- Leere, beschädigte und nicht verfügbare lokale Daten werden getrennt und ohne
  automatisch erzeugte Demo-Profile dargestellt.
- Ein vorhandenes Basisprofil kann im Dashboard ausdrücklich als aktives
  Produktionsfundament gewählt werden; die validierten AppSettings werden
  dabei gespeichert und ein Storage-Ausfall sichtbar als Sitzungswahl
  behandelt. Technische Draft-Abweichungen sowie Anlage und Duplikation einer
  Familie liegen im Basisprofil-Schritt des Wizards. Eine bestehende Familie
  wird dort weiterhin nicht in-place bearbeitet.
- Alle Kategorie- und Materialgrafiken sind lokale dekorative SVG-React-
  Komponenten mit sichtbaren Textlabels; die Kartenraster wechseln responsiv
  von drei über zwei auf eine Spalte.

Umgesetzter Vertrag seit Prompt 10, erweitert in Prompt 13:

- Die Profilbibliothek verwaltet Assetprofile als Blätter der validierten
  Base→Category→Asset-Kette. Beim Löschen eines Assets werden Eltern nie
  kaskadierend entfernt. Prompt 13 ergänzt immutable Anlage und Duplikation
  eigenständiger Basisfamilien; bestehende Basen und ihre Kinder werden dabei
  nicht in-place geändert oder auf die neue Familie umgehängt.
- Suche, Kategorie-, Basisprofil- und Favoritenfilter sowie der
  Gruppierungsmodus liegen im appweiten Profile-Context/Reducer und bleiben
  beim Ansichtswechsel erhalten.
- Kategoriegruppen folgen der kanonischen Taxonomie. Technische Gruppen
  verwenden ausschließlich den von `resolveProfile()` neu berechneten
  Compatibility Key; sein internes Format wird in der UI weder angezeigt noch
  zerlegt.
- Karten zeigen wirksame, capability-relevante Werte. Figurenhöhe erscheint
  nur für skalierte Figuren; freie Artworks erhalten keine erzwungenen Tile-
  oder Weltkameradaten.
- Favorisieren verändert Organisationsmetadaten, nicht das fachliche
  `updatedAt`. Ein Duplikat erhält neue ID/Zeitstempel und verliert isolierte
  V1-Migrationsprovenienz, behält aber Elternreferenzen und technische
  Kompatibilität.
- Kandidatenbibliotheken passieren Zod und danach ausschließlich den
  Best-Effort-`writeProfileLibrary()`-Pfad mit Rollback-Versuch. Erst
  `status: 'ok'` aktualisiert den Bibliotheksgraphen und die Karten;
  Invalid-/Unavailable-/Teilwrite-Fehler aktualisieren nur die sichtbare
  Fehlermeldung und bleiben für die Fachdaten fail-closed.
- Löschen benötigt einen benannten Bestätigungsdialog. Nach erfolgreicher
  Löschung wird ein exakt passender flüchtiger Wizard-Profilintent verworfen,
  damit kein bereits entfernter Einstieg weitergetragen wird.

---

# 7. Geführter Wizard

## 7.1 Reihenfolge

1. Profil laden oder neues Asset
2. Hauptkategorie bestimmen
3. Untertyp bestimmen
4. Basisprofil wählen oder erstellen
5. globale technische Werte prüfen
6. Kategorieeditor öffnen
7. Stil / Setting / Material / Licht
8. Bewegung und Animation nur bei Capability
9. Review
10. speichern
11. Prompt erzeugen

## 7.2 React Hook Form

- Wizard-Draft wird formularnah über React Hook Form verwaltet.
- Schrittvalidierung über Zod Resolver beziehungsweise explizite Schemas.
- `trigger()` kann relevante Felder eines Schritts validieren.
- Dirty State sichtbar machen.
- Zurück darf gültige Daten nicht verlieren.
- Kategorie-Wechsel muss irrelevante Felder bereinigen oder bewusst in Rückkehrhistorie auslagern.

## 7.3 Umgesetzter Core-Vertrag seit Prompt 14

- `project`, `category`/`subtype`, `baseProfile`, `characterDetails` und die
  Capability-Schritte
  sind stabil und deklarativ konfiguriert; jeder besitzt Zod-Schema und
  RHF-Feldpfade. Die Reihenfolge ist
  `project → category/subtype → baseProfile → characterDetails, falls
  Character → Capability-Schritte`.
- Die generische `GuidedWizardEngine` besitzt keine projektspezifischen
  Renderingzweige. `WIZARD_CORE_FLOW` stellt Komponenten, Schemas, Feldpfade,
  Draft-Mapping, Zusammenfassung und optionale `isApplicable`-Prädikate bereit
  und ist die Erweiterungsgrenze. Der Flow-Kontext wird auch an die
  Draft-Projektion gereicht. Für gebündelte programmatische RHF-Änderungen
  erhält eine Step-Komponente `notifyProgrammaticChange()`; ein Aufruf startet
  nach allen `setValue()`-Operationen dieselbe Projektion, Dirty-Logik und
  Autosave-Strecke wie eine native Eingabe.
- Die Hauptkategorie wird vor dem Untertyp gewählt. Solange kein passender
  Untertyp vorliegt, bleibt die Klassifikation transient. Nach erfolgreicher
  Basisprofilwahl werden Richtungs-, Animations- und Tileability-Schritte
  ausschließlich über `resolveCapabilities()` eingeblendet. Eine nicht
  persistierbare Zwischenklassifikation liefert aus dem Draft-Mapping `null`,
  damit Vor-/Zurück-Navigation keine alte Auswahl zurückschreibt.
- Nach vollständiger Klassifikation ist die Basisprofilwahl verpflichtend.
  Der Schritt zeigt wirksame technische Werte jeweils mit Quelle und Lock.
  `characterHeight` erscheint nur bei `scaledCharacter`, Welt-Raster und
  Kamera nicht bei `freeComposition`, der Alpha-Rand nur bei transparentem
  Hintergrund.
- Entsperrte Abweichungen werden beim Draft-Mapping gegen die wirksame
  Base→Category-Vererbung verglichen. Nur nicht redundante und
  capability-relevante Werte werden als Asset-Level-Overrides gespeichert.
  Gesperrte Werte bleiben read-only;
  Konflikte bieten Abbruch, anderes Basisprofil, Duplikat oder neue kanonische
  Familie statt eines stillen Overrides.
- Ein Klassifikationswechsel übernimmt keine alten Assetantworten oder
  Profilprovenienz. Die Basisreferenz und fachlich relevante technische
  Overrides bleiben erhalten; `characterHeight` wird ohne `scaledCharacter`
  entfernt. Ein bestätigter Basiswechsel behält die Assetantworten, entfernt
  aber alte technische Overrides sowie nicht mehr passende Kategorieprofil-
  und Assetprovenienz.
- Neue und profilbasierte Starts sind zunächst flüchtig; Resume übernimmt nur
  die exakt angeforderte validierte Draft-ID.
- Mount, Profil-Hydration und Resume schreiben nicht. Gültige Änderungen werden
  nach 300 ms gespeichert, Navigation sichert den Zielschritt sofort.
- Der Session-Reducer unterscheidet aktive Version und strukturelle Baseline,
  sodass Dirty- und Persistenzstatus auch nach einem View-Wechsel wahr bleiben.
  Schema-ungültige sichtbare Core-Werte liegen separat und ausschließlich
  transient vor, bis sie wieder einen validen Draft ergeben.
- Fehlende Referenzen, beschädigte Daten und nicht verfügbarer Storage führen
  in einen sichtbaren Recovery-Zustand, ohne bestehende Daten zu löschen oder
  zu überschreiben.
- Profilstarts bewahren Kategorie, Untertyp, Antworten, Eltern-IDs, optionale
  Asset-Provenienz und den technischen Asset-Override-Snapshot.
- Resume und technische Zusammenfassung lösen diesen portablen Snapshot gegen
  aktuelle Elternprofile und Locks auf; die Quell-ID bleibt reine Provenienz.
- Ein vollständig klassifizierter Draft darf vor der Basisprofilwahl ohne
  Base-ID auf `wizard/profile` liegen. Resume führt ihn exakt zum
  `baseProfile`-Schritt zurück; vorhandene, aber fehlende Referenzen bleiben
  Recovery-Fehler.
- Neue und duplizierte Basisfamilien werden erst nach expliziter Bestätigung
  als vollständiger, Zod-validierter Profilgraph über den Provider
  persistiert. Erst ein erfolgreicher Write übernimmt ihre ID und Werte in den
  Draft. Ein Fehler dieses Graph-Writes lässt Bibliothek, bestehende Base-ID
  und Editorwerte unangetastet sichtbar. Scheitert erst der nachfolgende
  Draft-Autosave, bleibt die bereits angelegte Familie erhalten und die
  sichtbare Sitzungsänderung wird als ungesichert gemeldet.
- Der Character-/NPC-Detail-Editor ist ein eigener Fachschritt direkt nach der
  Basisprofilwahl. Er erscheint nur für die Hauptkategorie `character` und
  gruppiert Identität, Körper, Gesicht, Kleidung, Ausrüstung, Material,
  Palette, Ausdruck und Silhouette. NPC-Kontextfelder sowie humanoide
  Kleidungsgruppen sind zusätzlich nach Untertyp gegated.
- Character-Felder bleiben vollständig in RHF und laufen über dieselbe
  Draft↔Form-Projektion, Dirty-Erkennung, 300-ms-Autosave- und Resume-Strecke.
  Kategorie- oder Untertypwechsel entfernen alte Character-Antworten; ein
  bestätigter Basiswechsel erhält sie. Mount, Profil-Hydration und Resume
  bleiben schreibfrei.
- Ein ausdrücklich geleertes, vom Kategorieprofil geerbtes Character-Feld
  löst dessen Verknüpfung im Draft. Die Projektion materialisiert dabei alle
  übrigen wirksamen Character- und Technikwerte relativ zur Base; entfernte
  Richtungen oder Animationen werden beim Resume nicht wiederhergestellt.
- Die Figurenhöhe wird aus der wirksamen Profilkette gelesen, im Fachschritt
  read-only mit Base-/Category-/lokaler Quelle und Lock-Status angezeigt und
  nicht in den Character-Antworten dupliziert.
- Richtung bleibt ein eigener, ausschließlich bei `directional` sichtbarer
  4/8-Schritt. Animation bleibt unabhängig davon und speichert ausgewählte
  Aktionen als eindeutige, kanonisch sortierte `animationActions` mit jeweils
  1 bis 8 Frames; Walk startet bei 5. Alte Schema-V2-Werte
  `animationAction`/`framesPerDirection` werden gelesen, neue UI-Schreibvorgänge
  erzeugen nur das kanonische Modell.
- Live-Zusammenfassung und Dashboard-Aktivitätsprojektion zeigen die
  tatsächliche Character-Rolle, Richtungszahl und Aktionen mit Frames statt
  bloßer Capability-Potenziale.
- Prompt 15 ergänzt als nächste Phase den Moving-Object-Editor. Prompt 14
  enthält weder Prompt Engine beziehungsweise Review-/Output-Erzeugung noch
  In-place-Mutation oder Reparenting einer bestehenden Basisfamilie.

---

# 8. Capability-System

Pflicht-Capabilities:

```ts
type AssetCapability =
  | 'movable'
  | 'directional'
  | 'animated'
  | 'tileable'
  | 'gridBound'
  | 'transparent'
  | 'scaledCharacter'
  | 'footprint'
  | 'wearable'
  | 'modular'
  | 'freeComposition';
```

Die UI leitet Fragen aus Capabilities ab. Keine verstreuten `if (assetType === ...)`-Sonderfälle als Hauptarchitektur.

## Zentrale Regel

**Vier oder acht Richtungen dürfen nur angeboten werden, wenn `directional === true`.**

`animated` und `directional` sind getrennt.

Beispiele:

| Asset | directional | animated |
|---|---:|---:|
| NPC läuft | ja | ja |
| Tier läuft | ja | ja |
| Wagen fährt | ja | optional |
| schwebender Kristall pulsiert | nein | ja |
| Tür öffnet | nein | ja |
| Baum bewegt sich im Wind | nein | ja |
| Holztextur | nein | nein |

---

# 9. Profilmodell und Vererbung

V2 besitzt drei Ebenen:

```text
BaseProfile
  ↓
CategoryProfile
  ↓
AssetProfile
```

## 9.1 BaseProfile

Globale technische Produktionsfamilie. Enthält mindestens:

- `id`
- `name`
- `iconId`
- `pixelDensity`
- `styleProfile`
- `tileSize`
- `characterHeight?`
- `perspectiveType`
- `cameraAngle`
- `cameraDirection`
- `projectionType`
- `outlineStyle`
- `paletteMode`
- `backgroundMode`
- `alphaPadding`
- `nearestNeighbor`
- `lightingDefaults`
- `locks`

Der Prompt-13-Schritt legt eine Familie neu aus kanonischen Defaults an oder
dupliziert eine bestehende Familie einschließlich ihrer vollständigen Werte und
Locks. Er bearbeitet keine bereits persistierte Familie in-place und hängt
deren Kinder nicht um. Eine weitergehende globale Bestandsverwaltung bleibt
eine eigene spätere Produktgrenze.

## 9.2 CategoryProfile

Wiederverwendbare Kategorieparameter, z. B. „NPC 80px“, „Holztexturen 32px“, „Winterbäume“.

## 9.3 AssetProfile

Konkretes gespeichertes Profil für einen Händler, Baum, Materialtile usw.

## 9.4 Locks

Ein gelockter Base-Wert darf im Kind nicht überschrieben werden. Die UI bietet stattdessen:

- Änderung abbrechen
- Basisprofil duplizieren
- neues Basisprofil erstellen
- Entwurf bewusst auf ein anderes Basisprofil wechseln

Der wirksame Wert bleibt dabei sichtbar und nennt seine Quelle als Basisprofil,
Kategorieprofil oder lokalen Entwurf. Bei entsperrten Feldern entsteht kein
Override, wenn der Formularwert dem geerbten Wert entspricht.

## 9.5 Compatibility Key

Deterministisch aus technisch relevanten Parametern, z. B.:

```text
pf2-compat-v1__modern-hd__tile-32__char-80__three-quarter-60__orthographic__outline-soft-selective__...
```

Nur relevante Werte einbeziehen. `characterHeight` darf z. B. bei reinen Texturen nicht künstlich die Kompatibilität trennen.

Das Format ist intern versioniert und für die UI undurchsichtig. Gespeicherte
Schlüssel werden aus den wirksamen Werten neu berechnet; die vollständige
kanonische Dimensionsreihenfolge steht im Abfragekatalog.

---

# 10. Zod-Schemas

Zod ist an allen Daten-/Vertrauensgrenzen verbindlich.

Benötigte Schemas:

- `BaseProfileSchema`
- `CategoryProfileSchema`
- `AssetProfileSchema`
- `AppSettingsSchema`
- `WizardDraftSchema`
- kategoriespezifische Schemas
- `ExportBundleSchema`
- V1-Import-/Migrationsschema

Persistierte oder importierte Daten beginnen als `unknown`.

Schema und TypeScript-Typ sollen nicht unabhängig auseinanderlaufen. Wenn möglich:

```ts
export const BaseProfileSchema = z.object({ /* ... */ });
export type BaseProfile = z.infer<typeof BaseProfileSchema>;
```

---

# 11. State-Management

Startarchitektur: React Context + Reducer.

Empfohlene Trennung:

- `SettingsContext`
- `ProfileContext`
- `WizardContext` nur für appweiten Draft-/Navigationszustand

Nicht jeder Eingabewert gehört in Context; React Hook Form bleibt Eigentümer des Formularzustands.

Reducer-Aktionen sind typisierte discriminated unions.

---

# 12. Persistenz, Import und Export

V2-Namespaces:

```text
pixelforge:v2:settings
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:draft
pixelforge:v2:migration-backup
```

Pflicht:

- `schemaVersion: 2`
- stabile IDs unabhängig vom Namen
- sichere Zod-Validierung
- V1-Backup vor Migration
- JSON-Roundtrip
- einzelne Profile exportieren
- Profilpakete exportieren
- Importkonflikte sichtbar behandeln
- korrupte localStorage-Werte dürfen die App nicht crashen

IndexedDB ist nicht Teil des V2-Kerns.

Implementierter Infrastrukturvertrag:

- `src/services/storageAdapter.ts` kapselt den einzigen direkten
  Browser-`localStorage`-Zugriff hinter einem injizierbaren `KeyValueStorage`.
- Profil-Namespaces sind versionierte Collection-Envelopes und werden nur als
  vollständige, referenziell gültige Bibliothek geschrieben.
- `src/services/profileTransfer.ts` validiert JSON-Pakete erst strukturell mit
  Zod und danach fachlich mit dem Profilresolver. Ein gleicher ID/Payload ist
  ein No-op; ein abweichender Payload bleibt bis zur expliziten
  `replaceExisting`-Entscheidung ein sichtbarer Konflikt.
- Profilimporte geben mitgelieferte App-Einstellungen und Wizard-Drafts als
  `workspaceData` an den Aufrufer zurück. Sie werden nicht still in den
  laufenden UI-Zustand übernommen.

---

# 13. Spezialeditoren

## 13.1 Character / NPC

Fragen mindestens:

- Rolle / Beruf
- Alter
- Körperbau
- Figurenhöhe aus Basisprofil
- Haare / Frisur / Bart
- Hut / Kapuze / Helm
- Schal / Kragen
- Oberbekleidung
- Unterbekleidung
- Schuhe
- Gürtel / Taschen
- Accessoires
- Ausrüstung / Werkzeug
- Materialmix
- Farbpalette
- Ausdruck
- klare Silhouette
- Richtungen nur bei `directional`
- Animationen nur bei `animated`
- Idle/Walk/Run/Attack/Use/Talk nach Auswahl
- Frames pro Aktion

Umgesetzt seit Prompt 14:

- `src/domain/characters/` veröffentlicht die stabilen Auswahlkataloge,
  NPC-/Humanoid-Guards, Aktionsreihenfolge und Frame-Defaults ohne React.
- `CharacterAnswersSchema` erweitert den bestehenden Character-Vertrag strikt
  und additiv um optionale, begrenzte Detailfelder. Die Figurenhöhe gehört
  bewusst nicht zu diesen Antworten.
- `src/features/character-editor/` rendert den Detail- und den separaten
  Animationseditor; der Wizard bindet den Detailteil direkt nach dem
  Basisprofil ein.
- Das neue persistierte Aktionsmodell ist
  `animationActions: [{ action, frames }]`. Jede Aktion ist eindeutig und hat
  1 bis 8 Frames; die kanonische Domainreihenfolge macht die Ausgabe
  deterministisch. Bestehende Ein-Aktions-Daten bleiben nur als Lesepfad
  erhalten.
- Die Auswahl einer Ausgabeart, Promptmodule und der Output Workspace bleiben
  Gegenstand späterer Prompts.

## 13.2 Moving Object

- Objektklasse
- Bewegungsart
- Anker / Footprint
- directional ja/nein aus Untertyp
- 4/8 Richtungen nur wenn directional
- Animationsphasen optional
- Rollen / Gleiten / Schweben / Laufen usw.

## 13.3 Static Object

- Funktion
- Material
- Größe / Footprint
- Zustand
- Varianten
- optional Animation ohne Directional-Zwang

## 13.4 Texture / Material

- Material
- Verwendung: Boden/Wand/Dach/Oberfläche
- seamless ja/nein
- Tilegröße
- Strukturgrad
- Zustand
- trocken/nass/vereist usw.
- Oberflächenrichtung
- neutrale oder kontextuelle Beleuchtung
- keine Figuren- oder Richtungsfragen

## 13.5 Nature / Tree

- Pflanzentyp
- Art
- Klima
- Saison
- Stamm
- Krone
- Wurzeln
- Moos/Pilze/Schnee/Ranken
- Standfläche
- optionale Windanimation
- keine Richtungen für normalen Baum

## 13.6 Building

- Typ / Nutzung
- Größe / Footprint
- Stockwerke
- Material
- Dach
- Fassade
- Türen / Fenster
- Zustand
- bewohnt / verlassen
- Mapping-Kompatibilität
- Beleuchtung

## 13.7 Tileset

- Tiletyp
- Grid
- Übergänge
- Seam-Regeln
- Innen-/Außenecken
- Kanten
- Wiederholbarkeit
- Varianten

## 13.8 Item / Equipment

- Itemklasse
- Material
- Zustand
- Seltenheits-/Bedeutungsgrad ohne erzwungene UI-Farbe
- Freistellung
- Größen-/Lesbarkeitsregeln

## 13.9 Artwork

- Artworktyp
- Motiv
- Komposition
- Format
- Hintergrund
- Fokus
- Lichtdramaturgie
- Tile-/Sprite-Regeln nur bei ausdrücklicher Aktivierung

---

# 14. Prompt Engine 2.0

Pure TypeScript-Engine. Keine React-Imports.

Modulare Bausteine:

```text
baseProfile
styleProfile
category
subject
materials
setting
lighting
motion
animation
composition
negativeRules
technicalSpec
```

Ausgaben bleiben:

1. Hauptprompt
2. Negativprompt
3. technische Spezifikation
4. kombinierte Ausgabe

Irrelevante Kategoriefelder dürfen nicht in die Ausgabe gelangen.

### Stilabgrenzung

Keine direkten Namen bestehender Spiele, Marken, Figuren oder Künstler in generierten Prompts. Beschreibe ausschließlich allgemeine Eigenschaften.

---

# 15. Lichtlogik

Standardlogik:

| Kontext | Default |
|---|---|
| draußen, Tag | neutrales Tageslicht |
| draußen, Nacht | neutrales bis leicht kühles Nachtlicht |
| beleuchteter Innenraum | warmes lokales Licht |
| dunkler Innenraum | neutrales schwaches Restlicht |
| düster/unheilvoll | diffuses gedämpftes Licht |

Richtungssets behalten Weltlicht und Kamera konstant.

---

# 16. Design und UX

## Dashboard

- klare Hero-Fläche
- Kategorie-Icons
- Profilkarten
- Favoriten
- letzte Profile
- Filterchips
- Theme-Umschalter

## Wizard

- Fortschrittsanzeige
- Zurück / Weiter
- verständliche Pflichtfeldfehler
- jederzeit sichtbare technische Zusammenfassung
- autosave-fähig
- Resume

## Output Workspace

- Tabs oder klar getrennte Panels
- Kopieren
- TXT/JSON Export
- Profil speichern
- Warnungen vor technischen Konflikten

---

# 17. Tests

## Domain / Unit

Mit Vitest:

- Capability-Auflösung
- Richtungsregel
- Animation-vs-Direction
- Profilvererbung
- Locks
- Compatibility Key
- Zod-Schemas
- Character-Antwortgrenzen, eindeutige Aktionslisten und Legacy-Lesbarkeit
- Character-Draft↔RHF-Roundtrip sowie Bereinigung bei Klassifikationswechseln
- Migrationslogik
- Promptmodule
- Canvas-/Frame-Metriken
- Import/Export

## React / Integration

Mit React Testing Library + user-event:

- Dashboard-Kategorieauswahl
- Wizard vor/zurück
- Kategorieabhängige Felder
- NPC 8-Direction sichtbar, Holztextur nicht
- Character-Detailstep, NPC-/Humanoid-Gating und geerbte/gesperrte Figurenhöhe
- mehrere Character-Aktionen mit jeweils 1–8 Frames und Walk-Default 5
- Character-Autosave, schreibfreie Hydration/Resume und Live-Zusammenfassung
- Theme-Wechsel
- Profil laden/speichern
- Lock-Konfliktworkflow
- Output erzeugen/kopierbar anzeigen

Keine Tests, die interne Implementierungsdetails statt Nutzerverhalten prüfen.

---

# 18. Build und Scripts

Ziel-`package.json` mindestens:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest",
    "test:run": "vitest run",
    "verify": "npm run typecheck && npm run test:run && npm run build"
  }
}
```

`dist/` nie manuell bearbeiten.

---

# 19. V1→V2-Migrationsstrategie

1. Legacy-Storage-Keys inventarisieren.
2. Legacy-Promptdefaults als Fixtures sichern.
3. V2-Schemas implementieren.
4. Beide V1-Storagewerte als exakte Rohstrings einlesen.
5. Einen `prepared`-Backupdatensatz **vor** `JSON.parse` und vor jedem
   Profilwrite speichern; V1-Keys niemals löschen oder verändern.
6. Autosave und Presets unabhängig als `unknown` validieren und defensiv
   normalisieren, damit eine korrupte Quelle gültige Quellen nicht blockiert.
7. Werte deterministisch in Base/Category/AssetProfile transformieren;
   Capabilities ausschließlich aus V2-Kategorie und -Untertyp berechnen.
8. `outputMode` nur als gewünschte Ausgabe interpretieren und 4/8 Richtungen
   ausschließlich bei `directional=true` übernehmen.
9. Alle V2-Schemas, Referenzen, Locks und neu berechneten Compatibility Keys
   validieren und erst danach die drei Profil-Namespaces schreiben.
10. Den Backupstatus zuletzt auf `completed` setzen. Ein liegengebliebener
    `prepared`-Datensatz wird mit denselben IDs wiederaufgenommen.

Ein `completed`-Backup ist der autoritative Migrationsmarker und macht weitere
Startläufe zum No-op. Die normalisierten V1-Daten und Transformationshinweise
bleiben ausschließlich im `legacyData` des Assetprofils; sie sind keine
Prompt-Eingaben. Manuelle V1-Dateiimporte werden über dieselbe pure
Transformation vorbereitet, gehören aber nicht zur automatischen
localStorage-Startmigration.

---

# 20. Definition of Done V2

V2 ist releasefähig, wenn:

- React/TypeScript/Vite die einzige aktive V2-Apparchitektur ist,
- TypeScript strict fehlerfrei ist,
- Dashboard und Light/Dark/System funktionieren,
- Profilhierarchie inklusive Locks funktioniert,
- Profile korrekt kategorisiert und gruppiert werden,
- Wizard nur relevante Fragen zeigt,
- Charakter-/NPC-Editor vollständig ist,
- Textur/Natur/Gebäude/etc. eigene Editoren besitzen,
- 8 Richtungen ausschließlich bei directional Assets angeboten werden,
- alle vier Prompt-Ausgaben funktionieren,
- V1-Daten migrierbar sind,
- JSON-Import/Export funktioniert,
- `npm run verify` grün ist,
- Accessibility-/Responsive-Kernprüfung bestanden ist,
- und die Legacy-V1-UI erst nach bestätigter Parität entfernt wurde.
