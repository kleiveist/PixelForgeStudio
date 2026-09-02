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
