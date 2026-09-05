# PixelForge Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Prompt 47 — Character Kits und Wiederverwendung
  (abgeschlossen)
- **Nächste Aufgabe:** Prompt 48 — SpriteSheet-Export
  (nicht begonnen)
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Aktive Serie:** Phase A mit Prompts 28–31, Phase B mit Prompts 32–35 und
  Phase C mit Prompts 36–39, Phase D mit Prompts 40–43 und Phase E mit
  Prompts 44–47 abgeschlossen; die Prompts 48–51 bleiben offen unter
  `docs/aufgaben/pixelforge-studio-v3/prompts/`
- **Arbeitsregel:** genau eine beauftragte Phase umsetzen, prüfen und getrennt committen
- **Zusätzliche Wizard-Korrektur:** auswahlorientierte Antworten für alle neun
  Fachbereiche und bestätigtes, referenzsicheres Löschen von
  Produktionsfamilien umgesetzt; Prompt 39 blieb davon unberührt und ist
  separat abgeschlossen

## Prompt 47 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `31ba466`; Repository und Schema kennen bereits minimale
  Character-Kit-Metadaten, die Library-Route ist jedoch noch ein Platzhalter
  und das Workspace-Inventar kann nur neue Dateien importieren.
- Abnahme: vollständiger Kitvertrag mit stabiler ID, Referenzen, Coverage,
  Direction-/Mirror-Modus und Zeitstempeln; ein deterministischer,
  namensunabhängiger Compatibility Key verwendet ausschließlich Rig-ID,
  Frameprofil, Charakterhöhe und Contract-Versionen.
- Lifecycle: Provider/Controller speichern das aktive Projekt als Kit, laden,
  duplizieren, benennen um, löschen und wenden Kits referenzbasiert an. Das
  Projekt bleibt Eigentümer von Rig und Clips; inkompatible Kits werden hart
  blockiert und ungültige Part-Overrides nur nach sichtbarer Entscheidung
  bereinigt.
- Oberfläche: produktive Character-Kit-Library mit Suche, Rig-/Coveragefilter,
  Preview- und Kompatibilitätsstatus sowie tastaturbedienbaren Aktionen;
  Workspace-Inventar kann kompatible Bibliotheksteile einsetzen, ersetzen und
  entfernen.
- Sicherheit: freie Accessoires benötigen Attachment-Joint und Default-
  LayerGroup; Kit-Löschung entfernt keine Projektblobs, Kit-Anwendung umgeht
  weder Anchor- noch Mirrorstatus.
- Nachweise: Schema-, Domain-, Repository-/Provider- und React-Tests sowie zwei
  NPC-Kits mit demselben Walk-Clip und unterschiedlichen gültigen
  64-Frame-Sätzen; anschließend `npm run verify`, `git diff --check`,
  Dokumentationsindex und separater Commit.

## Prompt 47 — Ergebnis

1. Character Kit V1 besitzt stabile ID, Name/Beschreibung, Rig- und
   Directionvertrag, Mirror-Default, eindeutige PartAsset-Referenzen,
   Zeitstempel sowie eine validierte Coverage-Zusammenfassung. Ältere Kits
   ohne Coverage bleiben über einen sichtbaren Draft-Default lesbar.
2. Der pure Compatibility Key berücksichtigt ausschließlich RigTemplateId,
   Framegröße, Charakterhöhe, Fußanker und Anchor-/Slot-/Direction-
   Contract-Versionen. Namen, Posekoordinaten, Motion-Tuning und Assets ändern
   ihn nicht; abweichende Keys oder Rig-IDs blockieren die Anwendung hart.
3. Der Projektprovider verbindet Kit-CRUD, Previewladen und referenzbasiertes
   Speichern/Anwenden mit dem vorhandenen Repository. Duplikate teilen
   PartAssets und Bildblobs; Kitlöschung löst keine Garbage Collection aus und
   schützt daher Projektblobs.
4. Ein Kitwechsel behält Rig, Frameprofil und Clips des Projekts. Bestehende
   Frame-Partdeltas werden gegen die neue Richtungsauflösung geprüft; bei
   Konflikten bleibt das Projekt unverändert, bis ausdrücklich abgebrochen
   oder nur die betroffenen Slotdeltas bereinigt werden.
5. Die produktive Character-Kit-Bibliothek bietet lokale Suche, Rig- und
   Coveragefilter, echte Previewauflösung, Compatibility-/Mirrorstatus sowie
   Öffnen, Anwenden, Umbenennen, Duplizieren und bestätigt Löschen.
6. Das Workspace-Inventar zeigt nach Slotwahl passende eigene oder vertraglich
   gespiegelte Bibliotheksquellen und erlaubt per Tastatur Einsetzen, Ersetzen
   und Entfernen. Alle geforderten Equipment-Slots sind katalogisiert; freie
   Accessoires benötigen einen Attachment-Joint und `frontEquipment`.
7. Der Phase-E-Regressionsnachweis wendet zwei verschiedene NPC-Kits auf
   denselben Walk-Clip an und erzeugt zwei unterschiedliche, jeweils gültige
   kanonische 64-Frame-Sätze. Domain-, Schema-, Provider-, Repository- und
   React-Tests decken die übrigen Akzeptanzpfade ab.
8. `npm run verify` bestand mit 165 Testdateien und 1038 Tests, Strict-
   Typecheck und Produktionsbuild; `git diff --check` ist sauber. Die bekannte
   Vite-Warnung zum über 500 kB großen Hauptchunk bleibt. Phase E ist
   abgeschlossen; Prompt 48 wurde nicht vorgezogen.

## Prompt 46 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `7772a19`; Prompt 45 erzeugt den vollständigen kanonischen
  64-Frame-Walk, besitzt aber noch keine persistenten Framekorrekturen oder
  Projekt-Metadaten-History.
- Abnahme: validierte, sparse Korrekturen für Root, Gelenke, Parts und
  Layerreihenfolge werden ausschließlich über Clip, Richtung und Frame
  adressiert und immer auf die generierte Baseline angewendet.
- Bearbeitung: Inspector und Viewport bieten Maus- sowie numerische
  Tastaturalternativen, ganzzahlige Positionen, Rotation, gezielte Resets und
  verständliche Warnungen für extreme Werte.
- History: Undo/Redo umfasst höchstens 100 Projekt-Metadatenstände, trennt
  Persistenzbaseline und Arbeitsstand, verwirft den Redo-Zweig bei neuer
  Bearbeitung und bindet die üblichen Workspace-Tastenkürzel lokal ein.
- Cache und Exportgrenze: eine Overrideänderung invalidiert nur den
  adressierten Renderframe; Render-/Exportpfade berechnen stets Baseline plus
  Deltas. Binärblobs und abgeleitete Frames werden weder in Overrides noch in
  der History gespeichert.
- Nachweise: pure Domain-, Schema-, Provider-, Cache-, Renderer- und
  Workspace-Tests; anschließend `npm run verify`, `git diff --check`,
  Dokumentationsindex und separater Prompt-Commit.

## Prompt 46 — Ergebnis

1. Der pure Overridevertrag adressiert Korrekturen über Clip, kanonische
   Richtung und Frameindex, sortiert sie deterministisch und entfernt
   vollständig neutrale Root-, Joint- und Partdeltas. Ganzzahlige Offsets,
   finite Rotation, uniforme Skalierung sowie eindeutige bekannte Layerslots
   werden an der Zod-Grenze hart begrenzt.
2. `resolveEffectiveFramePose()` transformiert Root und Jointteilbäume ohne
   Built-in-Rigmutation. Beide Walk-Generatoren wenden Part- und Layerdeltas
   vor dem Software-Rasterizer an; ein Renderer-Nachweis vergleicht die
   korrigierten Exportbytes mit unveränderten Nachbarframes.
3. Der Frameinspektor zeigt Generated Baseline, aktive Korrektur und Adresse,
   bietet Ansicht-, Root-, Joint- und Partmodus, beschriftete Zahlenfelder,
   Einzelwert-/Layer-/Frame-/Richtungsreset sowie sichtbare Extremwarnungen.
   Ziehen verschiebt in ganzen Projektpixeln, Umschalt-Ziehen dreht.
4. Der Projektprovider besitzt eine auf 100 Metadatenstände begrenzte
   Present/Past/Future-History. Hydration beginnt ohne künstlichen Eintrag,
   neue Bearbeitung verwirft Future und Autosave schreibt nur Present.
   Rückgängig gemachter Import entfernt die Zuweisung, lässt PartAsset und
   Blob aber für die referenzsichere Garbage Collection bestehen.
5. Toolbar und Workspacekontext verbinden Dirty/Save/Undo/Redo einschließlich
   `Strg/Cmd+Z` und `Strg/Cmd+Umschalt+Z`. Ein programmgesteuerter
   Playback-Reset ändert dabei nicht mehr unbeabsichtigt den Inspektorkontext.
6. Der Render-LRU kann unveränderte Frames in eine neue Projektrevision
   übernehmen und schließt nur geänderte Overrideadressen aus. Andere
   Metadatenänderungen verwenden weiterhin die konservative vollständige
   Projekt-Revisionsbereinigung.
7. README, Nutzerhilfe, Formatdokumentation, Accessibility, Architektur,
   Changelog und Aufgabenstatus beschreiben Ownership, Bedienung, Reset,
   Cache und Exportpfad. PyGitIndex 2.1.0 nahm die neue Hilfeseite in den
   Dokumentationsindex auf; die Paketchecksummen wurden nachgeführt.
8. `npm run verify` bestand mit 162 Testdateien und 1020 Tests, Strict-
   Typecheck und Produktionsbuild. Einzig die bekannte Vite-Warnung zum über
   500 kB großen Hauptchunk bleibt; Prompt 47 wurde nicht vorgezogen.

