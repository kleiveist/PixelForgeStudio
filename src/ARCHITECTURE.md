# PixelForge Prompt Studio — Source-Architektur

## Produktgrenze

Der produktive Arbeitsbaum enthält ausschließlich das **PixelForge Prompt
Studio V2**. Die App erzeugt lokal vier textuelle Ausgaben für Pixelart-Assets:
Hauptprompt, Negativprompt, technische Spezifikation und kombinierte Ausgabe.

Angaben zu Bewegung, Aktionen, Frames und Richtungssets sind Fachwerte eines
Promptprofils. Sie beschreiben die gewünschte Bildproduktion; sie bilden keine
eigene Projektverwaltung oder Render-Engine. Das frühere Animation Studio mit
Workspace, PNG-Part-Import, Rigging, Rendering, IndexedDB, Worker und
Engineexporten ist nicht Teil dieser Architektur.

Unverändert stabil bleiben:

- Prompt-Schema und Exportformat mit `schemaVersion: 2`,
- Export-Identifier `PixelForge Prompt Studio`,
- die sechs `pixelforge:v2:*`-localStorage-Namespaces,
- V1→V2-Promptmigration und synthetische Legacy-Fixtures,
- Produktdefaults, Capability-Regeln und Profilvererbung.

## Laufzeitfluss

```text
main.tsx
  └─ V1-Migrationsprüfung und Browseradapter
     └─ App
        ├─ SettingsProvider
        ├─ ProfileLibraryProvider
        ├─ NavigationProvider
        ├─ WizardSessionProvider
        └─ StudioShell
           └─ aktive Prompt-Ansicht
```

`main.tsx` ist die Browser-Composition-Root. Vor dem React-Start führt sie die
idempotente, backup-gesicherte V1→V2-Migration aus und erstellt die schmalen
Browseradapter. Die React-Komponenten erhalten Persistenz- und Downloadports
injiziert; sie erzeugen keine zweite Speichergrenze.

`app/App.tsx` ordnet die Provider. `app/StudioShell.tsx` besitzt Skip-Link,
Header, Prompt-Navigation, Themeumschaltung, Hauptbereich, Seitentitel,
Fokusübergabe und Footer. `app/AppShell.tsx` verbindet die fünf Ansichten:

1. `dashboard`
2. `profiles`
3. `wizard`
4. `output`
5. `settings`

## Verzeichnisverantwortung

Der Produktionsbuild trennt nur externe Vendor-Pakete explizit. Fachkataloge,
Schema-Konstanten und Features werden nicht künstlich auf manuelle Chunks
verteilt: dadurch entstehende Importzyklen können vor dem React-Start ungültige
Enum-Schemas erzeugen. Playwright prüft den gebauten Code und in CI zusätzlich
den tatsächlichen NGINX-Container. Der größere initiale App-Chunk ist ein
bekannter Performance-Tradeoff, kein Anlass zum Ausblenden der Buildwarnung.

- `app/`: Composition, Shell, Viewauswahl und sichtbare Navigationsmetadaten.
- `components/`: wiederverwendbare UI-Bausteine, Prompt-Links, Themecontrol
  und lokale SVG-React-Icons.
- `config/`: zentrale Prompt-Studio-Marke und stabiler Export-Identifier.
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik.
- `features/`: React-Oberflächen und schmale UI-Projektionen je Fachbereich.
- `schemas/`: Zod-Verträge für alle persistierten und importierten Daten.
- `services/`: Browser-, Storage-, Navigation-, Transfer- und Migrationsports.
- `store/`: Context-/Reducer-Zustände für Navigation, Settings, Profile und
  Wizardsitzung.
- `styles/`: globale semantische Tokens und globale Zugänglichkeitsregeln.
- `test/`: gemeinsame Testadapter und ausschließlich synthetische
  Legacy-V1-Fixtures.

## Pure Domain

Die Verzeichnisse unter `domain/` dürfen React, DOM und Browserstorage nicht
importieren.

