# V2 source architecture

- `app/`: bootstrap-nahe App-Komponenten und spätere Provider/Navigation
- `components/`: wiederverwendbare UI und lokale SVG-Icons
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik
  - `legacy-v1/`: namespaced compatibility port of the V1 defaults, state
    whitelist, prompt builder, validation, and frame/canvas metrics
- `features/`: Dashboard, Profile, Wizard, Editoren und Output als getrennte Features
- `schemas/`: Zod-Schemas und daraus abgeleitete Typen
- `services/`: Storage-, Import-, Export- und Migrationsadapter
- `store/`: Contexts, Reducer, Actions und Selectors
- `styles/`: globale semantische Tokens und Reset-/Grundregeln
- `test/`: gemeinsames Vitest-/Testing-Library-Setup

V1 liegt unverändert unter `legacy/v1/` und darf nur als Referenz,
Migrationsquelle und Regressionstest verwendet werden.

The public compatibility API is `domain/legacy-v1/index.ts`. It intentionally
reproduces historical V1 behavior, including stale but valid sheet-layout
values. New V2 rules build beside this namespace instead of silently changing
the migration reference.
