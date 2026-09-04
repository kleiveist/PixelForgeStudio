# Changelog

## Unreleased

- Dachprodukt und Repository zu **PixelForge Studio** umbenannt und das
  npm-Paket auf `pixelforge-studio` umgestellt
- Prompt Studio und Animation Studio als getrennte, zentral typisierte
  Modulmarken ergänzt
- bestehenden Prompt-Export-Identifier, Schema-/Formatversion 2 und
  `pixelforge:v2:*`-Storage-Keys unverändert kompatibel gehalten
- typisierte, roundtrip-stabile Studio-Routen für Home, Prompt Studio und
  Animation Studio ohne zusätzliche Router-Abhängigkeit eingeführt
- bestehende `?view=`-Links per `replaceState` kanonisiert sowie kontrollierte
  Parameter, StableId-Projekte und Browser-Zurück/Vorwärts abgesichert

## 2.0.0 — 2026-09-03

- vollständige Prompt-27-Release-Abnahme für Migration, Dashboard, Profile,
  neun Spezialeditoren, Direction-Gating, vier Promptausgaben, JSON/TXT,
  Themes, Keyboard und Responsive dokumentiert
- produktiven migration-first Browser-Bootstrap ergänzt und den strukturierten
  V1-Migrationsstatus in Einstellungen sichtbar gemacht
- vollständigen validierten Workspace-JSON-Export/-Import mit expliziten
  Profil-ID-Konflikten sowie optionaler Settings-/Draft-Wiederherstellung
  umgesetzt
- ausführbare Legacy-V1 nach bestätigter automatisierter und manueller
  Parität entfernt; synthetische Migrations-/Promptverträge in den
  V2-Testbereich übernommen und den puren TypeScript-Port erhalten
- aktives Root-Projekt auf React 19, TypeScript strict, Vite 8 und npm migriert
- Vitest-, React-Testing-Library- und jsdom-Testfundament eingerichtet
- Legacy-V1 zu Beginn der Migration vollständig nach `legacy/v1/` verschoben
  und bis zur Release-Abnahme über eigene Scripts prüfbar gehalten