- `assets/` besitzt Kategorien, Untertypen und die zentrale
  Capability-Auflösung. Nur richtungsabhängig bewegliche Assets erhalten
  Richtungssets; Animation und Richtung bleiben getrennte Fähigkeiten.
- `profiles/` löst Base→Category→Asset, Locks, Provenienz, Normalisierung und
  Compatibility Keys deterministisch auf. Gesperrte Basiswerte können nicht
  still überschrieben werden.
- `prompt-engine/` baut ausschließlich aus einem erfolgreich aufgelösten
  Profil die vier Produktionsausgaben. Die Module für Motiv, Kategorie,
  Materialien, Licht, Bewegung und Animation sind Formatierer, keine UI- oder
  Renderinglogik.
- `characters/`, `moving-objects/`, `textures/`, `nature/`,
  `static-objects/`, `buildings/`, `tilesets/`, `items/` und `artworks/`
  halten Kataloge, subtype-gesteuerte Guards und kanonische Fachwerte.
- `guided-answers/` besitzt die deutschsprachigen Auswahlvorgaben für
  kreative Textfelder.
- `json/` stellt kanonische Serialisierung und semantische Vergleiche bereit.
- `legacy-v1/` und `migration/` existieren nur für deterministische
  Promptdatenmigration und Regression.
- `navigation/` parst und serialisiert ausschließlich Prompt-Routen.
- `theme/` löst `system`, `light` und `dark` ohne Browserabhängigkeit auf.

## Schema- und Persistenzgrenze

Importdaten beginnen als `unknown` und werden vor der Nutzung mit Zod
validiert. Die öffentlichen Schemas werden über `schemas/index.ts` exportiert.
Kategorieantworten sind additive Teile von Schema V2; irrelevante Antworten
werden beim Kategorie- oder Untertypwechsel entfernt und gelangen nicht in
die Prompt-Engine.

Die lokale Persistenz verwendet genau diese Namespaces:

```text
pixelforge:v2:settings
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:draft
pixelforge:v2:migration-backup
```

`services/storageAdapter.ts` ist die einzige reguläre localStorage-Grenze.
Reads liefern strukturierte Zustände wie `valid`, `empty`, `invalid` oder
`unavailable`. Die Profilbibliothek wird als validierter Gesamtgraph gelesen
und geschrieben; fehlgeschlagene Teilwrites werden nach Möglichkeit
zurückgerollt. Komponenten greifen nicht direkt auf localStorage zu.

`services/profileTransfer.ts` validiert JSON-Import und -Export. Bestehende
Settings V2 dürfen weiterhin die ehemaligen additiven Felder `startStudio`
und `animationStartView` enthalten. Die Felder werden nur aus
Kompatibilitätsgründen gelesen und zurückgegeben; sie besitzen keine sichtbare
Einstellung und keine Laufzeitwirkung. `startView` ist die einzige wirksame
Startansicht.

## Navigation

Kanonische URLs haben die Form:

```text
?studio=prompt&view=<dashboard|profiles|wizard|output|settings>
```

`domain/navigation/studioRoute.ts` besitzt die pure Parse- und
Serialisierungsgrenze. Alte Prompt-Links mit `?view=…` werden gelesen und per
`replaceState` kanonisiert; `review` wird auf `output` abgebildet. Nicht mehr
gültige Dach-, Projekt- oder Modulrouten werden auf die konfigurierte
Prompt-Startansicht repariert. Fremde Queryparameter bleiben erhalten,
kontrollierte Parameter werden eindeutig geschrieben.

`services/navigationAdapter.ts` kapselt History und `popstate`.
`store/navigation/NavigationProvider.tsx` hält die aktive typisierte Route.
Die Shell verschiebt nach einem Ansichtswechsel den Fokus ohne Scrollsprung in
den Hauptbereich.

## State-Verantwortung

- `SettingsProvider` hält validierte AppSettings und die wirksame
  Themepräferenz. Persistenz erfolgt nur nach einer Nutzeraktion.
