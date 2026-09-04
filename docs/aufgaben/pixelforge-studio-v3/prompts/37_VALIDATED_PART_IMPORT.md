<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt 37 — PNG-Körperteile validiert importieren und trimmen

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Implementiere den sicheren Import transparenter PNG-Körperteile in einen
gewählten Slot und eine gewählte Richtung. Originalblob, RGBA-Daten,
Trim-Bounds und Metadaten müssen nachvollziehbar getrennt werden.

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
   Prompt 38.

UMSETZUNG
1. Definiere einen injizierbaren `ImageDecoder`-Port, der einen Blob in
   `DecodedRgbaImage {width,height,pixels}` überführt.
2. Implementiere den Browserdecoder bevorzugt mit `createImageBitmap` und
   kontrolliertem Fallback, ohne DOM-Typen in die Domain zu leaken.
3. Akzeptiere im MVP nur PNG. Prüfe:
   - Dateityp und dekodierbare PNG-Daten
   - maximal 16 MiB
   - maximal 2048×2048 px
   - mindestens einen sichtbaren Pixel
4. Implementiere pure RGBA-Funktionen:
   - `findAlphaBounds`
   - `cropRgba`
   - Alpha-Threshold Standard 1
   - Warnung bei opakem Außenrand
5. Speichere Anker später in Originalkoordinaten. Lege beim Import zunächst
   einen klaren Status `anchorsPending` an; erzeuge keine scheinpräzisen
   automatischen Gelenke.
6. Baue in `PartInventory` und Inspektor:
   - Datei auswählen
   - Drag-and-drop als Zusatz
   - Slot wählen
   - Richtung wählen
   - Vorschau
   - Dateiname/Dimension/Trim-Bounds
   - Warnungen
   - Import bestätigen/abbrechen
7. Jede Dropzone besitzt eine normale File-Input-/Buttonalternative.
8. Erzeuge IDs und Zeitstempel injizierbar.
9. Schreibe Part-Metadaten und Originalblob über die transaktionale
   Repositoryoperation aus Prompt 34.
10. Weise das neue PartAsset dem aktiven Projekt zu und aktualisiere
    `updatedAt`.
11. Ersetzten Part nicht sofort destruktiv löschen; sichere
    Referenzbereinigung erfolgt über Repository-GC.
12. Verwalte Object URLs ausschließlich über einen Hook/Service und revoke sie
    bei Ersatz, Unmount oder Projektwechsel.
13. Zeige eine erste Richtungsabdeckungsmatrix mit Status:
    eigene Quelle, fehlt, optional, Anchor pending.
14. Importfehler dürfen weder Blob noch Projektzuweisung halb speichern.

ARCHITEKTUR- UND DATENREGELN
- Originalbild bleibt unverändert erhalten.
- TrimRect liegt in Originalkoordinaten.
- keine Base64-Konvertierung.
- Dateiobjekte sind untrusted.
- Komponenten erhalten dekodierte Vorschauen über Ports/Hooks.
- Alpha-Trim ist pure Domainlogik.
- Anker werden nicht geraten.
- Drag-and-drop ist nie die einzige Bedienmöglichkeit.

TESTS
- gültiges PNG
- falscher MIME-/Dateityp und undekodierbare Daten
- Größen- und Dimensionslimit
- vollständig transparent
- opaker Rand als Warnung
- Alpha-Bounds für kleine synthetische RGBA-Matrizen
- TrimRect korrekt
- Import/Abbruch
- Repositoryfehler ohne Projektmutation
- Part ersetzen
- Object-URL-Revoke mit injizierter URL-Factory
- File Input per Tastatur
- Coverage-Matrix
- bestehender ProjectProvider/Autosave

NICHT TUN
- keine automatische Segmentierung oder Computer Vision
- keine JPEG-Unterstützung
- keine Gelenkpunkte aus Bounding Box erfinden
- keine PNG-Daten in React Context, localStorage oder JSON
- keine unbeschränkten Dateidimensionen
- keine Object-URL-Leaks
- noch keine automatische Platzierung

DOKUMENTATION
Dokumentiere Decoder-Port, Importlimits, Alpha-Trim und Object-URL-Lifecycle in
`src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein PNG kann sicher einem Slot und einer Richtung zugewiesen werden.
- Originalblob und validierte Metadaten liegen transaktional in IndexedDB.
- Trim-Bounds sind deterministisch.
- fehlende Anker sind sichtbar und blockieren Produktion.
- Fehler hinterlassen keinen halben Import.

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

Commit-Vorschlag: 🧰 feat: add validated part import pipeline
```
