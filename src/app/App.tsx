import { ForgeMarkIcon } from "../components/icons/ForgeMarkIcon";
import styles from "./App.module.css";

const foundationItems = [
  "React-Oberfläche mit Fast Refresh",
  "TypeScript im strikten Modus",
  "Vitest und Testing Library mit jsdom",
  "React Hook Form und Zod vorbereitet",
  "Legacy V1 separat und weiterhin prüfbar",
  "Lokale Architektur ohne Backend"
] as const;

export function App() {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Zum Inhalt springen
      </a>

      <div className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="./" aria-label="PixelForge Prompt Studio Startseite">
            <span className={styles.mark} aria-hidden="true">
              <ForgeMarkIcon />
            </span>
            <span>
              <strong>PixelForge</strong>
              <small>Prompt Studio</small>
            </span>
          </a>
          <span className={styles.versionBadge}>V2 Foundation</span>
        </header>

        <main id="main-content" className={styles.main}>
          <section className={styles.hero} aria-labelledby="foundation-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Migration · Phase 01</p>
              <h1 id="foundation-title">Das neue Produktionsstudio hat ein solides Fundament.</h1>
              <p className={styles.intro}>
                PixelForge läuft jetzt auf einer strikten React- und TypeScript-Architektur. Dashboard,
                Profilbibliothek und Wizard werden in den folgenden, einzeln geprüften Phasen darauf aufgebaut.
              </p>

              <div className={styles.statusLine} role="status">
                <span className={styles.statusDot} aria-hidden="true" />
                Grundgerüst bereit
              </div>
            </div>

            <div className={styles.visual} aria-hidden="true">
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <ForgeMarkIcon />
            </div>
          </section>

          <section className={styles.foundation} aria-labelledby="architecture-title">
            <div>
              <p className={styles.eyebrow}>Technischer Status</p>
              <h2 id="architecture-title">Bereit für die inkrementelle V2-Migration</h2>
              <p>
                Die aktive Oberfläche enthält bewusst noch kein vorgezogenes Dashboard und keine neue
                Fachlogik. So bleibt jede folgende Produktphase klein, überprüfbar und migrationssicher.
              </p>
            </div>

            <details className={styles.details}>
              <summary>Technische Grundlage anzeigen</summary>
              <ul>
                {foundationItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </section>
        </main>

        <footer className={styles.footer}>
          <span>PixelForge Prompt Studio</span>
          <span>Local-first · Keine Cloud erforderlich</span>
        </footer>
      </div>
    </>
  );
}
