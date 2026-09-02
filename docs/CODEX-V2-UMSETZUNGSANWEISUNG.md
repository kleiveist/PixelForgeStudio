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
- `pixelStyle`
- `tileSize`
- `characterHeight?`
- `perspective`
- `cameraAngle`
- `projection`
- `outlineStyle`
- `paletteMode`
- `backgroundMode`
- `lightingDefaults`
- `locks`

## 9.2 CategoryProfile

Wiederverwendbare Kategorieparameter, z. B. „NPC 80px“, „Holztexturen 32px“, „Winterbäume“.

## 9.3 AssetProfile

Konkretes gespeichertes Profil für einen Händler, Baum, Materialtile usw.

## 9.4 Locks

Ein gelockter Base-Wert darf im Kind nicht überschrieben werden. Die UI bietet stattdessen:

- Änderung abbrechen
- Basisprofil duplizieren
- neues Basisprofil erstellen
- Asset bewusst auf anderes kompatibles Profil verschieben

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
4. V1-Config in `unknown` einlesen.
5. V1-Form validieren / defensiv normalisieren.
6. Backup schreiben.
7. Werte in Base/Category/AssetProfile transformieren.
8. V2-Schemas validieren.
9. erst danach V2 speichern.
10. Migrationsstatus markieren.

Die Migration muss idempotent sein oder zuverlässig erkennen, dass sie bereits ausgeführt wurde.

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