- minimale responsive V2-App-Shell mit CSS Modules, semantischen Tokens und lokalem SVG-Signet ergänzt
- V1-Defaults, State-Whitelist, Promptaufbau, Validierung und technische Metriken als frameworkfreie Strict-TypeScript-Domain portiert
- bytegenaue Vitest-Parität über Legacy-Referenz, synthetische Storage-Fixtures und SHA-256-Promptsignaturen abgesichert
- typsicheren V2-Katalog für neun Asset-Kategorien, ihre Untertypen und elf Pflicht-Capabilities ergänzt
- Richtungsoptionen zentral auf `directional` Assets begrenzt und Animation unabhängig davon modelliert
- Zod-Verträge für Base-, Kategorie- und Assetprofile, App-Einstellungen, Wizard-Entwürfe und Exportpakete ergänzt
- kategoriefremde Antworten, unbekannte Versionen und manipulierte Capability-Snapshots an der Parsegrenze abgesichert
- frameworkfreie Base→Category→Asset-Profilauflösung mit wirksamer Lock-Durchsetzung ergänzt
- strukturierte Referenz-, Pflichtwert- und Override-Konflikte sowie normalisierte Vererbungshinweise ergänzt
- versionierten deterministischen Compatibility Key eingeführt; irrelevante Figurenhöhe wird bei Nicht-Figuren ausgeschlossen
- injizierbaren V2-Storage-Adapter mit sechs kanonischen Namespaces, versionierten Collection-Envelopes und strukturierten Fehlerresultaten ergänzt
- referenzielle Profilbibliotheks- und Exportvalidierung einschließlich Locks und neu berechneter Compatibility Keys ergänzt
- exaktes V1-Rohdaten-Backup, deterministische Base-/Category-/Asset-Migration und idempotenten `prepared`/`completed`-Wiederanlauf umgesetzt
- alle 18 V1-Assettypen explizit migriert und den fehlenden V2-Item-Untertyp `weapon` ergänzt
- isolierte Migrationsprovenienz über `migratedFromVersion` und JSON-validiertes `legacyData` ergänzt
- V2-JSON-Roundtrip, abhängigkeitsschließende Teil-Exporte und sichtbare Importkonflikte ohne stilles Überschreiben umgesetzt
- zentrale, frameworkunabhängige Marken- und Theme-Verträge ergänzt; der stabile Exportformat-Identifier bleibt vom visuellen Branding getrennt
- validierten Settings-Context mit purem Reducer, lokal persistierter Light-/Dark-/System-Präferenz und live beobachteter Systemdarstellung umgesetzt
- aufgelöstes `data-theme="light|dark"` am Dokument-Root sowie fehlertolerante Fallbacks für korrupte oder nicht verfügbare Einstellungen ergänzt
- eigenständig gestaltete Light-/Dark-Tokenpaletten, kontraststarke Fokus-/Control-Tokens und Reduced-Motion-Grundregeln eingeführt
- zugänglichen Theme-Umschalter und wiederverwendbare `Badge`-/`Surface`-Basiskomponenten mit CSS Modules ergänzt
- responsive React-App-Shell mit Header, Primärnavigation, globalen Aktionen und sechs klar getrennten Hauptansichten umgesetzt
- Query-basierte interne Navigation ohne Router-Abhängigkeit ergänzt; gültige URL-Ansichten gewinnen vor `startView`, fehlende oder ungültige Werte werden ohne zusätzlichen History-Eintrag repariert
- Browser-Zurück/Vorwärts, aktive Ansicht, Tastaturbedienung, Skip-Link-Kompatibilität und StrictMode-Subscription mit injizierbarem Navigation-Adapter abgesichert
- technischen Dashboard-Platzhalter durch einen produktorientierten Hero, neun Asset-Karten, letzte Profile, Favoriten, persistierte Basisprofil-Schnellauswahl und Draft-Resume ersetzt
- exhaustive Kategorie-Metadaten sowie eigene lokale SVG-React-Icons für alle neun Asset-Arten und Material-Badges für Holz, Stein, Schnee, Eis, Metall, Stoff und Leder ergänzt
- reines Dashboard-Read-Model mit effektiver Profilauflösung, deterministischen Recent-/Favorite-Limits und capability-relevanten Kartenwerten eingeführt
- typisierten flüchtigen Wizard-Startintent für Kategorie-, Profil- und Resume-Einstiege ergänzt; Dashboard-Aktionen bleiben ohne vorgezogene Persistenz
- ehrliche Empty-/Invalid-/Unavailable-Zustände, native Tastaturinteraktionen und responsive Drei-/Zwei-/Ein-Spalten-Raster für das Dashboard abgesichert
- kategorisierte Profilbibliothek mit Suche, kombinierbaren Kategorie-/Basis-/Favoritenfiltern und erhaltener Filterauswahl über Ansichtswechsel ergänzt
- wählbare Gruppierung nach Asset-Kategorie oder neu aufgelöstem, opak behandeltem Compatibility Key umgesetzt
- separate zugängliche Profilaktionen für Wizard-Laden, Favorisieren, Duplizieren und bestätigt Löschen ergänzt
- immutable Assetprofil-Mutationen mit validiertem Gesamtgraph-Write, kollisionssicheren Duplikaten und referenzerhaltendem Leaf-only-Löschen eingeführt
- fehlgeschlagene oder teilweise Storage-Writes fail-closed behandelt und Invalid-/Unavailable-/Leer-/Filterleerzustände getrennt dargestellt
- relevante Profilkartendaten, Dialogfokus, Keyboard-Laden, Filterpersistenz und CRUD-Fehlerpfade mit Domain-, Provider- und RTL-Tests abgesichert
- generische, flow-konfigurierte React-Hook-Form-Wizard-Engine mit externen Step-Komponenten, Draft-Mapping, schrittweisen Zod-Resolvern, semantischem Fortschritt und fokusgeführter Vor-/Zurück-Navigation ergänzt
- validen 300-ms-Draft-Autosave, sofortige Schritt-Persistenz sowie exaktes schreibfreies Resume mit sichtbaren Fail-closed-Recovery-Zuständen umgesetzt
- aktiven Wizard-Draft, strukturelle Dirty-Baseline, ungültigen transienten Formularsnapshot und transienten/persistierten Sessionstatus über Ansichtswechsel und fokussierte Same-View-Neustarts hinweg im Context/Reducer abgesichert
- profilbasierte Wizard-Starts mit Elternreferenzen, Kategorieantworten, optionaler Asset-Provenienz und verlustfreiem technischem Override-Snapshot ergänzt
- portable Profil-Snapshots beim Resume erneut gegen aktuelle Locks geprüft und Quellprofil-Provenienz von der technischen Auflösung entkoppelt
- responsive technische Wizard-Zusammenfassung eingeführt, die portable, capability-relevante Profilwerte darstellt
- Hauptkategorie-vor-Untertyp-Routing mit neun zugänglichen Kategorieoptionen und vollständigem Taxonomieabgleich in den Wizard integriert
- deklarativ bedingte Wizard-Schritte ergänzt, sodass Richtung, Animation und Kachelbarkeit ausschließlich nach zentral aufgelöster Asset-Capability erscheinen
- Klassifikationswechsel bereinigen alte Kategorieantworten, Profilprovenienz, Validierung und irrelevante Figurenhöhen-Overrides ohne globale Basiswerte zu verlieren
- unvollständige Klassifikationswechsel als nicht persistierbare Zwischenstände modelliert, sodass Vor-/Zurück-Navigation keinen alten Profil-Draft zurückschreibt
- Capability- und kategoriespezifische Step-Schemas sowie NPC-, Holztextur-, Windbaum-, Pre-Base-Resume- und schreibfreie Hydrationsflows mit Routing- und RTL-Tests abgesichert
- verbindlichen Wizard-Einstieg `Projekt → Hauptkategorie/Untertyp → Basisprofil → Capability-Schritte` umgesetzt; Initialisierung, Profil-Hydration und Resume bleiben bis zur Nutzeraktion schreibfrei
- zugänglichen und responsiven Basisprofil-Schritt mit sichtbaren wirksamen Werten, Quellen und Locks sowie capability-relevanter Figurenhöhe, Weltgeometrie und Alpha-Konfiguration ergänzt
- entsperrte technische Abweichungen als minimale Asset-Level-Draft-Overrides normalisiert; redundante und irrelevante Werte werden nicht persistiert
- gesperrte Werte read-only dargestellt und einen expliziten Konfliktworkflow mit Abbruch, Profilwechsel, Duplikat oder neuer kanonischer Produktionsfamilie ergänzt
- immutable Anlage und Duplikation von Basisfamilien mit neuen IDs/Zeitstempeln und einem validierten vollständigen Profilgraph-Write umgesetzt; Originalfamilien und ihre Kindreferenzen bleiben unverändert
- generischen Wizard-Step-Vertrag um einen Hook für programmatische Mehrfeldänderungen erweitert, sodass gebündelte Basisprofilübernahmen dieselbe Draft-Projektion, Dirty-Logik und Autosave-Strecke wie native Eingaben verwenden
- frameworkfreien Character-Katalog mit typisierten Fachoptionen, NPC-/Humanoid-Untertypprüfungen, kanonischer Aktionsreihenfolge und Walk-Default von fünf Frames ergänzt
- strikt additives `CharacterAnswersSchema` für Identität, Körper, Gesicht, Kleidung, Ausrüstung, Material, Palette, Lesbarkeit und NPC-Kontext eingeführt; Grenzen und eindeutige `animationActions` mit jeweils 1 bis 8 Frames werden an der Zod-Grenze geprüft
- bestehenden Schema-V2-Character-Daten mit `animationAction` und `framesPerDirection` lesbar gehalten, während neue Wizard-Projektionen ausschließlich kanonisch sortierte `animationActions` schreiben
- eigenen Character-/NPC-Schritt unmittelbar nach der Basisprofilwahl integriert; NPC-Kontext und humanoide Kleidung werden nach Untertyp eingeblendet, Nicht-Character-Flows bleiben frei von Character-Fragen
- geerbte Figurenhöhe im Character-Editor read-only mit Quelle und Lock dargestellt und aus Assetantworten ausgeschlossen; Basisprofilwechsel erhalten Character-Inhalte, Klassifikationswechsel bereinigen sie
- Character-Richtungswahl weiterhin ausschließlich über `directional` auf 4/8 begrenzt und Animation separat als Multi-Aktionsauswahl mit individueller Framezahl umgesetzt
- Character-Fachwerte in RHF-Draft-Roundtrip, Dirty-State, Autosave, schreibfreies Resume, Live-Zusammenfassung und Dashboard-Aktivitätsprojektion integriert
- explizites Leeren geerbter Character-Defaults dauerhaft abgebildet: der Draft löst die Kategorieprovenienz, materialisiert übrige Fach- und Technikwerte und stellt entfernte Richtungen oder Animationen beim Resume nicht wieder her
- frameworkfreien Moving-Object-Katalog für Objektklasse, Bewegung, Anker, Mechanik, Material, Zustand, Licht, Schatten und kanonische Animationssequenzen ergänzt
- additives `MovingObjectAnswersSchema` um Produktionsdetails, Footprint-Achsen von 1 bis 64 Tiles, Höhen von 16 bis 2048 px sowie eindeutige `animationSequences` mit jeweils 1 bis 16 Frames erweitert
- bestehende Schema-V2-Moving-Object-Daten mit `animationType` und `framesPerDirection` schreibfrei lesbar gehalten, während neue Wizard-Projektionen ausschließlich kanonisch sortierte `animationSequences` schreiben
- eigenen `movingObjectDetails`-Schritt nach der Basisprofilwahl und einen getrennten Animationseditor eingeführt; Richtungsfragen bleiben ausschließlich an die `directional`-Capability gebunden
- Karren als richtungsfähigen Bewegungsfall und pulsierende schwebende Kristalle als animierte, nicht richtungsabhängige Assets in Domain-, Schema-, Routing- und UI-Verhalten abgesichert
- Moving-Object-Fachwerte in Base→Category→Asset-Auflösung, Rohzustand, Autosave, schreibfreies Resume, Live-Zusammenfassung und Dashboard-Aktivitätsprojektion integriert
- explizites Leeren geerbter Moving-Object-Defaults dauerhaft abgebildet: Kategorie-/Assetprovenienz wird gelöst, übrige wirksame Fach- und Technikwerte werden relativ zur Base materialisiert
- frameworkfreien Texture-/Material-Katalog für Materialtyp, Einsatz, Struktur, Zustand, Oberfläche, Feuchtigkeit, Vereisung, Licht und Orientierung ergänzt
- strikt additives `TextureAnswersSchema` um die neuen Materialfelder erweitert, bestehende Schema-V2-Texture-Werte ohne eager Defaults lesbar gehalten und widersprüchliche Untertyp-/Materialkombinationen abgewiesen
- eigenen `textureDetails`-Schritt mit fokussiertem `TextureMaterialEditor` direkt nach der Basisprofilwahl integriert; Materialtyp und zentrale Tilegröße werden read-only abgeleitet statt in Fachantworten dupliziert
- Nahtlosigkeit als dreiwertige Entscheidung „nicht festgelegt / ja / nein“ modelliert, den redundanten generischen Tileability-Schritt für Texturen ausgeblendet und Texture-Fachwerte in Rohzustand, Base→Category→Asset-Auflösung, minimale Draft-Projektion, Autosave sowie schreibfreies Resume integriert
- Holztexturen mit spezifischen Produktionshinweisen und alle Texturen ohne Figuren-, Kleidungs-, Bewegungs- oder Richtungsfragen umgesetzt
- explizites Leeren geerbter Texture-Defaults dauerhaft abgebildet und tatsächliche Material-, Kachel- und Oberflächenfakten in Live-Zusammenfassung sowie Dashboard-Projektion ergänzt
- frameworkfreien Nature-Katalog mit readonly Pflanzen-, Klima-, Saison-, Alters-, Silhouetten-, Anatomie-, Bewuchs-, Schnee-, Bodenanschluss- und Animationswerten sowie vollständigem Untertyp-/Pflanzentyp-Mapping ergänzt
- pure Stamm-, Kronen- und Wurzel-Guards eingeführt und im strikt additiven `NatureAnswersSchema` widersprüchliche Untertyp-/Pflanzentyp- sowie anatomisch irrelevante Felder abgewiesen; bestehende Schema-V2-Naturdaten bleiben ohne eager Defaults lesbar
- eigenen `natureDetails`-Schritt mit `NatureTreeEditor` direkt nach der Basisprofilwahl integriert; Pflanzentyp und zentrale Tilegröße werden read-only abgeleitet, ohne `tileSize` in Naturantworten zu duplizieren
- Art, Klima, Saison, Alter, Silhouette, untertypabhängige Anatomie, Moos, Pilze, Schnee, Ranken, vollständige 1–64-Tile-Standfläche, Bodenanschluss und 1–12 Varianten im fokussierten Natur-Editor umgesetzt
- Wind-/Magieanimation getrennt über `animated` modelliert und Naturassets konsequent ohne 4/8-Richtungsfrage gehalten
- Nature-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte untertypgültige Naturfakten in Live-Zusammenfassung und Dashboard ergänzt; defensive Pflanzentypkonflikte führen zum fokussierbaren Untertyp und durch die normale Autosave-Reparatur
- frameworkfreien Static-Object-Katalog mit vollständigem Untertyp-/Objektklassen-Mapping sowie typisierten Funktions-, Form-, Material-, Zustands-, Interaktions-, Animations- und Schattenwerten ergänzt
- strikt additives `StaticObjectAnswersSchema` um Produktionsdetails, vollständige 1–64-Tile-Standflächen und 1–12 Varianten erweitert; bestehende Schema-V2-Daten bleiben ohne eager Defaults lesbar und widersprüchliche Untertyp-/Klassenkombinationen werden abgewiesen
- eigenen `staticObjectDetails`-Schritt mit `StaticWorldObjectEditor` direkt nach der Basisprofilwahl integriert; Objektklasse und zentrale Tilegröße werden read-only abgeleitet, ohne technische Werte in Fachantworten zu duplizieren
- Static-Object-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte Fakten in Live-Zusammenfassung und Dashboard ergänzt
- Öffnen, Leuchten, Zerbrechen und individuelle Animation getrennt über `animated` modelliert und alle statischen Weltobjekte konsequent ohne 4/8-Richtungsfrage gehalten
- frameworkfreien Building-/Architecture-Katalog mit vollständigem Untertyp-/Gebäudetyp-Mapping sowie typisierten Grundriss-, Material-, Dach-, Fassaden-, Öffnungs-, Mapping-, Kollisions-, Licht- und Animationswerten ergänzt
- strikt additives `BuildingAnswersSchema` um vollständige 1–64-Tile-Footprints, Gebäudehöhe, Stockwerke, Materialien, Dach, Fassade, Türen, Fenster, Belegung, Mapping und Licht erweitert; bestehende Schema-V2-Daten bleiben ohne eager Defaults lesbar
- eigenen `buildingDetails`-Schritt mit `BuildingArchitectureEditor` direkt nach der Basisprofilwahl integriert; Gebäudetyp und technische Weltgeometrie werden read-only abgeleitet, ohne Tile-, Kamera-, Figuren- oder Richtungswerte in Fachantworten zu duplizieren
- Building-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte Architekturfakten in Live-Zusammenfassung und Dashboard ergänzt
- modulare Ausgabe auf Tor, Befestigung und Dungeon-Modul begrenzt, Toranimation getrennt über `animated` modelliert und alle Gebäude konsequent ohne 4/8-Richtungs- oder Figurenhöhenfrage gehalten
- frameworkfreien Tileset-Katalog mit vollständigem Untertyp-/Tiletyp-Mapping, puren Kanten-/Ecken-/Übergangs-Guards und deterministischer Atlasmetrik samt technischer Spezifikation ergänzt
- strikt additives `TilesetAnswersSchema` um Verbindungen, Materialgrenzen, Seam-/Wiederholungsregeln, Variantenarten und Atlasparameter erweitert; bestehende Schema-V2-Daten bleiben ohne eager Defaults lesbar
- eigenen `tilesetDetails`-Schritt mit `TilesetEditor` direkt nach der Basisprofilwahl integriert; Tiletyp, zentrale Tilegröße und Pixelmaßstab werden read-only abgeleitet und das technische Atlasraster live berechnet
- Tileset-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte Verbindungs- und Atlasfakten in Live-Zusammenfassung und Dashboard ergänzt
- frameworkfreien Item-/Equipment-Katalog mit vollständigem Untertyp-/Itemklassen-Mapping sowie typisierten Zweck-, Präsentations-, Material-, Zustands-, Bedeutungs-, Größen-, Lesbarkeits-, Glow- und Schattenwerten ergänzt
- strikt additives `ItemAnswersSchema` um Produktionsdetails, Icongröße und 1–12 Varianten erweitert; bestehende Schema-V2-Itemdaten bleiben ohne eager Defaults lesbar, Klassenkonflikte und capability-fremde Wearable-Daten werden abgewiesen
- eigenen `itemDetails`-Schritt mit `ItemEquipmentEditor` direkt nach der Basisprofilwahl integriert; Itemklasse, technischer Hintergrund, Tilegröße und Pixelmaßstab werden read-only gezeigt und nicht in Fachantworten dupliziert
- Item-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte Itemfakten und Materialbadges in Live-Zusammenfassung und Dashboard ergänzt; kein Item-Untertyp erhält Richtungs- oder Animationsfragen
- frameworkfreien Artwork-Katalog mit stabilen Zweck-, Motiv-, Kompositions-, Format-, Hintergrund-, Fokus-, Licht- und Detailwerten sowie vollständigem Untertyp→Artworktyp-Mapping ergänzt
- strikt additives `ArtworkAnswersSchema` um Motiv, Szene, Kompositionsdetails, Lichtdramaturgie und Detailgrad erweitert; bestehende Schema-V2-Artworks bleiben ohne eager Defaults lesbar und enthalten keine Tile-, Kamera-, Figuren-, Sprite-, Richtungs- oder Animationswerte
- eigenen `artworkDetails`-Schritt mit `ArtworkConceptEditor` direkt nach der Basisprofilwahl integriert; Artworktyp und allgemeine geerbte Art Direction werden read-only gezeigt, während freie Produktionsfragen React Hook Form gehören
- Artwork-Fachwerte in Base→Category→Asset-Auflösung, minimale Draft-Projektion, Explicit-Clear-Detach, transienten Rohzustand, Autosave und schreibfreies Resume integriert sowie kompakte Artworkfakten in Live-Zusammenfassung und Dashboard ergänzt; `freeComposition` hält Weltgeometrie aus neuer Projektion und Compatibility Key heraus
- Vitest-Zeitbudget für die auf 563 Tests angewachsene parallele Vollsuite auf 10 Sekunden stabilisiert, ohne Assertions oder Produktverhalten abzuschwächen
- generischen Tileability-Schritt für Tilesets durch den strukturierten Fachschritt ersetzt, alte Drafts schreibfrei umgeleitet, Animation nur für animierte Tiles separat angeboten und alle Tilesets ohne 4/8-Richtungs- oder Figurenhöhenfrage gehalten
- frameworkfreie Prompt Engine 2.0 mit zwölf fest geordneten puren TypeScript-Modulen für Basisprofil, Stil, Kategorie, Motiv, Materialien, Setting, Licht, Bewegung, Animation, Komposition, Negativregeln und Technik ergänzt
- immutable Haupt-, Negativ-, Technik- und kombinierte Ausgaben aus validierten `ResolvedProfile`-Werten eingeführt; `both` erzeugt getrennte klassische und düstere Pakete, Sprachen und Dubletten werden kanonisch normalisiert
- kategoriespezifische Promptregeln für alle neun Assetarten umgesetzt, Richtungssets strikt an `directional` gebunden und Kamera, Bodenanker sowie Weltlicht darin fixiert; freie Artworks bleiben ohne Spielraster-, Weltkamera-, Figuren-, Richtungs- und Animationsvorgaben
- NPC, Holztextur, Winterbaum, Gebäude, bewegliches Objekt, Artwork, alle Kategorien, bilinguale Stilpakete, irrelevante Fremddaten und wiederverwendete Tileset-Atlasmetriken mit neun Engine-Tests abgesichert
- reproduzierbare Legacy-V1-Migrationsbaseline mit synthetischen Storage-Fixtures und Promptsignaturen ergänzt
- verbindliche `AGENTS.md`-Projektanweisung für Codex ergänzt
- schrittweisen Ausführungsplan in `PLANS.md` angelegt
- vollständige V2-Zielarchitektur und Umsetzungsphasen dokumentiert
- Abfragekatalog für Charaktere, bewegliche und statische Objekte, Texturen, Natur, Gebäude, Tilesets, Items und Artwork definiert
- hierarchisches Profilmodell mit Basisprofilen, Sperren und Kompatibilitätsschlüsseln spezifiziert
- Capability-System zur Trennung von Bewegung, Richtungen und Animation dokumentiert
- 25 einzeln ausführbare Codex-Arbeitsprompts plus Review- und Universalprompt ergänzt

## 1.0.0 – 2026-09-02

- vollständige modulare Webanwendung angelegt
- zwei getrennte Fantasy-Stilprofile eingebaut
- feste frontale 3/4-RPG-Kamera und orthografische Projektion definiert
- 32 × 32 px Tile-Raster und 80 px Figurenstandard festgelegt
- 4- und 8-Richtungssets mit berechnetem Sheet-Layout ergänzt
- adaptive Lichtmatrix für Tag, Nacht, Innenräume und düstere Stimmungen umgesetzt
- transparenter Alpha-Hintergrund und wählbare Schattenlogik ergänzt
- dynamische Haupt-, Negativ- und Technikprompts umgesetzt
- lokale Presets, Autospeicherung, JSON-Import und Exporte ergänzt
- automatische Syntax-, Struktur- und Prompt-Tests eingerichtet
- Startskripte für Windows, Linux und macOS ergänzt