## Prompt 45 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `cb7c54d`; Prompt 44 löst alle acht Zielrichtungen, ihre
  Quell-/Spiegelpolicy und flüchtige Neutralgeometrie auf. Der Walk-Generator
  erzeugt weiterhin ausschließlich acht South-Frames.
- Abnahme: fünf explizite und drei kontrolliert projizierte DirectionRigs sind
  über eine pure öffentliche Auflösung verfügbar; jedes Rig besitzt
  versionierte Schritt-, Lift-, Arm-, Sway- und Bendparameter.
- Generator: gemeinsame normierte Clipkanäle werden richtungsabhängig
  projiziert. Eine gültige Fünf- oder Acht-Quellproduktion ergibt exakt acht
  Richtungen × acht Frames in kanonischer, nie alphabetischer Reihenfolge.
- Vorprüfung: Pflichtslots, Anker, Coverage, Reviews, Rig/Clip und dekodierte
  Blobquellen blockieren fail-closed. Ein Richtungsfehler darf keinen
  vollständigen Status erzeugen.
- Nachprüfung: Framegröße, FootAnchor, zuverlässige Silhouettenhöhe,
  Pflichtparts, Clipping und endliche Geometrie werden strukturiert geprüft;
  alle Frames bleiben flüchtig und deterministisch.
- Workspace: jede Richtung zeigt ihren echten Walk; ein manueller
  Acht-Richtungs-Prüfmodus zeigt acht kleine Vorschauen, ohne Previewwand-
  Autoplay – insbesondere auch bei reduzierter Bewegung.
- Cache: Projekt-ID/-Revision, Clip, Richtung und Frame bleiben die
  vollständige Cacheadresse. Keine SpriteSheet-Datei oder Persistenz
  abgeleiteter Frames wird in Prompt 45 vorgezogen.

## Prompt 45 — Ergebnis

1. `humanoid-80-v1` veröffentlicht fünf authored und drei kontrolliert
   gespiegelte Zielrigs. Jedes Ziel besitzt ein versioniertes Bewegungsprofil
   mit normierter Schritt-/Sway-Achse, Stride, Oberschenkel-, Unterschenkel-
   und Armamplitude, Knie-/Fußhub sowie richtiger Bend-Seite.
2. `projectWalkChannels()`, `resolveDirectionalWalkPose()` und
   `applyPoseToDirectionRig()` projizieren die eine achtphasige Clipvorlage
   über alle Richtungen. Seite verwendet 18°/28°/14°, Diagonale
   14°/22°/11° und Front/Rücken 9°/18°/8°; Kontaktzehen bleiben auf der
   gemeinsamen Groundline.
3. `generateDirectionalFrames()` und `generateEightDirectionWalkSet()` prüfen
   Clip, Rig, Required-Slots, Anker, Coverage, Reviews und dekodierte Quellen
   vorab. Der vollständige Generator liefert ausschließlich die kanonischen
   8 × 8 Frames oder einen leeren, gesammelten Fehlerstatus.
4. Postflight prüft Framegröße, FootAnchor, sichtbare Silhouette,
   South-relative Höhentoleranz, Clipping und finite Gelenkgeometrie. Fünf-
   und Acht-Quellprojekte sowie Pixelreproduzierbarkeit sind getestet.
5. Der Workspace lädt Quellen für den vollständigen Satz einmal, spielt jede
   gewählte Richtung über dieselbe Timeline und bietet acht statische,
   tastaturbedienbare Vergleichsfelder. Die Übersicht besitzt keine eigenen
   Scheduler und startet nicht automatisch.
6. Der vorhandene begrenzte LRU adressiert jeden Frame mit Projekt-ID,
   Projektrevision, Clip, Richtung und Frameindex. Richtungswechsel verwenden
   die 64 Cacheeinträge; neue Revisionen verwerfen nur veraltete Projektframes.
7. Nutzerhilfe, README, Architektur und Changelog beschreiben Profilwerte,
   64-Frame-Vertrag, Diagnostik und Cache. Prompt 46 bleibt als nächster
   separater Auftrag unberührt.
8. `npm run verify` bestand mit 161 Testdateien und 1009 Tests, Strict-
   Typecheck und Produktionsbuild. Die einzige Buildausgabe bleibt die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk.

## Prompt 44 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `21acdc4`; Phase D erzeugt und spielt acht deterministische
  South-Walk-Frames ab. Die bisherige Coverage-Tabelle unterscheidet nur
  eigene Quellen, fehlende Quellen und Ankerzustände und leitet keine
  Spiegelquelle für das Rendering ab.
- Abnahme: pure Auflösung für eigene, gültig gespiegelte, prüfpflichtig
  gespiegelte, verbotene, fehlende, optional ungenutzte und ankerunvollständige
  Quellen in allen acht Richtungen; eigene Zielquellen besitzen Vorrang.
- Spiegelvertrag: `fiveAuthoredPlusMirror` leitet ausschließlich Südwest aus
  Südost, West aus Ost und Nordwest aus Nordost ab. `eightAuthored` spiegelt
  nie, der Einrichtungsprototyp bleibt als nicht 8-dir-exportbereit sichtbar.
- Policy und Review: Projektdefault und Partoverride werden deterministisch
  aufgelöst; eine asymmetrische Spiegelung benötigt eine explizite,
  projektbezogene Bestätigung und Dialogschließen bestätigt sie nicht.
- Projektion: Sourcepixel/-anker spiegeln um `sourceWidth - 1 - x`,
  Framejoints um `2 * footAnchor.x - x`; Rotation und X-Deltas wechseln ihr
  Vorzeichen, Originalmetadaten und anatomische Slot-IDs bleiben unverändert.
- Workspace: vollständige Slot-mal-8-Matrix mit Symbol und Text, harter
  Produktionsblock bei `forbid` ohne Zielquelle und erklärender Reviewdialog.
- Grenze: Prompt 44 erzeugt noch keinen vollständigen Acht-Richtungs-Walk,
  keine Framekorrekturen, Character Kits oder Exporte.

## Prompt 44 — Ergebnis

1. `directionProjection.ts` definiert ausschließlich die drei vertraglichen
   Paare Südost→Südwest, Ost→West und Nordost→Nordwest. Quellpixel/-anker,
   Trimrechtecke und Framejoints verwenden getrennte, dokumentierte Achsen;
   Rotation, Step-Axis und X-Offsets wechseln ihr Vorzeichen.
2. Fünf authored Rigposen werden für die drei westlichen Zielrichtungen nur
   flüchtig projiziert. Anatomische Joint-/Slot-IDs bleiben gleich und die
   Zielrichtung liefert weiterhin ihre eigene Draw-Order und visuelle Nahseite.
3. `coverage.ts` löst eigene Quellen vor Spiegelquellen auf und unterscheidet
   sieben Statuswerte. `eightAuthored` fällt nie zurück; der Einrichtungsmodus
   bleibt unabhängig von vorhandenen Einzelquellen nicht acht-dir-exportbereit.
4. Projekt-, Kit- und Partpolicy folgen der Priorität Part→Projekt→Kit→sicheres
   `forbid`. Schema V1 liest ältere Projekte/Kits über additive `allow`-
   Defaults, ohne Prompt-Schema/-Format V2 oder Storage-Namespaces zu ändern.
5. Projektzuweisungen speichern optionale Partoverrides. Explizite Reviews
   binden Asset-ID, Source-Revision und Zielrichtung; Policy-/Sourceänderungen
   machen alte Entscheidungen unwirksam. `forbid` und offene Reviews sind
   strukturierte Produktionsblocker.
6. Der Workspace zeigt 39 × 8 Zellen mit Symbol und Text, Policycontrols,
   Prototype-Hinweis und einen fokussierten Reviewdialog für Waffen, Schilde,
   Taschen, Narben, Schrift/Wappen und Weltlicht. Nur die Bestätigung schreibt;
   Abbruch und Escape kehren ohne Entscheidung zum Auslöser zurück.
7. Der Renderpfad spiegelt dekodierte RGBA-Daten und Metadatenprojektionen
   ausschließlich im Arbeitsspeicher. Originalpixel, PNG-Blob, PartAsset und
   authored Rigtemplate bleiben nachweislich unverändert; eigene Zielassets
   gewinnen.
8. Nutzerhilfe, README, Architektur, Changelog und Plan beschreiben Achsen,
   Vorrang, Review und Blocker. PyGitIndex wird vor dem Commit erneut über die
   vollständige Dokumentation ausgeführt.
9. `npm run verify` bestand mit 160 Testdateien und 1001 Tests, Strict-
   Typecheck und Produktionsbuild. `git diff --check` ist sauber; einzig die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk bleibt.
- **Zusätzliche Ausgabe-/Bibliothekskorrektur:** doppelte Prüfungsroute auf
  Ausgabe kanonisiert, TXT durch Markdown ersetzt und freie Profilsuche auf
  eine Auswahl gültiger Assetprofile umgestellt; Prompt 41 bleibt davon
  unberührt. `npm run verify` bestand mit 153 Testdateien und 957 Tests;
  `git diff --check` ist sauber

## Prompt 43 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `4a06fcd`; Prompt 42 erzeugt bei vollständigen South-
  Pflichtquellen bereits acht deterministische, ausschließlich flüchtige
  `RenderedFrame`-Werte, zeigt im Workspace aber nur die Neutralpose.
- Abnahme: Timeline-Thumbnails und Viewport lesen die echten Frames des aktiv
  gewählten kanonischen Clips; Frame, Phase, Projekt-FPS, Warnungen und
  Produktionsblocker bleiben sichtbar.
- Playback: injizierbarer `requestAnimationFrame`-Scheduler mit Play, Pause,
  Stop auf Frame 0, Vor/Zurück und Loop. Die pure Zeitprojektion holt
  verzögerte Ticks anhand verstrichener Zeit ohne Catch-up-Schleife auf.
