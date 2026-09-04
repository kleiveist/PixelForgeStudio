<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Zielstruktur `src/`

```text
src/
├── app/             # App bootstrap, providers, view routing
├── components/      # wiederverwendbare UI-Komponenten
├── domain/          # pure TS-Domain: profile, capability, prompt, migration types
├── features/        # dashboard, profiles, wizard, editors, output
├── schemas/         # Zod schemas and inferred types
├── services/        # storage/import/export adapters
├── store/           # Context + reducers + actions/selectors
├── styles/          # tokens.css, globals.css
└── test/            # test setup / shared test utilities
```

Feature-Beispiel:

```text
features/
└── character-editor/
    ├── components/
    ├── hooks/
    ├── characterEditor.schema.ts
    ├── characterEditor.types.ts
    ├── CharacterEditor.tsx
    └── CharacterEditor.test.tsx
```
