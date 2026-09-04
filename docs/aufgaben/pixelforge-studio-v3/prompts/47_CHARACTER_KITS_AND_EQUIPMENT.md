<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 47 — Wiederverwendbare Character Kits und Inventar-Ausrüstung

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Mache vollständige Figurensätze und einzelne Ausrüstungsteile
wiederverwendbar. Nutzer sollen wie in einem Inventar kompatible Körperteile,
Rüstungen, Waffen und Accessoires einsetzen und austauschen können.

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
   Prompt 48.

UMSETZUNG
1. Vervollständige die `CharacterKit`-Domain:
   - stabile Kit-ID
   - Name/Beschreibung
   - `rigCompatibilityKey`
   - DirectionSourceMode
   - PartAsset-Referenzen
   - Coverage-Zusammenfassung
   - Zeitstempel
2. Implementiere pure Kompatibilitätsprüfung zwischen Kit und Projekt.
3. `rigCompatibilityKey` berücksichtigt nur:
   - RigTemplateId
   - Frameprofil
   - Charakterhöhe
   - Anchor-/Slot-/Direction-Contract-Version
4. Implementiere Repositoryoperationen und Provider/Controller für:
   - Kit aus aktivem Projekt speichern
   - Kit laden
   - Kit duplizieren
   - Kit umbenennen
   - Kit löschen
   - Kit auf Projekt anwenden
5. Anwenden nutzt Referenzen/copy-on-write. Große Bildblobs werden nicht
   unnötig dupliziert.
6. Baue `CharacterKitLibraryView`:
   - Suche
   - Filter nach Rig/Abdeckung
   - Preview
   - Kompatibilitätsstatus
   - Öffnen/Anwenden/Duplizieren/Löschen
7. Teileinventar erhält echte Ausrüstungsinteraktion:
   - Slotkarte wählen
   - kompatible Assets anzeigen
   - Teil einsetzen
   - Teil entfernen
   - ersetzen
   - als eigenes PartAsset in Bibliothek belassen
8. Equipment-Slots:
   - Rüstung Torso/Schulter
   - Handschuhe/Boot-Overlay
   - Haare/Kopfbedeckung
   - Umhang
   - Waffe/Schild
   - Rücken-/Hüftobjekt
   - vier freie Accessoires
9. Freie Accessoires verlangen Attachment-Joint und Default-LayerGroup.
10. Beim Kitwechsel:
    - Projekt-Rig bleibt Eigentümer
    - inkompatible Kits werden blockiert
    - kompatible Partzuweisungen ersetzen kontrolliert
    - bestehende FrameOverrides werden geprüft; ungültige Slotdeltas werden
      vor Übernahme sichtbar bereinigt oder abgebrochen
11. Zeige Coverage- und Mirror-Status vor Anwendung.
12. Löschen eines Kits löscht keine von Projekten referenzierten Blobs.
13. Phase E wird mit einem Test abgeschlossen: zwei NPC-Kits verwenden
    denselben Walk-Clip und erzeugen unterschiedliche, gültige 64-Frame-Sets.

ARCHITEKTUR- UND DATENREGELN
- Kit ist ein Asset-/Referenzpaket, kein dupliziertes Projekt.
- Rig und Clip gehören weiter zum Projekt.
- Compatibility Key ist deterministisch und namenunabhängig.
- Blobsharing ist referenzsicher.
- Inventaraktionen besitzen Tastaturalternative.
- optionale Slots bleiben optional.
- Mirror-/Anchor-Status wird nicht durch Kitimport umgangen.

TESTS
- Kit speichern/laden/duplizieren/löschen
- Compatibility Key
- kompatibel/inkompatibel
- Anwenden mit Referenzen
- Overridekonflikt
- Equipment einsetzen/ersetzen/entfernen
- freies Accessoire ohne Attachment wird abgelehnt
- Kitdelete schützt Projektblobs
- Suche/Filter/Preview
- Tastaturbedienung
- zwei Kits, ein Clip, zwei 64-Frame-Sätze
- Phase-E-Regression aller Richtungen

NICHT TUN
- kein Online-Marktplatz
- keine Cloudbibliothek
- keine Bilder duplizieren, wenn Referenz genügt
- Rig nicht heimlich durch Kit ersetzen
- inkompatible Kits nicht mit Warnung trotzdem anwenden
- keine unkontrollierte Overrideübernahme
- keine Tier-/Fahrzeugkits

DOKUMENTATION
Dokumentiere Kitvertrag, Compatibility Key, Blobsharing,
Equipment-Slotmodell und Overridekonflikte in `src/ARCHITECTURE.md`, PLANS.md,
CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- vollständige humanoide Character Kits sind lokal wiederverwendbar.
- Ausrüstung funktioniert als nachvollziehbares Slotinventar.
- Kompatibilität, Coverage und Overrides werden kontrolliert.
- Blobs bleiben referenzsicher.
- zwei unterschiedliche NPCs nutzen denselben automatischen Walk-Clip.

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

Commit-Vorschlag: 🎒 feat: add reusable character kits
```