- Scrubbing: Pointer/Klick, Range-Eingabe sowie Pfeil links/rechts, Pos1 und
  Ende. Controls bleiben bei einem nicht generierbaren Clip gesperrt.
- Onion Skin: aus als Default, vorheriger/nächster/beide Frames und begrenzte
  Deckkraft ausschließlich als Anzeigeadapter; aktuelle RGBA-Bytes werden
  dabei nicht verändert.
- Cache: begrenzter revisionsgebundener Framecache mit Schlüssel aus Projekt-
  ID/-Revision, Clip-ID, Richtung und Frameindex sowie zielgenauer
  Invalidierung für betroffene Projekte, Clips, Richtungen oder Frames.
- Lebenszyklus: kein Auto-Play, auch nicht bei reduzierter Bewegung;
  Projekt-/Clip-/Richtungswechsel und Unmount stoppen und bereinigen den
  Scheduler.
- Tests: pure Clock- und Cachefälle, 10 FPS, verzögerter Tick, Loop 7→0,
  Play/Pause/Stop, Wechsel-/Unmount-Cleanup, Reduced Motion, Scrubbing,
  Tastatur, Onion-Modi/Exportneutralität sowie zugängliche Namen und Status.
- Grenze: keine weiteren Richtungen generieren, keine Framepersistenz, kein
  PNG-/SpriteSheet-Export und keine Frame-Overrides aus späteren Prompts.

## Prompt 43 — Ergebnis

1. Die Timeline zeigt die acht tatsächlich erzeugten South-Walk-Frames mit
   Framezahl, Phasenname und eigener Textalternative. Der große Pixel-Viewport
   wechselt synchron auf den ausgewählten Renderframe.
2. `advancePlaybackClock()` projiziert verstrichene Zeit in konstanter Laufzeit
   auf Clipframes. 10 FPS, Restzeit, verzögerte Mehrfachschritte und Loop 7→0
   hängen nicht von der Monitorfrequenz ab und verwenden keine Catch-up-
   Schleife.
3. `useAnimationPlayback()` adaptiert einen injizierbaren
   `AnimationFrameScheduler`. Play, Pause, Stopp auf Frame 0 sowie Vor/Zurück
   sind nur für den vollständig generierbaren aktiven South-Clip verfügbar;
   Kontextwechsel und Unmount canceln den offenen Request.
4. Klick/Pointer, direkter Radiobutton, Range-Scrubber sowie Pfeil
   links/rechts, Pos1 und Ende wählen Frames. Der Live-Status nennt Frame,
   Phase, Richtung, Projekt-FPS und Wiedergabezustand.
5. Onion Skin startet aus, kann vorherigen, nächsten oder beide Nachbarframes
   anzeigen und begrenzt die Deckkraft auf 10–60 Prozent. Separate
   `aria-hidden`-Canvaslayer verändern weder aktiven Frame noch Exportbytes.
6. Der LRU-Renderframecache ist auf 128 Einträge begrenzt und exakt an
   Projekt-ID, Projektrevision, Clip-ID, Richtung und Frameindex gebunden.
   Gefilterte Invalidierung trifft nur den bezeichneten Projekt-, Clip-,
   Richtungs- oder Framebereich; alte Revisionen des aktiven Projekts werden
   entfernt.
7. Die echte Providerrevision erreicht nun den Workspace. Part-, Anker-, Rig-,
   Clip- und Overrideänderungen können dadurch keinen Frame einer alten
   Projektrevision wiederverwenden; Frames und Vorschauzustand bleiben
   vollständig flüchtig.
8. Nutzerhilfe, Animation-Accessibility, Walk-Dokumentation, Architektur,
   Changelog und Promptpaket-Einstiege dokumentieren den Abschluss von Phase
   D. PyGitIndex 2.1.0 meldet 72 aktuelle Markdownseiten, und alle
   Paketchecksummen sind gültig.
9. `npm run verify` bestand mit 158 Testdateien und 983 Tests, Strict-
   Typecheck sowie Produktionsbuild. `npm run build` wurde zusätzlich einzeln
   erfolgreich ausgeführt; einzig die bekannte Vite-Warnung zum über 500 kB
   großen Hauptchunk bleibt. Prompt 44 wurde nicht vorgezogen.

## Prompt 42 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `58d5766`; Prompt 41 liefert die geprüfte South-
  Neutralplatzierung, richtungsspezifische Draw-Order und den deterministischen
  RGBA-Renderer.
- Abnahme: readonly Cliptemplate `walk-humanoid-8-v1` mit acht ausdrücklichen
  Phasen, 10 FPS, Loop und versionierten normierten Bewegungs-, Lift-, Bob-,
  Sway- und gegenläufigen Armkanälen.
- Domain: pure Frame-/Poseauflösung, South-Rig-Anwendung,
  Posevalidierung und kontrollierte Two-Bone-IK mit Clampdiagnostik statt
  NaN/Infinity.
- Kontakt: Kontaktfuß bleibt in Kontakt-/Down-Phasen auf der Groundline,
  Root-Anker und Fußkontakt bleiben getrennt, Root-Bob ist standardmäßig auf
  ±1 px begrenzt.
- Produktion: nur ein vollständiges South-Pflichtpartset mit ready-Ankern und
  dekodierten Quellen erzeugt acht flüchtige `RenderedFrame`-Objekte; Fehler
  werden gesammelt und es werden keine Renderframes persistiert.
- Tests: Templatewerte, Phasen/Kanäle, Gegenphase, Arm-/Bein-Gegenlauf,
  Kontakt, IK normal/geclamped/ungültig, fehlende Parts/Anker, acht
  reproduzierbare Frames, Frame 0/4, Höhe und endliche Werte.
- Grenze: keine anderen Richtungen, Wiedergabe, Zwischenbildinterpolation,
  Projekt-PNGs oder Zufallswerte.

## Prompt 42 — Ergebnis

1. `walk-humanoid-8-v1` ist ein readonly Domainvertrag mit Version 1, acht
   benannten Frames, 10 FPS Default und aktivem Loop. Frame 8 löst wieder
   exakt Frame 0 auf; Zwischenbildinterpolation existiert nicht.
2. Linker/rechter Stride, Root-Bob/-Sway, gegenläufige Armbewegung sowie Knee-
   und Foot-Lift sind ausdrückliche normierte Acht-Werte-Kanäle. Beide Seiten
   bleiben um vier Frames phasenverschoben, der Bob im Standard bei ±1 px.
3. `resolveClipFrame()`, `resolveHumanoidWalkPose()`,
   `applyPoseToDirectionRig()` und `validatePose()` bilden eine pure Pipeline.
   Sie kopiert ausschließlich das South-Rig und verändert keine Built-in-
   Vorlage.
4. Kontakt- und Down-Frames halten die jeweilige Zehe auf der projizierten
   Groundline, während der globale Root-Anker unverändert bleibt. Torso und
   Kopf gleichen Bob/Sway kontrolliert aus.
5. `solveTwoBoneIk()` verwendet feste Segmentlängen und seitenspezifische
   Bend-Signs. Unerreichbare Ziele werden mit Diagnose geklemmt; ungültige
   Eingaben und Bone-Längen erzeugen strukturierte Fehler statt NaN/Infinity.
6. `generateSouthWalkFrames()` fordert kanonischen Clip, jedes der 15
   South-Pflichtparts genau einmal, ready-Anker und dekodierte RGBA-Quellen.
   Erst dann entstehen acht Draw-Order-sortierte `RenderedFrame`-Werte.
7. Fehlende/doppelte Parts, offene/ungültige Anker, Bone-, Placement- und
   Renderfehler werden gesammelt. Der Workspace zeigt die Sperre oder die
   acht flüchtig erzeugten Frames; keinerlei Framebytes werden persistiert.
8. Eine synthetisch erzeugte farbige Humanoid-Fixture prüft alle Frames ohne
   private Nutzerassets. Gegenphase 0/4, Loop, Groundline, Höhe, endliche
   Koordinaten und wiederholte Bytegleichheit sind abgedeckt. `npm run verify`
   bestand mit 155 Testdateien und 969 Tests, Strict-Typecheck und
   Produktionsbuild; `git diff --check` ist sauber. PyGitIndex meldet 70
   aktuelle Markdownseiten.
9. Prompt 43 wurde nicht vorgezogen und bleibt die nächste getrennte Aufgabe.

## Prompt 41 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `91206c7`; Prompt 40 rendert bereits deterministisch und
  übernimmt Parts in einer extern aufgelösten Reihenfolge.
- Abnahme: versionierter frameworkfreier Layervertrag mit acht ausdrücklichen
  Richtungsorders, getrennter anatomischer Nahseite, geprüften Pflichtslots
  und kontrollierter Einordnung optionaler Ausrüstung.
- Freie Accessoires: gültiger Attachment-Joint, Default-Layergruppe und
  kleiner projektweiter ganzzahliger Layer-Offset statt duplizierter Liste.
- Integration: aktive PartAssets werden exakt einmal aufgelöst, vor
  `renderFrame()` sortiert und im Inspector samt editierbarem Projekt-Offset
  angezeigt; per-Frame-Overrides bleiben Prompt 46 vorbehalten.
- Diagnostik: unbekannte/doppelte Slots, fehlende Pflichtorder und
  Attachment-Joints sowie linke, rechte, obere, untere oder vollständige
  Frameüberschreitung werden strukturiert und im Viewport verständlich.
- Tests: alle acht Orders, Nah-/Fernseite, optionale Einfügung, Layer-Delta,
  farbige Überdeckung, jede Framekante, vollständiges Außerhalb,
  Inspektoranzeige und richtungsabhängiges Re-Rendering.
- Grenze: keine Quellspiegelung, Walk-Bewegung, per-Frame-Layerorder oder
  DOM-z-index-basierte Pixelkomposition.

