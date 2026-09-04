<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — Accessibility- und Responsive-Audit

## Prüfstand

Stand: 3. September 2026, Prompt 26.

Die Prüfung kombiniert React-Testing-Library-Flows mit einer manuellen
visuellen Kontrolle echter Chromium-Screenshots. Der Browser lief mit der
produktiven Vite-Anwendung, realen CSS-Modulen, System-Theme-Emulation und
befüllten Schema-V2-Fixtures. Geprüft wurden diese Viewports:

| Klasse | Viewport |
|---|---:|
| Desktop | 1440 × 1000 px |
| Tablet | 768 × 1024 px |
| schmal | 360 × 800 px |

Alle sechs Shell-Ansichten wurden in einem leeren Zustand unter heller und
dunkler Systemvorgabe aufgenommen. Dashboard, Profilbibliothek, Wizard,
Review und Output wurden zusätzlich mit echten Profil- und Draft-Daten in
beiden Farbschemata geprüft. Der Prompt-25-Konvertierungszustand wurde separat
bei 360 px Breite kontrolliert. Die expliziten Einstellungen Hell, Dunkel und
System sind außerdem durch Provider-/UI-Tests abgesichert.

## Ergebnis

- Desktop, Tablet und 360-px-Ansicht besitzen nach der Korrektur kein
  horizontales Seiten-Overflow. Bei der befüllten Review-/Output-Ansicht sind
  `documentElement.scrollWidth`, `body.scrollWidth` und Viewportbreite jeweils
  360 px. Lange Profilnamen, Zusammenfassungen, technische Werte und Prompttext
  brechen innerhalb ihrer Panels um; nur der bewusst begrenzte Promptblock
  darf intern scrollen.
- Navigation, Filter, Kartenaktionen, Wizard-Felder, Dialoge,
  Konvertierungsoptionen, Output-Tabs und Exportaktionen bleiben erreichbar
  und werden im schmalen Layout gestapelt. Im befüllten Browserlauf gab es in
  diesen Ansichten keine sichtbaren unbenannten Buttons, Links oder
  Form-Controls.
- Die globale Fokusdarstellung verwendet einen 3-px-Ring mit 3-px-Abstand.
  Ein echter Tab-Lauf bis zum Output-Tab bestätigte `:focus-visible`, den Ring
  und den per Pfeiltaste wechselnden ausgewählten Tab.
- `prefers-reduced-motion: reduce` deaktiviert CSS-Übergänge vollständig,
  begrenzt Animationen auf einen Durchlauf von 1 ms, entfernt bewegte
  Hover-Transformationen und schaltet sanftes Scrollen ab. Im Browser betrug
  die berechnete Übergangsdauer am fokussierten Output-Tab `0s`.
- Fehlermeldungen sind Feldern zugeordnet oder als Status-/Alert-Regionen
  angekündigt. Bestätigungsdialoge besitzen Namen, Escape-Abbruch,
  Fokusbegrenzung und Fokusrückgabe. Nach dynamischen Wizard- und
  Konvertierungswechseln landet der Fokus am ersten relevanten Feld oder an
  der neuen Abschnittsüberschrift.
- In erzwungenen Systemfarben bleibt die Fokusfarbe über `Highlight`
  verfügbar. Dekorative Symbole sind für assistive Technik verborgen;
  bedeutungstragende Aktionen behalten einen sichtbaren Textnamen.

## Tastaturabdeckung

| Bereich | geprüfter Bedienpfad |
|---|---|
| App Shell | Skip-Link, sechs semantische Ziele, Enter-Navigation und Fokus auf dem Hauptinhalt nach Ansichtswechsel |
| Theme | native Radiogruppe, Pfeiltastenwechsel Hell ↔ Dunkel ↔ System und sichtbarer Fokus |
| Dashboard/Profile | Karten per Tastatur öffnen, Filterergebnis fokussieren, Löschen per Escape/Abbrechen schließen und Fokus zum Auslöser zurückgeben |
| Wizard | ungültiges Pflichtfeld fokussieren, nach erfolgreichem Weiter zur Schrittüberschrift wechseln und Recovery zum Hauptinhalt führen |
| Konvertierung | alle drei Untermodi fokussiert öffnen, Zurück-Fokus zum jeweiligen Auslöser, Erfolg zurück zu Review/Output |
| Output | roving Tab-Fokus mit Links/Rechts sowie Home/End, ausgewähltes Panel und sichtbarer Fokusring |

## Kontrastprüfung

Die semantischen Token wurden mit relativer WCAG-Luminanz gegen ihre realen
Flächen geprüft. Die jeweils schwächsten relevanten Werte bleiben über den
AA-Grenzen:

