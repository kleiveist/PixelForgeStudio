<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Framekorrekturen und History

## Nicht-destruktive Korrekturen

Jeder erzeugte Walk-Frame besitzt eine unveränderte **Generated Baseline**.
Eine Korrektur speichert ausschließlich kleine Deltas unter der eindeutigen
Adresse `clipId + direction + frameIndex`:

- Root-, Joint- und Part-Transformationen mit ganzzahligen X-/Y-Offsets,
  finiter Rotation und uniformer Skalierung;
- optional eine eindeutige Reihenfolge bekannter Part-Slots;
- niemals RGBA-Frames, PNGs, Blobbytes oder Object URLs.

Neutralwerte werden entfernt. „Frame zurücksetzen“ löscht den vollständigen
Eintrag, „Richtung zurücksetzen“ löscht alle Einträge des aktiven Clips und
der gewählten Richtung. Ein Layer-Reset kehrt zur versionierten
richtungsabhängigen Basisreihenfolge zurück. Dadurch bleibt jeder Frame aus
Rig, Clip, Quellen und Deltas reproduzierbar.

## Bedienung

Im Frameinspektor wird zuerst der Transformmodus gewählt:

- **Ansicht** lässt den Editorframe unverändert;
- **Root** korrigiert die vollständige Pose;
- **Joint** wählt ein Gelenk und transformiert seinen Teilbaum;
- **Part** wählt einen der bekannten Slots und korrigiert nur dessen
  Rendertransformation.

Ziehen im Viewport verschiebt in ganzen Projektpixeln. Umschalt + Ziehen
dreht. Beschriftete Zahlenfelder für X, Y, Grad und Skalierung sind die
vollständige Tastaturalternative und besitzen jeweils einen Reset. Stark
abweichende, aber noch gültige Werte werden sichtbar gewarnt; Werte außerhalb
der harten Grenzen werden an der Zod-Grenze abgewiesen.

## Undo, Redo und Speichern

Die Toolbar zeigt Speicherstatus, Rückgängig und Wiederholen gemeinsam. Im
Workspace gelten `Strg/Cmd+Z` und `Strg/Cmd+Umschalt+Z`. Die History besitzt
höchstens 100 Projekt-Metadatenstände. Hydration legt nur die
Persistenzbaseline an, eine neue Änderung verwirft den Redo-Zweig und Autosave
schreibt ausschließlich den aktuellen Stand.

Ein rückgängig gemachter Partimport entfernt die Projektzuweisung. Der bereits
transaktional gespeicherte Part und sein Blob bleiben bis zur sicheren,
referenzgeprüften Garbage Collection erhalten. Binärdaten werden nie in eine
Historykopie aufgenommen.

## Rendering und Cache

Vorschau und Export verwenden dieselbe Reihenfolge: Generated Baseline
auflösen, aktives Delta anwenden, Parts platzieren und dann rasterisieren. Eine
Overrideänderung überführt unveränderte Cacheeinträge in die neue
Projektrevision und invalidiert ausschließlich den adressierten
Clip-/Richtungs-/Frame-Schlüssel.