## Prompt 41 — Ergebnis

1. `DirectionDrawOrder` Version 1 definiert für jede der acht Zielrichtungen
   eine eigene vollständige Reihenfolge aller 39 Slots. Nahseite,
   anatomisches Links/Rechts und Weltlicht bleiben getrennte Begriffe.
2. `validateDrawOrder()` und die Produktionsprüfung blockieren unbekannte
   oder doppelte Slots, unvollständige Basisorders, freie Accessoires ohne
   gültigen Attachment-Joint und Layer-Deltas außerhalb -8 bis +8.
3. Nicht belegte optionale Slots werden ausgelassen. Feste Ausrüstung nutzt
   kanonische Attachment-Joints; freie Accessoires speichern ihren Joint
   ausdrücklich und werden standardmäßig vorn eingeordnet.
4. Die Neutralpose platziert Parts weiterhin aus Originalanker, Rig und
   Projektdelta, löst danach aber die Richtungsorder auf. `renderFrame()` sieht
   nur diese fertige Reihenfolge; Projektarray und DOM steuern sie nicht.
5. Projektzuweisungen besitzen additiv ein kleines `layerOffset`. Der Provider
   validiert Änderungen, bewahrt das Delta bei späterer Ankerbearbeitung und
   lässt es über den normalen Dirty-/Autosave-Lebenszyklus persistieren.
6. Der Part-Inspector zeigt Layergruppe, Basis- und belegte Position sowie die
   visuell nahe Seite und bietet die begrenzte Projekt-Delta-Bedienung.
   Per-Frame-Layer-Overrides bleiben ausdrücklich offen bis Prompt 46.
7. Rasterdiagnosen nennen Bounding-Box und betroffene linke, rechte, obere
   oder untere Framekante. Vollständig außerhalb liegende Parts sind Fehler;
   teilweise abgeschnittene bleiben Warnungen.
8. Domain-, Schema-, Provider-, Placement- und RTL-Fixtures prüfen alle acht
   Orders, farbige Überdeckung, Ausrüstung, freie Accessoires, Layer-Delta,
   jede Clippingkante, vollständiges Außerhalb, Inspector und
   Richtungswechsel. `npm run verify` bestand mit 153 Testdateien und 957
   Tests, Strict-Typecheck und Produktionsbuild; `git diff --check` ist
   sauber. PyGitIndex meldet 69 aktuelle Markdownseiten.
9. Prompt 42 wurde nicht vorgezogen und bleibt die nächste getrennte Aufgabe.

## Prompt 40 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `c91e772`; Phase C ist mit Prompt 39 abgeschlossen.
- Abnahme: immutable RGBA-/Surface-/Part-/Frame-Verträge, transparente
  Surface-Erzeugung, inverse affine Nearest-Neighbor-Abtastung und ganzzahlig
  gerundetes Source-over als pure TypeScript-Domain.
- Diagnostik: vollständig außerhalb, teilweise geclippt, leere Quelle,
  fehlende RGBA-Daten und nicht invertierbare Matrix bleiben strukturiert und
  werden im Workspace sichtbar.
- Integration: revisionsgebundener Decoded-Source-Cache ohne Blob-State,
  neutrale Partplatzierung aus Rig und Ankern sowie Canvas ausschließlich als
  `ImageData`-/`putImageData`-Anzeigeadapter mit deaktivierter Glättung.
- Tests: kleine exakte RGBA-Fixtures für Translation, Scale, Spiegelung,
  Rotation, kombinierte Matrix, Alpha, Layer, Clipping, Fehler, Immutabilität,
  Wiederholung, Cache-Revision und sichtbares Workspace-Ergebnis.
- Grenze: kein richtungsabhängiger Produktions-Draw-Order aus Prompt 41, kein
  Walk-Generator, Playback, SpriteSheet oder PNG-Encoding.

## Prompt 40 — Ergebnis

1. `RgbaImage`, `RasterSurface`, `RenderablePart`, `RenderedFrame` und die
   strukturierte Renderdiagnostik bilden einen readonly, frameworkfreien
   Rastervertrag. Transparente Frames werden validiert neu erzeugt; Quellen
   und Eingabeoberflächen bleiben bytegenau unverändert.
2. `blitNearestAffine()` iteriert nur die transformierte, gegen den Frame
   geschnittene Bounding-Box. Zielpixelzentren werden invers in die Quelle
   abgebildet und per verbindlichem Nearest Neighbor gelesen; transparente
   Samples werden übersprungen.
3. `compositeSourceOver()` verwendet Straight Alpha, ausschließlich
   ganzzahlige Zwischenwerte und nearest/half-up als feste Rundungsregel.
   Wiederholte identische Eingaben liefern identische RGBA-Arrays ohne
   Zwischenfarben durch Interpolation.
4. Fehler und Hinweise für vollständig außerhalb, teilweise geclippt, leere
   Quelle, fehlende RGBA-Daten und nicht invertierbare Matrix bleiben je Part
   strukturiert. `renderFrame()` übernimmt seine Eingabeliste ausdrücklich in
   bereits aufgelöster Draw-Order; Prompt 41 bleibt Eigentümer ihrer
   richtungsabhängigen Erzeugung.
5. Der revisionsgebundene Cache hält nur kopierte dekodierte RGBA-Daten nach
   Part-, Blob- und Revisionsschlüssel. Blobs bleiben auf den kurzfristigen
   Repository-/Decoder-Aufruf begrenzt. Eine neue Revision verdrängt den alten
   Cacheeintrag; fehlgeschlagene Decodes werden nicht festgehalten.
6. Der Workspace rendert ready Parts der aktiven authored Neutralpose aus Rig,
   Originalanker, Trim und Projektdelta. Canvas erhält den fertigen Frame nur
   über `ImageData`/`putImageData`, setzt Glättung aus und bleibt weder
   Rasteralgorithmus noch Exportquelle. Vorbereitungs- und Renderdiagnosen
   sind als DOM-Status sichtbar.
7. Exakte Fixtures decken Translation, 2×-Scale, Spiegelung, 90°-Rotation,
   kombinierte Matrix, Transparenz, opakes/halbtransparentes Source-over,
   Reihenfolge, Clipping, Matrix-/Quellfehler, Immutabilität, Wiederholung,
   Cache-Revision und sichtbares Workspace-Rendering ab. `npm run verify`
   bestand mit 152 Testdateien und 931 Tests, Typecheck und Produktionsbuild;
   `git diff --check` ist sauber. PyGitIndex meldet 68 aktuelle Markdownseiten.
8. Prompt 41 wurde nicht vorgezogen und bleibt die nächste getrennte Aufgabe.

## Wizard-Auswahlkatalog und Produktionsfamilien-Löschung — Ergebnis

1. Alle kreativen Textfelder von Charakter, beweglichem/statischem Objekt,
   Textur, Natur, Gebäude, Tileset, Item und Artwork beginnen als Auswahl mit
   mehreren promptfähigen Antworten. „Eigene Eingabe“ blendet den registrierten
   Freitext erst bewusst ein; bestehende individuelle Werte bleiben ohne
   Hydration-Write bearbeitbar.
2. Ein vollständiger, frameworkfreier deutscher Vorgabenkatalog deckt die acht
   Nicht-Character-Editoren ab. Die bestehenden Character-Vorgaben bleiben an
   ihrer öffentlichen Domaingrenze; neue Felder, Defaults oder eine
   Schemaerhöhung entstehen nicht.
3. Produktionsfamilien besitzen im Basisprofil-Schritt einen sichtbaren
   Löschbutton und reagieren bei fokussierter Auswahl auf `Entf`. Abbruch und
   Bestätigung sind fokusgeführt; referenzierte Familien werden mit sichtbarer
   Begründung nicht gelöscht, Kinder nie kaskadiert oder still umgehängt.
4. Domain-, Provider-, Fachbereichs- und Wizard-Integrationstests decken
   Katalogvollständigkeit, Preset-/Custom-Verhalten, Button-/Tastaturbedienung,
   Bestätigung, Persistenz und Referenzschutz ab.

## Prompt 39 — Ausgangsstand und Ergebnis

- Ausgangs-HEAD: `f257235`; Prompt 38 war isoliert mit 144 Testdateien und
  882 Tests, Strict-Typecheck und Build abgeschlossen.
- `validateSourceAnchors()`, `resolveEffectiveAnchor()`,
  `resolveBonePlacement()` und `applyTransformDelta()` bilden eine pure
  Placement-Domain. Zweipunkt-Parts richten Quell- und Zielvektor mit
  uniformem Scale aus; Kopf, Torso und Becken verwenden proximalen Anker und
  die versionierte Defaultorientierung ihrer Slotbindung.
- Originalkoordinaten bleiben die einzige persistierte Ankerwahrheit. Trim
  wird genau einmal umgerechnet; Fast-Null-Vektoren bis 0,001 px enden
  strukturiert. Automatische Scale-Werte außerhalb 0,5–2,0 werden sichtbar
  gewarnt und nicht begrenzt.
- Der Viewport bietet Original-PNG, ganzzahligen Zoom, Button-/Tastatur-Pan,
  proximalen/distalen/optionalen Pivot-Anker, Zahlenfelder, Pointer-Snap,
  Reset und eine richtungsreaktive CSS-Matrix-Live-Vorschau über einen
  schmalen Anzeigeadapter. Der Rasterrenderer aus Prompt 40 wurde nicht
  vorgezogen.
- Projektweite Korrekturen liegen getrennt auf der Partzuweisung: Offset
  ±32 px, Rotation ±π/2 und uniformer Multiplikator 0,5–1,5. Ein absoluter
  Auto-Transform wird nicht persistiert.
- `writePartSetupToProject()` schreibt PartAsset-Anker/-Status und Projekt-
  Delta atomar in Memory und IndexedDB, ohne das Originalblob neu zu schreiben.
  Der Provider übernimmt ausschließlich validierte erfolgreiche Ergebnisse.
