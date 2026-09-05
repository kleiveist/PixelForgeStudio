<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 33 — Versionierte Zod-Schemas für Animationsprojekte

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Definiere das neue Animationsprojekt-, Part-, Kit- und Bundleformat als strikte
Zod-Verträge der Version 1. Persistierte und importierte Werte beginnen als
`unknown`.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 34.

UMSETZUNG
1. Lege getrennte Schema-Dateien an:
   - `animationProject.schema.ts`
   - `animationPartAsset.schema.ts`
   - `animationKit.schema.ts`
   - `animationBundle.schema.ts`
2. Definiere einen eigenen stabilen Versionsvertrag:
   - `schemaVersion: 1`
   - `formatVersion: 1`
   - `application: ANIMATION_EXPORT_APPLICATION_ID`
3. Erzeuge Zod-Primitives für:
   - finite Pixelkoordinaten
   - positive Dimensionen
   - Frameprofile
   - TrimRect innerhalb SourceSize
   - SourceAnchors
   - Direction, Slot, Joint und MirrorPolicy aus der Domain
4. Definiere `AnimationPartAssetSchema` ohne Blobinhalt. Es enthält `blobId`,
   SourceSize, TrimRect, Slot, Richtung, Anker und Spiegelregel.
5. Definiere `AnimationProjectSchema` mit:
   - stabiler Projekt-ID
   - Name und Zeitstempel
   - Rig-ID und Frameprofil
   - DirectionSourceMode
   - Partzuweisungen
   - Clips
   - Frame-/Direction-Overrides
   - optionale Promptprofilreferenz
   - optionale Previewreferenz
6. Definiere `CharacterKitSchema` mit Partreferenzen und
   `rigCompatibilityKey`.
7. Definiere `AnimationProjectBundleManifestSchema` und den übergeordneten
   validierten Bundlegraphen.
8. Implementiere Cross-Field-Validierung:
   - Part-IDs innerhalb eines Projekts eindeutig
   - Clip-IDs eindeutig
   - Walk-Clip im MVP mit 8 Frames
   - FrameOverride nur für vorhandenen Clip/Frame/Richtung
   - Required-Source-Regeln nicht als harte Vollständigkeit beim Draft, aber
     als separate Produktionsvalidierung
   - SourceAnchors innerhalb Originalbildgrenzen
   - TrimRect innerhalb SourceSize
   - Referenzierte Part-/Blob-IDs im Bundle vorhanden
9. Begrenze Texte, Arrays, Dimensionen und Overrides anhand der
   Datenformatspezifikation.
10. Leite TypeScript-Typen via `z.infer` ab.
11. Parsefunktionen geben kanonische readonly Daten zurück, entsprechend den
    bestehenden Projektkonventionen.
12. Exportiere die neuen Schemas über `src/schemas/index.ts`.

ARCHITEKTUR- UND DATENREGELN
- keine PNG-Base64-Daten in Projektschemas
- kein Blob in JSON-Schemas
- Prompt-Schema V2 bleibt unabhängig
- unbekannte Keys werden abgelehnt
- unbekannte neuere Versionen werden abgelehnt
- kein stilles Coercing beliebiger Strings zu Zahlen
- IDs sind stabil und nicht vom Namen abhängig
- Produktionswarnungen und Schemafehler bleiben getrennt

TESTS
- vollständiger gültiger Projektfall
- minimaler Draft
- ungültige Version/Application/Kind
- unbekannte Keys
- doppelte IDs
- ungültige Direction/Slot
- Anker außerhalb SourceSize
- TrimRect außerhalb SourceSize
- Walk mit falscher Framezahl
- Override auf ungültigen Frame
- fehlende Part-/Blob-Referenz im Bundle
- Grenzwerte der Array-/Textlimits
- `parseAnimationProject(unknown)`
- Prompt-V2-Schemas als Regression

NICHT TUN
- keine Persistenz implementieren
- keine `as AnimationProject`-Assertions an Importgrenzen
- keine SchemaVersion 3 für Promptdaten
- keine Bilder in JSON serialisieren
- keine Defaultwerte erfinden, die eine importierte unvollständige
  Projektquelle als produktionsfertig erscheinen lassen

DOKUMENTATION
Dokumentiere Schemas, Versionsgrenzen und Bundlegraph in
`src/ARCHITECTURE.md`. Ergänze PLANS.md, CHANGELOG.md und einen kurzen
Formatabschnitt unter `docs/`.

FERTIG, WENN
- alle Animationsmetadaten besitzen strikte V1-Schemas.
- Typen werden aus Zod abgeleitet.
- Bundlegraphen erkennen fehlende Referenzen.
- ungültige oder neuere Daten werden strukturiert abgelehnt.
- bestehende Prompt-Schemas bleiben vollständig grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧬 feat: add animation project schemas
```
