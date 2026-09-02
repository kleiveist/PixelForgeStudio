import { ThemeSwitcher } from "../components/theme";
import { ForgeMarkIcon } from "../components/icons/ForgeMarkIcon";
import { Badge, Surface } from "../components/ui";
import { BRAND } from "../config";
import type { SettingsStorage } from "../store/settings";
import { SettingsProvider } from "../store/settings";
import styles from "./App.module.css";

const designFoundations = [
  {
    label: "Darstellung",
    value: "Hell · Dunkel · System",
    note: "Die gewählte Arbeitsumgebung bleibt lokal gespeichert."
  },
  {
    label: "Oberfläche",
    value: "Semantische Tokens",
    note: "Kontrast, Tiefe und Fokus bleiben in jedem Modus eindeutig."
  },
  {
    label: "Architektur",
    value: "React Context · Reducer",
    note: "Präferenz und wirksames System-Theme sind sauber getrennt."
  }
] as const;

export interface AppProps {
  readonly storageAdapter: SettingsStorage;
  readonly now?: () => string;
}

function StudioFoundation() {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Zum Inhalt springen
      </a>

      <div className={styles.shell}>
        <header className={styles.header}>
          <a
            className={styles.brand}
            href="./"
            aria-label={`${BRAND.productName} Startseite`}
          >
            <span className={styles.mark} aria-hidden="true">
              <ForgeMarkIcon />
            </span>
            <span>
              <strong>{BRAND.shortName}</strong>
              <small>Prompt Studio</small>
            </span>
          </a>

          <div className={styles.headerTools}>
            <Badge tone="accent">{BRAND.versionLabel} · Design System</Badge>
            <ThemeSwitcher />
          </div>
        </header>

        <main id="main-content" className={styles.main}>
          <Surface
            as="section"
            className={styles.hero}
            tone="raised"
            aria-labelledby="foundation-title"
          >
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Visuelles Fundament · Phase 07</p>
              <h1 id="foundation-title">
                Ein Studio, das sich deiner Arbeitsumgebung anpasst.
              </h1>
              <p className={styles.intro}>
                {BRAND.tagline}. Das neue Theme-System hält Oberfläche,
                Kontrast und Fokus in hellen wie dunklen Umgebungen konsistent.
              </p>

              <Badge className={styles.statusBadge} tone="success" role="status">
                <span className={styles.statusDot} aria-hidden="true" />
                Visuelles Fundament bereit
              </Badge>
            </div>

            <div className={styles.visual} aria-hidden="true">
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <span className={styles.pixel} />
              <ForgeMarkIcon />
              <span className={styles.visualLabel}>PF · {BRAND.versionLabel}</span>
            </div>
          </Surface>

          <Surface
            as="section"
            className={styles.foundation}
            tone="soft"
            aria-labelledby="design-system-title"
          >
            <div className={styles.foundationIntro}>
              <p className={styles.eyebrow}>Designsystem</p>
              <h2 id="design-system-title">
                Drei Modi, eine konsistente Produktionsoberfläche
              </h2>
              <p>
                Die Basiskomponenten verwenden ausschließlich semantische
                Farb-, Abstands-, Fokus- und Bewegungstokens. Weitere Ansichten
                können ohne eigene Theme-Sonderfälle darauf aufbauen.
              </p>
            </div>

            <dl className={styles.foundationGrid}>
              {designFoundations.map((item) => (
                <div className={styles.foundationItem} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                  <dd className={styles.foundationNote}>{item.note}</dd>
                </div>
              ))}
            </dl>
          </Surface>
        </main>

        <footer className={styles.footer}>
          <span>{BRAND.productName}</span>
          <span>Local-first · Keine Cloud erforderlich</span>
        </footer>
      </div>
    </>
  );
}

export function App({ storageAdapter, now }: AppProps) {
  const optionalProviderProps = now ? { now } : {};
  return (
    <SettingsProvider storageAdapter={storageAdapter} {...optionalProviderProps}>
      <StudioFoundation />
    </SettingsProvider>
  );
}