| Paar | Hell | Dunkel | Einordnung |
|---|---:|---:|---|
| Haupttext / Seite | 14,64:1 | 17,82:1 | normaler Text |
| gedämpfter Text / Panel | 7,13:1 | 8,80:1 | normaler Text |
| subtiler Text / Seite | 5,21:1 | 6,31:1 | normaler Text |
| inverser Text / Akzentaktion | 6,11:1 | 11,34:1 | normaler Text |
| Fokusring / Seite | 4,56:1 | 10,95:1 | UI-Indikator |
| Fokusring / Panel | 5,15:1 | 8,49:1 | UI-Indikator |
| Control-Rand / Control-Fläche | 3,36:1 | 4,54:1 | UI-Grenze |
| schwächster Kategorieakzent / Panel | 4,92:1 | 8,54:1 | Text/Status |

## Bekannte Grenze

Dies ist eine reproduzierbare Browser-, Screenshot- und DOM-Prüfung, aber
keine Zertifizierung mit jedem realen Screenreader, Betriebssystem-
Hochkontrastmodus oder Touchgerät. Solche Geräteprüfungen bleiben sinnvolle
plattformspezifische Qualitätssicherung. Prompt 26 veränderte weder
Fachdefaults noch Prompt-Engine, Persistenzmodell oder Legacy V1; Prompt 27
hat die übergreifende Release-Checkliste anschließend bestanden und die
ausführbare Legacy-UI entfernt. Die Abschlussmatrix steht in
`V2-RELEASE-ACCEPTANCE.md`.

## Erweiterung: Animation Workspace (Prompt 36)

Stand: 4. September 2026. Diese Ergänzung dokumentiert die automatisierte
DOM-/Interaktionsprüfung der neuen Workspace-Shell. Die ursprüngliche
Chromium-Screenshotmatrix oben bleibt der visuelle Prompt-26-Prüfstand; für
Prompt 36 werden keine neuen manuellen Geräte- oder Screenshotbefunde
behauptet.

| Breite | semantische Workspace-Projektion |
|---|---|
| ab 1120 px | Toolbar sowie Teileinventar, Viewport, Inspektor und Timeline gleichzeitig |
| 720–1119 px | Viewport und Timeline bleiben sichtbar; Teile und Eigenschaften werden über beschriftete Toggle-Buttons gewechselt |
| unter 720 px | roving Vier-Tab-Auswahl `Teile`, `Viewport`, `Eigenschaften`, `Timeline`; nur das aktive Paneel bleibt im DOM |

Die Layoutprojektion reagiert auf `resize`, persistiert aber keinen Paneel-
oder Auswahlzustand. Nach einem Wechsel erhält die Überschrift des neu
gerenderten Paneels Fokus. Die kleine Tabreihe unterstützt Links/Rechts sowie
Pos1/Ende; die Timeline besitzt eine eigene roving Radio-Auswahl für alle acht
Walk-Frames mit denselben Navigationstasten.

Der Viewport ist bewusst DOM-basiert und fokussierbar. Pfeiltasten verschieben
die Darstellung in 8-Pixel-Schritten, Umschalt + Pfeil in 32-Pixel-Schritten,
`+`/`-` wechseln ausschließlich zwischen 1×, 2×, 4×, 8×, 12× und 16×, und
Pos1 zentriert. Für Raster, Rig, Anker, Begrenzungsrahmen und Fußlinie bestehen
beschriftete Checkboxen sowie eine Textliste mit dem jeweiligen Ein-/Aus-
Status. Damit hängt keine canvasnahe Shell-Funktion ausschließlich von
Zeigerbedienung oder Farbe ab.

Play/Pause, Export und PNG-Import sind bis zu ihrer Fachimplementierung echte
deaktivierte Buttons und über `aria-describedby` mit sichtbaren Gründen
verbunden. Projekt-/Part-/Frame-Inspektorzustände verwenden Definition Lists
statt scheinbar editierbarer Fake-Felder. No-Project, Loading, Not-Found,
Repositoryfehler, leeres Projekt und nicht aufgelöste Part-/Blob-Referenzen
bleiben getrennte, textlich benannte Zustände.

Die Prompt-36-RTL-Abdeckung prüft zusätzlich die vollständige
Slotkatalogprojektion samt Required-/Optional-Status, nativen Richtungswechsel,
Frameauswahl per Maus und Tastatur, Zoom/Pan/Overlay-Wechsel, sichtbaren
Speicherstatus, Fokus nach responsiven Paneelwechseln sowie das Fehlen
fälschlich aktivierter Import-, Playback- und Exportaktionen.