- Coverage und Produktionsprüfung unterscheiden `ready`, `anchorsPending`,
  `invalidAnchors` und `missing`; ein Limb ohne Distalanker bleibt ein
  fortsetzbarer, aber nicht produktionsbereiter Entwurf.
- Domain-, Schema-, Adapter-, Repository-, Provider-, UI-, Resume-, Reset-,
  Pointer-, Rig-/Richtungs- und Coverage-Tests decken die Kriterien ab.
  Der isolierte `npm run verify` bestand mit 147 Testdateien und 903 Tests,
  Strict-Typecheck und Produktionsbuild. Phase C ist mit Prompts 36–39
  abgeschlossen; Prompt 40 bleibt unbegonnen.

## Prompt 38 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `fcaa893`
- Baseline: Prompt 37 abgeschlossen mit 141 Testdateien und 866 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Domain: readonly `RigTemplate`, fünf eigenständige `DirectionRig`-Posen,
  Joint-/Bone-/Slotdefinitionen und versionierte Bewegungsprofile für
  `humanoid-80-v1` ohne React-, DOM- oder Storage-Abhängigkeit
- Referenzdaten: 128 × 128 px Frame, 80 px Figurenhöhe, Fußanker 64/112,
  Anchor-/Slot-Contract-Version 1 und vollständige South-Referenzkoordinaten
- Validierung: strukturierte Issues mit Pfad für fehlende/out-of-frame Joints,
  unbekannte Bone-Referenzen, Zyklen, Null-Limbs, unvollständige
  Pflichtslotbindungen und Verletzungen der Groundline-Zone
- Kompatibilität: deterministischer Key ausschließlich aus den relevanten
  versionierten Templatewerten; keine UI-Zerlegung oder Custom-Rig-Mutation
- Oberfläche: SVG-Overlay für Neutralpose, Bones, Joints, Groundline und
  Slotlabels der gewählten Quellrichtung; keine Partplatzierung und keine
  Freigabe westlicher Quellgeometrien vor Prompt 44
- Prüfung: South-Koordinaten, fünf eigene Posen, vollständige Verträge,
  Negativvarianten, stabiler Key sowie richtungsabhängiges Overlay mit
  Typecheck, Tests, Build, `npm run verify` und `git diff --check`

## Prompt 38 — Ergebnis

1. `RigTemplate`, `DirectionRig`, `JointDefinition`, `BoneDefinition`,
   `SlotBinding` und `DirectionMotionProfile` bilden einen readonly,
   frameworkfreien Produktionsvertrag. `humanoid-80-v1` hält Framegröße,
   Figurenhöhe und alle drei Contract-Versionen ausdrücklich getrennt.
2. South, SouthEast, East, NorthEast und North besitzen jeweils eigene
   vollständige Geometrien mit 21 Joints. Der South-Stand entspricht den
   verbindlichen Referenzzentren; Hand- und Toe-Joints, kontrollierte
   Nah-/Fernseitenüberdeckung sowie normalisierte Richtungsprofile ergänzen
   die fünf neutralen Quellposen ohne Bewegungsschlüssel.
3. 20 hierarchische Bones beschreiben Torso, Verbinder und Limbs. Alle 15
   Pflichtslots sind genau einem proximalen und bei Limb-Parts einem distalen
   Joint zugeordnet; Kopf, Torso und Becken besitzen eine versionierte
   Einpunkt-Defaultorientierung. Die Built-in-Daten sind bis zu Punkten und
   Profilunterobjekten eingefroren.
4. `validateRigTemplate()` liefert strukturierte Code-/Pfad-Issues für
   Frame-, Richtungs-, Joint-, Bone-, Hierarchie-, Null-Limb-, Slot- und
   Groundline-Fehler. `createRigCompatibilityKey()` validiert zuerst und
   fingerprintet danach alle relevanten Werte in fester Katalogreihenfolge;
   der erwartete Key ist regressionsgetestet.
5. Das bisher symbolische CSS-Rig wurde durch ein SVG aus einem puren
   Overlaymodell ersetzt. Es zeigt für die aktive Quellrichtung echte Bones,
   Joints, Groundline und 15 Pflichtslotlabels und folgt Richtungswechseln.
   West, NorthWest und SouthWest bleiben ohne erfundene Geometrie ausdrücklich
   als nicht freigegeben sichtbar.
6. Nutzerhilfe, öffentliche Architekturgrenzen, Technologie-Stack,
   V3-Spezifikation, README und Changelog dokumentieren Produktionsdaten,
   Versionierung, South-Referenz, Validierung und UI-Grenze. PyGitIndex wurde
   auf die neue Rigseite aktualisiert.
7. Der isolierte Abnahmebaum aus Ausgangs-HEAD plus ausschließlich Prompt 38
   bestand `npm run verify` mit 144 Testdateien und 882 Tests, Strict-Typecheck
   und Produktionsbuild. `git diff --check` ist sauber; einzige Ausgabe bleibt
   die bekannte Vite-Warnung zum Hauptchunk über 500 kB. Parallel vorhandene,
   themenfremde Editorarbeiten blieben unangetastet und außerhalb des Commits.
8. Prompt 39 wurde nicht vorgezogen und bleibt die nächste separat zu
   implementierende und zu committende Aufgabe.

## Prompt 37 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `e24bd94`
- Baseline: Prompt 36 abgeschlossen mit 135 Testdateien und 842 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: ausschließlich decodierbare PNG-Dateien bis 16 MiB und
  2048 × 2048 px; mindestens ein sichtbares Pixel; deterministische pure
  Alpha-Bounds und RGBA-Crops bei Standardschwelle 1
- Architektur: injizierter frameworkfreier `ImageDecoder`-Port, Browseradapter
  mit `createImageBitmap` und kontrolliertem Fallback, kurzlebige und sicher
  widerrufene Object URLs nur in Hook/Service sowie unverändertes Originalblob
- Persistenz: PartAsset-Metadaten mit explizitem `anchorsPending`, Originalmaß
  und Trim in Originalkoordinaten atomar mit dem Blob schreiben; aktive
  Projektzuweisung erst nach erfolgreichem Repository-Write aktualisieren
- Oberfläche: additive Datei- und Dropzone-Bedienung, Slot und Richtung,
  Vorschau, Dateiname, Maße, Trim, Warnungen, Bestätigen/Abbrechen sowie eine
  erste Richtungs-/Slot-Coverage ohne erfundene Anker oder automatische
  Platzierung
- Fehlergrenze: ungültige/zu große/transparente Dateien, Decoder- und
  Repositoryfehler lassen die bestehende Projektzuweisung unverändert;
  ersetzte Parts werden nicht gelöscht und bleiben der Garbage Collection
  vorbehalten
- Dokumentation: öffentliche Modulgrenzen, Nutzerhilfe, Changelog,
  V3-Implementierungsstand und Übergabe auf Prompt 38 aktualisieren

## Prompt 37 — Ergebnis

1. Der injizierbare `ImageDecoder`-Port und sein Browseradapter trennen
   Decodierung von Domain und React. Der Adapter bevorzugt
   `createImageBitmap`, verwendet einen kontrollierten Image-Fallback und
   widerruft dessen Object URL in jedem Ausgang; Dimensionen werden vor einer
   unbeschränkten Canvas-/RGBA-Allokation begrenzt.
2. `prepareAnimationPartImport()` behandelt Dateien als `unknown` und prüft
   MIME-Typ, PNG-Signatur, positive Größe, 16-MiB-Grenze, Decodierbarkeit,
   2048-×-2048-Grenze, RGBA-Länge und sichtbaren Alpha-Inhalt. JPG,
   umbenannte oder beschädigte Nicht-PNGs, transparente und übergroße Quellen
   enden vor jedem Write mit konkretem Fehler.
3. Pure Domainfunktionen bestimmen bei Standardschwelle 1 deterministisch die
   Alpha-Bounds, erzeugen einen kopierten RGBA-Crop und erkennen vollständig
   opake Außenrandpixel. Das Originalblob bleibt unverändert; Trimwerte bleiben
   Originalkoordinaten.
4. PartAssets unterstützen additiv `anchorStatus`. Bestehende V1-Daten ohne
   Feld normalisieren zu `ready`; neue Imports erhalten
   `anchorsPending` ohne erfundene `anchors`. Die Produktionsvalidierung führt
   diesen Status als eigenen Blocker.
5. Dateiinput und additive Dropzone, Zielslot/-richtung, lokale Vorschau,
   Dateiname, Originalmaß, Trim, Warnungen, Bestätigung und Abbruch sind im
   Teileinventar produktiv. Der Inspector zeigt persistierte Partdaten; die
   Coverage-Matrix unterscheidet Quelle, fehlende Pflichtquelle, optionalen
   Slot und offene Anker je tatsächlich authorender Richtung.
6. `writePartAssetToProject()` validiert und schreibt neues PartAsset,
   Originalblob und aktualisierte Projektzuweisung gemeinsam in Memory- oder
   IndexedDB-Transaktion. IDs und Zeitstempel stammen aus injizierten
   Factories; ein Ersatz löst nur die alte Projektzuweisung und löscht weder
   Alt-Part noch Alt-Blob.
7. Repository-/Providerfehler lassen den bisherigen Projektstand und alle drei
   Stores unverändert. Der Provider übernimmt erst das erfolgreich persistierte
   Ergebnis als sauberen Aktivstand; Vorschau-URLs werden bei Ersatz, Abbruch,
   Unmount und damit Projektwechsel widerrufen.