- `ProfileLibraryProvider` hält den validierten Profilgraphen, Filter und
  Mutationsstatus. Anlage, Duplikation und Löschen laufen über pure Kandidaten
  und den gemeinsamen Storageport.
- `WizardSessionProvider` hält Hydrationswunsch, aktive Draftreferenz,
  Dirty-Baseline, Rohwert-Snapshot und Persistenzstatus über Ansichtswechsel.
- React Hook Form besitzt sichtbare Formularwerte; Zod besitzt deren
  Validierung; lokaler Darstellungsstate bleibt in der jeweiligen Komponente.

## Feature-Grenzen

`features/wizard/` stellt den deklarativen, capability-gesteuerten Ablauf
zusammen. Kategorie und Untertyp kommen zuerst, danach Basisprofil und nur die
relevanten Fachschritte. Gültige Änderungen werden verzögert gespeichert;
bewusste Schrittwechsel werden sofort persistiert. Hydration und Resume
schreiben nicht von selbst.

Die Fach-Editoren bilden ausschließlich ihre jeweilige Antwortstruktur in
React Hook Form ab. Technische Werte wie Tilegröße oder Figurenhöhe bleiben in
der Profilkette, wenn sie dort bereits die Quelle der Wahrheit sind.

`features/review-output/` löst den vollständigen Profilgraph fail-closed auf
und ruft anschließend `buildPromptPackages()` auf. Kopieren und Markdown-
Download verwenden `services/outputWorkspaceAdapter.ts`; der Profilstand wird
als validiertes V2-JSON übertragen. Strukturierte Lock-Konflikte müssen vor
einer neuen Ausgabe bewusst behoben werden.

`features/settings/` verwaltet Sprache, Theme, Prompt-Startansicht,
Migrationsdiagnostik und den vollständigen Workspace-JSON-Transfer.

## Öffentliche Modulgrenzen

`i18n/index.ts` veröffentlicht `LocaleProvider`, `useI18n`, die puren
Übersetzungsfunktionen und `Locale`/`MessageKey`. Settings liefert den Locale-
Context. React verwendet explizite Übersetzungsaufrufe; Domain und Persistenz
bleiben sprachunabhängig. Vertrag: [Lokalisierung](../docs/LOCALIZATION.md).

Neue Aufrufer importieren nach Möglichkeit aus den jeweiligen `index.ts`:

- `domain/<bereich>/index.ts` für pure Fachlogik,
- `schemas/index.ts` für validierte Datenverträge,
- `services/index.ts` für Infrastrukturports,
- `store/<bereich>/index.ts` für Provider- und Reducergrenzen,
- `features/<bereich>/index.ts` für zusammensetzbare Featureoberflächen.

Abhängigkeiten zeigen von React in Richtung Domain und Adapter. Domaincode
darf nicht zurück in `features/`, `store/`, `services/` oder `app/` zeigen.

## Tests und Release-Gate

- Vitest prüft pure Domain-, Schema-, Adapter- und Reducerlogik.
- React Testing Library prüft sichtbares Nutzerverhalten, Fokus, Hydration,
  Autosave, Fehlerzustände und Kategoriegrenzen.
- Playwright-Smokes prüfen alle fünf Prompt-Routen, alte Linkformate,
  reparierte ausgemusterte URLs, Tastaturnavigation, Responsive Reflow und
  Reduced Motion in Chromium und Firefox.
- `npm run verify` fasst Strict-Typecheck, Testlauf und Produktionsbuild
  zusammen.
- `git diff --check` bleibt das abschließende Whitespace-Gate.

Aktuelle Datenverträge: [Kompatibilität](../docs/COMPATIBILITY.md).
Bedienvertrag: [Accessibility](../docs/ACCESSIBILITY.md).
Der [Dokumentationsindex](../docs/index.md) führt zu den verbindlichen Quellen;
historische Implementierungsanweisungen sind keine öffentliche Modulgrenze.
