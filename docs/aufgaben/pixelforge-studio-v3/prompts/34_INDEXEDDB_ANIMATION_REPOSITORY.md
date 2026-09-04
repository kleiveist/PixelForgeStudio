<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 34 — IndexedDB-Repository für Projekte, Parts und PNG-Blobs

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Implementiere eine injizierbare asynchrone Persistenzschicht für
Animationsprojekte und Binärbilder. Bestehender Prompt-Storage bleibt
unverändert in localStorage.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 35.

UMSETZUNG
1. Definiere den öffentlichen Port `AnimationRepository` mit strukturierten
   Read-/Mutation-Resultaten.
2. Unterstütze mindestens:
   - Projekte listen/lesen/anlegen/schreiben/löschen
   - Part-Metadaten lesen/schreiben/löschen
   - Bildblob lesen/schreiben
   - Preview lesen/schreiben
   - Character Kits listen/lesen/schreiben/löschen
3. Implementiere einen Browseradapter auf nativer IndexedDB:
   - Datenbank `pixelforge-studio`
   - Version 1
   - Stores laut Datenformatspezifikation
   - sinnvolle Indizes für `updatedAt`, Slot und Richtung
4. Kapsle Open-/Upgrade-/Transaction-Fehler. Komponenten dürfen kein
   `IDBRequest` sehen.
5. Validiere Metadaten vor jedem Write mit den neuen Zod-Schemas.
6. Schreibe neue Part-Metadaten und zugehörigen Blob in einer gemeinsamen
   Transaktion.
7. Implementiere Projektduplikation mit neuen IDs und klarer Strategie für
   geteilte Part-/Blob-Referenzen. Bevorzugt werden unveränderliche
   Referenzen/copy-on-write statt Blobkopien.
8. Löschen eines Projekts darf geteilte Bilder nicht entfernen. Implementiere
   eine pure Referenzanalyse und eine explizite Garbage-Collection-Operation
   für tatsächlich unreferenzierte Daten.
9. Implementiere einen vollständigen In-Memory-Testadapter mit demselben Port.
10. Baue eine Repository-Factory, die bei fehlender IndexedDB ein
    `unavailable`-Resultat liefert statt beim Appstart zu crashen.
11. Stelle eine schmale `listProjectSummaries()`-Abfrage für Home und
    Projektübersicht bereit.
12. Dokumentiere Datenbankupgrades so, dass spätere Versionen additiv migrieren
    können.

ARCHITEKTUR- UND DATENREGELN
- kein direkter IndexedDB-Zugriff aus React-Komponenten
- keine Bilder in localStorage
- keine Base64-Konvertierung zur Persistenz
- Projektmetadaten werden als validierte Objekte gespeichert
- Browserfehler und Schemavalidierungsfehler sind unterscheidbar
- fehlgeschlagene Transaktion darf keinen halben Part hinterlassen
- Adapter bleibt testbar und austauschbar
- Prompt-V2-Storageadapter wird nicht erweitert oder umgedeutet

TESTS
- In-Memory CRUD
- Browser-Factory ohne IndexedDB
- Projekt anlegen/lesen/schreiben/löschen
- Part + Blob atomar
- invalides Projekt wird nicht geschrieben
- Transaktionsfehler lässt alten Stand erhalten
- Duplikation erzeugt neue Projekt-ID
- geteilte Blob-Referenz bleibt nach Löschen eines Projekts gültig
- Garbage-Collection findet nur unreferenzierte Blobs
- sortierte Project Summaries
- Upgradepfad Version 1
- bestehende localStorage-Tests unverändert

NICHT TUN
- keine UI oder Provider
- keine globale Singleton-Datenbank, die Tests kontaminiert
- keine direkte Nutzung von `window.indexedDB` außerhalb der Browserfactory
- keine unkontrollierte Löschung aller Daten bei Schemafehler
- kein Blob in JSON-Export an dieser Stelle
- keine neue große Storage-Bibliothek ohne dokumentierten Bedarf

DOKUMENTATION
Ergänze Technologie-Stack, `src/ARCHITECTURE.md`, PLANS.md und CHANGELOG.md
um IndexedDB als verbindlichen Animationsspeicher und um die Trennung zum
Prompt-Storage.

FERTIG, WENN
- asynchroner, injizierbarer Repository-Port ist vollständig implementiert.
- native IndexedDB und Memoryadapter folgen demselben Vertrag.
- Metadaten und Blobs werden korrekt getrennt.
- atomare Partwrites und sichere Referenzbereinigung sind getestet.
- Prompt-Storage bleibt unverändert.

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

Commit-Vorschlag: 💾 feat: add IndexedDB animation repository
```