8. `npm run verify` bestand mit 141 Testdateien und 866 Tests sowie
   erfolgreichem Strict-Typecheck und Produktionsbuild. Einzige Ausgabe bleibt
   die bekannte Vite-Warnung zum über 500 kB großen Hauptchunk. PyGitIndex
   2.1.0 meldet alle 65 Markdown-Dateien aktuell; der Root-/Dokuindex enthält
   keine doppelten Linkziele. Prompt 38 wurde nicht begonnen und bleibt die
   nächste getrennte Aufgabe.

## Prompt 36 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `28ae7c6`
- Baseline: Prompt 35 abgeschlossen mit 132 Testdateien und 825 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: produktive, responsive Workspace-Shell für das geladene aktive
  Animationsprojekt mit Toolbar, domänenbasiertem Teileinventar, DOM-basiertem
  128-×-128-Viewport, kontextuellem Inspektor und Walk-Timeline
- Bedienung: temporäre Auswahl für Richtung, Clip, Frame, Slot, Zoom, Overlays
  und aktive Paneele; vollständige Tastatur- und DOM-Alternativen sowie
  fokuserhaltende Mittel-/Kleinbreiten-Navigation
- Zustände: getrennte Loading-, Fehler-, No-Project- und Missing-Blob-
  Darstellungen; Speicherstatus bleibt Eigentum des Projekt-Providers
- Grenze: kein PNG-Import, keine persistierten Beispieldaten, kein Canvas-
  Renderer, kein Playback, keine Exportpipeline und kein Prompt 37

## Prompt 36 — Ergebnis

1. Die geladene Projekt-ID führt jetzt in eine vollständige produktive
   Workspace-Shell mit Projekt-/Clip-Toolbar, domänenbasiertem
   39-Slot-Inventar, zentralem DOM-Viewport, kontextuellem Inspektor und
   acht Walk-Frameplätzen samt FPS-Anzeige.
2. Ein purer lokaler Reducer besitzt ausschließlich Richtung, Clip, Frame,
   Slot, Inspektorkontext, die sechs ganzzahligen Zoomstufen, fünf Overlays,
   Pan und responsive Paneelauswahl. Projekt- und Save-Metadaten bleiben im
   `AnimationProjectProvider`; kein Workspace-Unterbaustein liest das
   Repository oder persistiert temporäre Auswahl.
3. Desktop zeigt alle vier Arbeitsbereiche, mittlere Breiten schalten das
   Seitenpaneel zwischen Teileinventar und Inspektor um, kleine Breiten bieten
   die progressive Reihenfolge Teile → Viewport → Eigenschaften → Timeline.
   Paneelwechsel übertragen Fokus; Tabs, Slots und Frames sind vollständig per
   Tastatur auswählbar.
4. Zoom, Panning und alle Overlay-Schalter besitzen Button-/Checkbox- und
   Textalternativen. No-Project, Loading, Not-Found, Repositoryfehler, leere
   Projekte und nicht aufgelöste Asset-/Blob-Referenzen sind getrennt sichtbar.
   Import, Play/Pause und Export bleiben mit sichtbarer Begründung deaktiviert.
5. 17 neue Reducer-, Katalog-, Workspace-, Responsive-, Fokus-, Tastatur-,
   Lifecycle- und Fehlerfalltests ergänzen die Abdeckung. `npm run verify`
   bestand mit 135 Testdateien und 842 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk.
6. `git diff --check` ist sauber. PyGitIndex 2.1.0 bestätigt alle 64
   Markdown-Dateien als aktuell. Prompt 37 wurde nicht begonnen und bleibt die
   nächste getrennte Aufgabe.

## Prompt 35 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `d245f7b`
- Baseline: Prompt 34 abgeschlossen mit 126 Testdateien und 799 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: pure Projektlisten-/Aktivprojekt-/Load-/Save-/Revision-/Rohfehler-
  State-Machine; `AnimationProjectProvider` mit injiziertem Repository, Uhr
  und ID-Factory; schreibfreie Hydration; debounced Autosave und expliziter
  beziehungsweise projektwechselbedingter Flush
- Oberfläche: vollständige Projektübersicht mit validierter Standardanlage,
  Suche/Sortierung, Öffnen samt stabiler Workspace-Route, Umbenennen,
  Duplizieren und bestätigtem Löschen; verständlicher Unknown-ID-State;
  echte letzte Animationsprojekte auf Studio Home
- Grenze: keine PNGs oder Blobs im Provider, kein Canvas/Rig-Editor, keine
  Character-Kit-Fachfunktion, keine Undo/Redo-History und kein Prompt 36

## Prompt 35 — Ergebnis

1. Eine pure Projekt-State-Machine verwaltet sortierte Summaries, das aktive
   validierte Projekt, Load-/Save-Status, Dirty- und Persistenzrevisionen sowie
   abgewiesene Rohfehler getrennt vom letzten gültigen In-Memory-Modell.
2. Der injizierbare `AnimationProjectProvider` hydratisiert und öffnet
   schreibfrei, serialisiert Repository-Writes, autosaved valide Änderungen
   debounced und flusht vor explizitem Speichern oder bewusstem Projektwechsel.
   Write-Fehler behalten das gültige Modell und einen konkreten Fehlerstatus.
3. Die produktive Projektansicht unterstützt Zod-/RHF-validierte Anlage,
   Suche, vier Sortierungen, Öffnen, Umbenennen, Copy-on-write-Duplizieren und
   bestätigt Löschen. Der Startvertrag verwendet `humanoid-80-v1`, 128 × 128,
   Figurenhöhe 80, Fußanker 64/112, `fiveAuthoredPlusMirror` und Walk mit acht
   Frames bei 10 FPS.
4. Workspace-Routen tragen die stabile Projekt-ID. Ein fehlendes oder bereits
   gelöschtes Projekt bleibt als erklärter Error State ohne automatisches
   Umschreiben oder Ladeschleife sichtbar; Editor, Import, Kits und Rigs
   bleiben kontrollierte Platzhalter für spätere Prompts.
5. Studio Home liest maximal drei zuletzt bearbeitete Projekte über einen
   schmalen Summary-Port und öffnet sie ausschließlich nach Nutzeraktion.
   Dirty-Projekte aktivieren einen gezielten Browser-Unload- und internen
   Navigationsschutz; sauberer State installiert keine globale Unload-Warnung.
6. 26 zusätzliche beziehungsweise angepasste Lifecycle-, Provider-, Reducer-,
   Daten-, Home-, Dialog-, Fokus-, Tastatur-, Routing- und Fehlerfalltests
   decken die Prompt-35-Abnahme ab.
7. `npm run verify` bestand mit 132 Testdateien und 825 Tests sowie
   erfolgreichem Typecheck und Produktionsbuild. Einzige Ausgabe bleibt die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk;
   `git diff --check` ist sauber.
8. Prompt 36 wurde nicht begonnen und bleibt die nächste getrennte Aufgabe.

## Prompt 34 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `e32f47e`
- Baseline: Prompt 33 abgeschlossen mit 124 Testdateien und 782 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: öffentlicher asynchroner `AnimationRepository`-Port mit
  strukturierten Ergebnissen; austauschbare Memory- und native IndexedDB-
  Adapter; validierte Projekt-/Part-/Kit-Metadaten; atomare Part-/Blob-Writes;
  Copy-on-write-Projektduplikation; pure Referenzanalyse und explizite sichere
  Garbage Collection; schmale sortierte Projektzusammenfassungen
- Datenbankvertrag: `pixelforge-studio`, Version 1, getrennte Stores für
  Projekte, Part-Metadaten, Bildblobs, Character Kits und Previews sowie
  additive Upgrade-Schritte
- Grenze: keine React-UI oder Provider, kein globales Repository-Singleton,
  keine Base64-/JSON-Binärspeicherung, keine Änderung am Prompt-V2-
  localStorage und kein Prompt 35

## Prompt 34 — Ergebnis

1. Der öffentliche asynchrone `AnimationRepository`-Port unterscheidet valide
   Reads/Queries/Writes, Schemafehler, fehlende Datensätze, ID-Konflikte,
   fehlende beziehungsweise nicht öffnende IndexedDB und
   Transaktionsfehler. Projektzusammenfassungen bleiben ein schmales,
   deterministisch nach `updatedAt` und ID sortiertes Read-Model.
2. `MemoryAnimationRepository` und `IndexedDbAnimationRepository` decken
   Projekt-, PartAsset-, Bildblob-, Preview- und Character-Kit-Operationen
   über denselben Vertrag ab. Metadaten werden vor jedem Write mit den
   Prompt-33-Schemas validiert; Prompt-V2-localStorage und seine sechs Keys
   wurden nicht verändert.
3. Die native Datenbank `pixelforge-studio` Version 1 besitzt fünf getrennte
   Key-Path-Stores sowie Indizes für Projekt-/Kit-`updatedAt`, Part-Slot und
   Part-Richtung. Die Browserfactory liefert ohne oder bei nicht öffnender
   IndexedDB `unavailable`; keine globale Verbindung wird geteilt.
4. PartAsset und Bildblob werden in einer gemeinsamen Transaktion geschrieben.
   Ein absichtlich ausgelöster DataClone-/Transaktionsfehler belegt den
   Rollback auf die alten Metadaten und den alten Blob. Projektduplikate
   erhalten eine neue Projekt-ID und neue Zeitstempel, teilen aber
   unveränderliche Part-/Blob-/Previewreferenzen ohne Binärkopie.
5. Projekt-, Part- und Kit-Löschungen kaskadieren nicht. Eine pure
   Referenzanalyse steuert die einzige explizite Garbage Collection; sie
   entfernt nur nicht referenzierte Bild-/Previewdatensätze und bricht bei
   ungültigen gespeicherten Metadaten vor jeder Löschung ab.
6. Gezielte Prüfung: 2 neue Testdateien mit 17 Tests bestanden. Vollständige
   Prüfung: `npm run verify` bestand mit 126 Testdateien und 799 Tests sowie
   erfolgreichem Typecheck und Produktionsbuild; einzige Ausgabe bleibt die
   bekannte Vite-Warnung zum über 500 kB großen Hauptchunk.
