<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Prompt Studio → Animation Studio und Workerexport

## Kontrollierte Übergabe

Ein erfolgreich aufgelöstes humanoides Character-Profil kann in der
Profilbibliothek über **Im Animation Studio verwenden** oder in der Ausgabe
über **Animationsprojekt vorbereiten** übergeben werden. Das Prompt-Dashboard
verlinkt diesen Workflow ausdrücklich.

Die pure Funktion
`createAnimationProjectSeedFromCharacterProfile()` bildet ausschließlich
folgende Daten ab:

| Prompt Studio | Animation Studio |
|---|---|
| AssetProfile-ID | stabile `sourcePrompt.assetProfileId`-Referenz |
| Profilname | Projektname und optionale Referenzbezeichnung |
| wirksame Figurenhöhe | `frameProfile.characterHeight` |
| berechneter Compatibility Key | `sourcePrompt.compatibilityKey` |
| gewünschte 4 oder 8 Richtungen | Quellwunsch und ausdrückliche Projektanforderung |
| konfigurierte Aktionen und Framewünsche | schmaler `requestedActions`-Snapshot |

Nicht übernommen werden Haupt-, Negativ- oder Technikprompt, Kleidung,
Beschreibungstexte, sonstige Kategorieantworten oder PNG-Daten. Nach der
Projektanlage ist deshalb der validierte Körperteilimport der nächste Schritt.
Pixelbilder werden weder aus Text abgeleitet noch automatisch erfunden.

Tier-, Kreaturen-, Nicht-Character- und konfliktbehaftete Profilketten werden
mit strukturierten Blockern abgewiesen. Ein später gelöschtes Quellprofil
beschädigt das unabhängige Animationsprojekt nicht: Die gespeicherte ID bleibt
sichtbar, wird aber als nicht mehr auflösbar markiert.

## Bestätigungspflichtige Abweichungen

`walk-humanoid-8-v1` besitzt fest acht Frames. Fordert das Profil eine andere
Zahl an, zeigt der Dialog Wunsch und Templatewert und verlangt die ausdrückliche
Übernahme der acht Frames.

Bei einem 4-Richtungswunsch gibt es genau zwei bewusste Entscheidungen:

- als 4-Richtungsanforderung behalten; der 8-Richtungs-Export bleibt gesperrt,
- auf den aktuellen 8-Richtungs-MVP hochstufen.

Der ursprüngliche Wunsch und die Entscheidung bleiben getrennt im
`sourcePrompt`-Snapshot nachvollziehbar. Keine dieser Umwandlungen geschieht
implizit.

## Workerprotokoll V1

Das serialisierbare Protokoll besitzt `protocolVersion: 1` und bindet jede
Nachricht an `jobId`, `projectId` und `projectRevision`.

| Richtung | Nachricht | Zweck |
|---|---|---|
| UI → Worker | `renderFrames` | acht Richtungen schrittweise zu 64 RGBA-Frames rendern |
| UI → Worker | `composeSpriteSheet` | kanonisches 8×8-Sheet zusammensetzen |
| UI → Worker | `prepareExport` | PNG-Encoding über `OffscreenCanvas` vorbereiten |
| UI → Worker | `packageBundle` | vollständige ZIP-/`.pfanim`-Einträge komprimieren |
| UI → Worker | `cancel` | laufenden Job abbrechen |
| Worker → UI | `progress` | `validating`, `rendering n/64`, `encoding`, `packaging` |
| Worker → UI | `completed` | vollständiges, revisionsgleiches Resultat |
| Worker → UI | `cancelled` / `failed` | kontrolliertes Ende ohne Download |

Nachrichten enthalten nur Metadaten, `Uint8Array`/
`Uint8ClampedArray`-RGBA und übertragbare Binärresultate. React-Objekte,
`Blob`-URLs und UI-Zustand sind kein Teil des Protokolls.

Der browserunabhängig getestete Controller verwirft fremde, unversionierte und
revisionsalte Antworten. `AbortSignal` sendet zusätzlich `cancel`; erst ein
vollständiges Resultat darf an den kontrollierten Downloadadapter gelangen.

## Cache und Fallback

- Dekodierte Quellen sind über Source-ID, Blob-ID und `updatedAt` gebunden,
  auf 128 LRU-Einträge begrenzt und werden beim Projektwechsel freigegeben.
- Renderframes sind über Projekt, Projektrevision, Clip, Richtung und
  Frameindex gebunden, auf 128 LRU-Einträge begrenzt und zielgenau invalidiert.
- Der Worker selbst hält keine projektübergreifende Persistenz und wird beim
  Unmount beendet.
- Fehlt `OffscreenCanvas`, liefert der Worker die geprüften RGBA-Daten an den
  injizierten asynchronen PNG-Adapter zurück. Der Download erscheint weiterhin
  erst nach vollständigem Encoding und Packaging.
- In Test-/Altumgebungen ohne Worker existiert derselbe kontrollierte,
  asynchron yieldende Adapterpfad; moderne Produktionsbrowser verwenden den
  Modulworker für den Vollbatch.

Fehler bleiben im Exportpanel sichtbar. Abbruch, Workerfehler oder eine neue
Projektrevision erzeugen weder Teilarchive noch teilweise Downloads.