7. `git diff --check` ist sauber. Prompt 35 wurde nicht begonnen; Lifecycle-
   Provider und UI bleiben die nächste getrennte Aufgabe.

## Prompt 28 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `b708a3b`
- Ausgangs-Remote: `https://github.com/kleiveist/PixelartPromptStudio.git`
- GitHub CLI: als `kleiveist` angemeldet; Remote-Rename wird vor der lokalen
  URL-Änderung gegen GitHub geprüft
- Baseline: `npm run verify` erfolgreich mit 107 Testdateien und 614 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: Dachmarke und beide Modulnamen zentral typisiert; npm-Paket und
  sichtbare Produkttexte umbenannt; Prompt-Export-ID, Storage-Keys sowie
  Schema-/Formatversion 2 unverändert; Altbundle-Regression grün
- Grenze: keine Studio-Shell, keine neue Navigation und kein Prompt 29

## Prompt 28 — Ergebnis

1. Das private GitHub-Repository wurde mit bestätigtem `ADMIN`-Recht zu
   `kleiveist/PixelForgeStudio` umbenannt; `origin` verwendet weiterhin HTTPS
   und zeigt auf den neuen Namen.
2. npm-Paket, HTML-Metadaten, README und sichtbare Dachmarke verwenden
   `PixelForge Studio`; die Paketversion bleibt `2.0.0`.
3. `BRAND` veröffentlicht Dachprodukt sowie Prompt- und Animationsmodul zentral
   typisiert. Bestehende Prompt-Ausgaben verwenden weiterhin exakt
   `PixelForge Prompt Studio`; die Animations-ID ist nur reserviert.
4. Storage-Namespaces, Schema-/Formatversion 2, Promptdefaults und
   Profilauflösung wurden nicht verändert. Alte ExportBundles bleiben lesbar.
5. Gezielte Prüfung: 3 Testdateien und 37 Tests bestanden. Vollständige
   Prüfung: 108 Testdateien und 617 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. Prompt 29 wurde nicht begonnen. Die bestehende Prompt-Studio-App-Shell und
   Navigation bleiben funktional unverändert.

## Prompt 29 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `2dc6b20`
- Baseline: `npm run verify` erfolgreich mit 108 Testdateien und 617 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Bestehende URL: `?view=<PromptStudioView>` mit sechs stabilen Prompt-Views
- Abnahme: typisierte Dachrouten für Home, Prompt Studio und Animation Studio;
  strukturierter Parser, kanonischer Serializer, StableId-Projektparameter,
  Browser-History und Übergangsaliase für die bestehende Prompt-Oberfläche
- Grenze: keine sichtbare Studio-Shell, keine Animationsprojektlogik und kein
  Prompt 30

## Prompt 29 — URL-Matrix

| Form | Ergebnis |
|---|---|
| `?studio=home` | kanonische Home-Route |
| `?studio=prompt&view=<PromptStudioView>` | kanonische Prompt-Route |
| `?studio=animation&view=<AnimationStudioView>` | kanonische Animationsroute |
| `?studio=animation&view=workspace&project=<StableId>` | kanonischer Workspace mit Projekt |
| `?view=<PromptStudioView>` | gültige Bestandsroute; wird mit `replaceState` kanonisiert |
| ohne kontrollierte Routenparameter | injizierter Prompt-Fallback |
| unbekannte, unvollständige oder doppelte kontrollierte Parameter | strukturiert ungültig; injizierter Fallback |

## Prompt 29 — Ergebnis

1. `StudioId`, beide Modulkataloge und die diskriminierte `StudioRoute` sind
   readonly und öffentlich verfügbar; nur der Animation-Workspace darf eine
   validierte `StableId` als Projekt führen.
2. Der pure Parser unterscheidet kanonische, fehlende, gültige Legacy- und
   strukturiert ungültige Routen. Der Serializer ist roundtrip-stabil, erhält
   fremde Parameter und akzeptiert kontrollierte Dopplungen nicht still.
3. Browseradapter und Navigation-Provider führen vollständige Studio-Routen.
   Legacy-URLs und Fallbacks werden mit `replaceState` kanonisiert; explizite
   Navigation verwendet `pushState`, und `popstate` hält URL und Context synchron.
4. Die bestehende Prompt-Shell kompiliert über klar markierte Übergangsaliase
   weiter. Ihre sechs Views, Settings-V2-Verträge, Storage-Keys, Promptdaten und
   sichtbare Struktur wurden nicht verändert.
5. Gezielte Prüfung: 6 Testdateien und 76 Tests bestanden. Vollständige Prüfung:
   110 Testdateien und 658 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. PyGitIndex ist aktuell und alle 43 Paketchecksummen sind gültig. Prompt 30
   wurde nicht begonnen.

## Prompt 30 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `11d44a7`
- Baseline: `npm run verify` erfolgreich mit 110 Testdateien und 658 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: globale Dach-Shell mit Home-Brandlink, semantischem Modulumschalter,
  globalem Theme/Skip-Link und sichtbarem Modulkontext; unveränderte sechs
  Prompt-Views; vier zugängliche Animation-Placeholder-Views
- Grenze: keine Animationsdomain, kein IndexedDB/Canvas, keine produktive
  Home-Datenfläche und kein Prompt 31

## Prompt 30 — Ergebnis

1. `StudioShell` besitzt den einzigen globalen Header, Brandlink, Skip-Link,
   Theme-Umschalter, sichtbaren Modulkontext, Hauptbereich und Footer. Titel und
   Fokus folgen vollständigen Studio-Routen sowie neuen Wizard-Sessions.
2. `StudioSwitcher` ist eine echte Navigation aus zentralen Moduldefinitionen.
   Beide Ziele haben kanonische URLs; nur das aktive Modul trägt
   `aria-current="page"`.
3. Die bestehende Prompt-Oberfläche bleibt mit allen sechs Views und ihren
   Providern erhalten. Ein Modulwechsel verwirft weder Theme noch transienten
   Wizard-Zustand.
4. Animation Studio stellt Projekte, Workspace, Character Kits und
   Rig-Vorlagen als vier eindeutige, zugängliche Platzhalter bereit. Der
   Workspace ohne Projekt zeigt einen kontrollierten Empty State; Fachdomain,
   IndexedDB und Canvas bleiben bewusst ausstehend.
5. Alte `?view=`-URLs werden weiter ins Prompt Studio kanonisiert. Home,
   Prompt- und Animationsansichten erhalten routeabhängige Titel, genau eine H1
   und denselben fokussierbaren Hauptbereich.
6. Gezielte Prüfung: 7 Testdateien und 58 Tests bestanden. Vollständige
   Prüfung: 112 Testdateien und 669 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber. PyGitIndex meldet 63 unveränderte
   Markdown-Dateien, und alle 43 Paketchecksummen sind gültig.

## Prompt 31 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `f5510ce`
- Baseline: `npm run verify` erfolgreich mit 112 Testdateien und 669 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: additive AppSettings-V2-Defaults und pure Startziel-Helfer; drei
  getrennt persistierbare Startentscheidungen; produktive Studio-Home mit zwei
  gleichwertigen Modulkarten, vorhandenen Prompt-Zusammenfassungen und echtem
  Animation-Empty-State; Dashboard-Schnellaktionen und alte/neue Bundle-
  Kompatibilität
- Grenze: keine Schemaversion 3, keine Animationsdomain oder IndexedDB, keine
  automatische Projektöffnung und kein Prompt 32

## Prompt 31 — Ergebnis

1. `AppSettings` V2 besitzt additive Zod-Defaults für `startStudio: home` und
   `animationStartView: projects`; `startView` bleibt unverändert die Prompt-
   Startansicht. Alte strikte Settings und Export-Bundles werden ohne Write und
   ohne Schemaversionserhöhung normalisiert.
2. Pure Helfer lösen die Startdestination auf und ändern Dach-, Prompt- oder
   Animationsstart unabhängig. Der SettingsProvider bleibt die einzige
   UI-Mutationsgrenze; die drei Entscheidungen sind sichtbar persistierbar und
   melden nicht verfügbare beziehungsweise ungültige Writes explizit.
3. Die produktive Studio-Startseite bietet zwei gleichwertige Modulkarten,
   einen optional fortsetzbaren Prompt-Entwurf und letzte Prompt-Profile über
   bestehende Provider/Ports. Animation-Projekte bleiben bis Prompt 35 ein
   ehrlicher Empty State; Home schreibt keine Domainwerte.
4. Das Prompt-Dashboard behält den vollständigen Neun-Kategorien-Einstieg im
   Vordergrund und ergänzt darunter tastaturbedienbare Schnellaktionen zu Home
   und Animation.
5. Alte und neue Settings-/ExportBundle-Formen, jede Startdestination,
   Persistenzfehler, Home-Zusammenfassungen, Empty States, Tastatur und Fokus
   sind durch Domain-, Schema-, Transfer- und React-Tests abgedeckt.
6. Gezielte Prüfung: 8 Testdateien und 98 Tests bestanden. Vollständige
   Prüfung: 113 Testdateien und 684 Tests, Typecheck und Produktionsbuild
   bestanden; einzige Ausgabe ist die bekannte Vite-Warnung zum über 500 kB
   großen Hauptchunk. `git diff --check` ist sauber. PyGitIndex meldet 63
   unveränderte Markdown-Dateien, alle 43 Paketchecksummen sind gültig.
7. Phase A ist abgeschlossen. Prompt 32 ist als nächste Aufgabe dokumentiert,
   aber nicht begonnen; Animationsdomain, -schemas und IndexedDB bleiben offen.

## Nachtrag zu Prompt 31 — kompakte Home-Karten und Scrollstabilität

1. Routen- und Wizard-Fokus setzt weiterhin den semantischen Hauptbereich,
   verwendet dabei aber `preventScroll`. Brand-, Home-, Prompt- und
   Animationswechsel behalten dadurch die aktuelle Viewport-Position; der
   Skip-Link scrollt weiterhin bewusst zum Hauptinhalt.
2. Die beiden gleichwertigen Modulkarten besitzen eigene lokale, dekorative
   SVG-React-Illustrationen für Prompt-Erstellung beziehungsweise Rig/
   Timeline. Karte, Text und Aktionszeile begrenzen und umbrechen lange Inhalte
   innerhalb ihrer Fläche.
3. Letzter Prompt-Entwurf und Animation-Empty-State stehen als gleich breite,
   kompakte Aktivitätskarten nebeneinander. Letzte Prompt-Profile erhalten ein
   eigenes kompaktes Read-Model und zeigen nur Kategorie/Typ, Titel, Icon und
   gegebenenfalls den Favoritenstern; technische Fakten, Basisprofil,
   Materialien und Tags werden auf Home nicht mehr dargestellt.
4. Gezielte Prüfung: 2 Testdateien und 36 Tests bestanden. `npm run verify`
   bestand mit 113 Testdateien und 684 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. Die Shell-Regression trennt den zulässigen
   zeitgesteuerten Draft-Autosave von der exakt einmaligen Settings-Mutation.

## Prompt 32 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `bc25455`
- Baseline: `npm run verify` erfolgreich mit 113 Testdateien und 684 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: öffentliche, frameworkfreie `domain/animation` mit kanonischen
  Richtungen und SourceModes, vollständigem Production-Humanoid-Slotkatalog,
  stabiler Joint-/Bone-Topologie, readonly Grundtypen und Standardframe sowie
  getesteter Vektor-, Winkel- und affiner Matrixmathematik
- Grenze: keine Zod-Schemas, Persistenz, UI, Canvas, konkrete Gelenkpose,
  Renderingfunktion, Tier-/Fahrzeugrigs oder Arbeit an Prompt 33

## Prompt 32 — Ergebnis

1. `domain/animation/index.ts` veröffentlicht den stabilen Richtungskanon,
   alle drei SourceModes, Spiegel-/Gegenrichtungsauflösung und die je Modus
   exakt erforderlichen, unveränderlichen Quellrichtungen.
2. Der vollständige Production-Humanoid-Vertrag umfasst 15 Pflicht- und 24
   optionale Slots mit Domainlabels, zehn Gruppen und Required-Status. Alle 15
   Pflichtslots sind einmalig an eine gültige Parent-/Child-Joint-Kante
   gebunden; anatomische Seiten bleiben von visueller Spiegelung unabhängig.
3. 21 Joint- und 20 Bone-IDs bilden eine koordinatenfreie, deterministisch
   geordnete Topologie. Konkrete Neutralposen und Rigkoordinaten bleiben wie
   vorgesehen Prompt 38 vorbehalten.
4. Readonly Grundtypen, Mirror-/Rig-/Action-Kataloge und der unveränderliche
   `humanoid-80-v1`-Standard definieren 128 × 128 px, 80 px Figurenhöhe,
   Fußanker 64/112 und Contract-Version 1.
5. Pure Vektor-, Radiantwinkel- und affine Matrixfunktionen decken Addition,
   Subtraktion, Länge, Nullvektor, Clamp, Normalisierung, Identity,
   Komposition, Anwendung, Inversion und Roundtrip ab. Die Domain enthält
   keine React-, Zod-, DOM-, Canvas-, Storage- oder IndexedDB-Abhängigkeit.
6. Gezielte Prüfung: 5 Testdateien und 38 Tests bestanden. `npm run verify`
   bestand mit 118 Testdateien und 722 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. PyGitIndex meldet 63 unveränderte Markdown-
   Seiten, und alle 43 Paketchecksummen sind gültig.
7. Prompt 33 wurde nicht begonnen. Animationsschemas, Persistenz, konkrete
   Posen, Rendering und UI bleiben bewusst nachfolgenden Einzelprompts
   vorbehalten.

## Prompt 33 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `cbaac06`
- Baseline: `npm run verify` erfolgreich mit 118 Testdateien und 722 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: getrennte strikte Zod-V1-Schemas für Animationsprojekt, Part,
  Character Kit und Bundlegraph; aus Zod abgeleitete readonly Typen;
  Cross-Field-Prüfungen für Anker/Trim, eindeutige IDs, Walk-Frames,
  Overrides und Bundle-Referenzen; separate Draft-Produktionsvalidierung
- Grenze: keine Persistenz, IndexedDB, Blobs/Base64 im JSON, UI, Projekt-
  Provider, konkrete Rigdaten, Schemaänderung an Prompt-V2 oder Prompt 34

## Prompt 33 — Ergebnis

1. Projekt, PartAsset und Character Kit besitzen getrennte, strikte
   `schemaVersion: 1`-Schemas; das `.pfanim`-Manifest verwendet unabhängig
   `formatVersion: 1` und den stabilen Animation-Application-Identifier.
   Sämtliche öffentlichen Metadatentypen werden mit `z.infer` abgeleitet.
2. Gemeinsame Zod-Primitives validieren finite Pixelkoordinaten, positive
   Dimensionen, Frameprofile, Source-Anker, Trim-Rechtecke und alle stabilen
   Direction-/SourceMode-/Slot-/Joint-/Mirror-/Rig-/Action-Domainwerte ohne
   Zahlen-Coercion oder unbekannte Keys.
3. Projektrefinements sichern eindeutige PartAsset-/Clip-IDs, exakt acht
   Frames pro V1-Walk, eindeutige Frameziele und Overrides auf vorhandene
   Clips, kanonische Richtungen und gültige Frameindizes. Ein leerer Draft
   bleibt absichtlich schema-validierbar.
4. PartAssets halten ausschließlich Blob-Referenzen; Source-Anker und Trim
   müssen vollständig im ungetrimmten Original liegen. Der Bundlegraph löst
   Projekt→PartAsset→Blob sowie optionale Previewreferenzen vollständig auf
   und lehnt fehlende oder doppelte IDs ab.
5. `validateAnimationProjectProductionSources()` trennt Produktionsreife von
   Schema-Gültigkeit und meldet fehlende Pflichtquellen je SourceMode,
   unbekannte PartAsset-Referenzen und fehlende Distalanker. Kein Blob,
   Base64, IndexedDB-, Canvas-, Storage- oder UI-Verhalten wurde vorgezogen.
6. Gezielte Prüfung: 6 Testdateien und 60 Tests bestanden. `npm run verify`
   bestand mit 124 Testdateien und 782 Tests sowie erfolgreichem Typecheck und
   Produktionsbuild; einzige Ausgabe bleibt die bekannte Vite-Warnung zum
   über 500 kB großen Hauptchunk. PyGitIndex meldet 64 aktuelle Markdown-
   Seiten, und alle 43 Aufgabenpaket-Prüfsummen sind gültig.
7. Prompt 34 wurde nicht begonnen. Der IndexedDB-Port, Browser-/Memoryadapter,
   Transaktionen und Binärspeicherung bleiben vollständig der nächsten
   Einzelaufgabe vorbehalten.

## Plan — Dokumentationsordnung

1. Aktive Leitdokumente von abgeschlossenen V2- und V1-Unterlagen trennen.
2. Historische Markdown-Dateien ohne Inhaltsverlust nach `docs/erledigt/`
   verschieben.
3. Prüfen, ob ausführbarer V1-JavaScript-Code übrig ist; TypeScript-
   Kompatibilitätscode und Migrationsfixtures erhalten.
4. Die offene Serie 28–51 separat ausweisen, ohne Prompt 28 zu beginnen.
5. Alle verschobenen Verweise aktualisieren und die Navigation mit
   PyGitIndex 2.1.0 neu erzeugen.
6. Links, Paketchecksummen, `npm run verify` und `git diff --check` prüfen.

## Ergebnis — Dokumentationsordnung

1. `ASSISTANT-MASTER-PROMPT.md`, `CODEX-V2-UMSETZUNGSANWEISUNG.md` und
   `LEGACY-V1-BASELINE.md` wurden bytegleich nach `docs/erledigt/` verschoben.
2. Direkt unter `docs/` verbleiben nur die drei weiterhin aktiven
   Prompt-Studio-Verträge und die Dokumentationsübersicht.
3. Ausführbarer V1-JavaScript-Code ist im Arbeitsbaum nicht mehr vorhanden.
   Die aktive TypeScript-Kompatibilitätsdomain und ihre Migrationsfixtures
   bleiben erhalten.
4. Die Prompts 28–51 sind als offene Serie verlinkt; Prompt 28 wurde nicht
   begonnen. Alle 43 SHA-256-Prüfungen des Pakets sind erfolgreich.
5. PyGitIndex 2.1.0 ist aktuell. Alle 64 Markdown-Dateien besitzen gültige
   lokale Links; `npm run verify` bestand mit 107 Testdateien und 614 Tests.

## Nachtrag — einsatzbereite Aufgabenstruktur

1. Die vollständige offene Serie liegt unter
   `docs/aufgaben/pixelforge-studio-v3/`.
2. Verbindliche Planungsunterlagen liegen unter `grundlagen/`, ausführbare
   Einzelaufträge unter `prompts/` und Übergabevorlagen unter `templates/`.
3. Alle Pfade in den Einzelprompts zeigen vom Repository-Root auf diese
   Struktur; der Einstieg erfolgt über `START_HERE.md`.
4. PyGitIndex indexiert die Aufgabenserie direkt. Die Prüfung aller neun
   Indizes meldet 58 eindeutige Einträge und keine Dopplungen.

## Übergabe

- Prompt 32 ist der nächste Einzelauftrag und beginnt erst nach einem neuen
  konkreten Auftrag.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
