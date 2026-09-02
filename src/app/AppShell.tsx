import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { ForgeMarkIcon } from "../components/icons/ForgeMarkIcon";
import { ThemeSwitcher } from "../components/theme";
import { Badge } from "../components/ui";
import { BRAND } from "../config";
import { APP_VIEW_IDS, type AppView } from "../domain/navigation";
import { PlaceholderView } from "../features/app-views/PlaceholderView";
import { DashboardView } from "../features/dashboard/DashboardView";
import { useNavigation } from "../store/navigation";
import { APP_VIEW_DEFINITIONS } from "./appViewConfig";
import styles from "./AppShell.module.css";

interface AppViewLinkProps {
  readonly children: ReactNode;
  readonly className: string | undefined;
  readonly indicateCurrent?: boolean;
  readonly view: AppView;
}

function shouldHandleInternally(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function AppViewLink({
  children,
  className,
  indicateCurrent = false,
  view
}: AppViewLinkProps) {
  const { activeView, hrefFor, navigate } = useNavigation();

  return (
    <a
      aria-current={indicateCurrent && activeView === view ? "page" : undefined}
      className={className}
      href={hrefFor(view)}
      onClick={(event) => {
        if (!shouldHandleInternally(event)) return;
        event.preventDefault();
        navigate(view);
      }}
    >
      {children}
    </a>
  );
}

function ActiveView({ view }: Readonly<{ view: AppView }>) {
  if (view === "dashboard") return <DashboardView />;

  return (
    <PlaceholderView definition={APP_VIEW_DEFINITIONS[view]} view={view} />
  );
}

export function AppShell() {
  const { activeView } = useNavigation();
  const activeDefinition = APP_VIEW_DEFINITIONS[activeView];
  const mainRef = useRef<HTMLElement>(null);
  const previousViewRef = useRef(activeView);

  useEffect(() => {
    const previousTitle = document.title;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    document.title = `${activeDefinition.label} · ${BRAND.productName}`;
    if (previousViewRef.current !== activeView) {
      mainRef.current?.focus();
      previousViewRef.current = activeView;
    }
  }, [activeDefinition.label, activeView]);

  return (
    <>
      <a
        className={styles.skipLink}
        href="#main-content"
        onClick={() => mainRef.current?.focus()}
      >
        Zum Inhalt springen
      </a>

      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.topbar}>
            <AppViewLink className={styles.brand} view="dashboard">
              <span className={styles.mark} aria-hidden="true">
                <ForgeMarkIcon />
              </span>
              <span>
                <strong>{BRAND.shortName}</strong>
                <small>Prompt Studio</small>
              </span>
              <span className={styles.visuallyHidden}> – Startseite</span>
            </AppViewLink>

            <div className={styles.headerTools}>
              <Badge tone="accent">{BRAND.versionLabel} · Workspace</Badge>
              <ThemeSwitcher />
            </div>
          </div>

          <div className={styles.navigationRow}>
            <nav className={styles.primaryNavigation} aria-label="Hauptnavigation">
              <ul className={styles.navigationList}>
                {APP_VIEW_IDS.map((view) => (
                  <li key={view}>
                    <AppViewLink
                      className={styles.navigationLink}
                      indicateCurrent
                      view={view}
                    >
                      {APP_VIEW_DEFINITIONS[view].label}
                    </AppViewLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className={styles.quickNavigation} aria-label="Schnellaktionen">
              <AppViewLink className={styles.secondaryAction} view="profiles">
                Profile öffnen
              </AppViewLink>
              <AppViewLink className={styles.primaryAction} view="wizard">
                <span aria-hidden="true">＋</span>
                Neues Asset
              </AppViewLink>
            </nav>
          </div>
        </header>

        <main
          ref={mainRef}
          id="main-content"
          className={styles.main}
          aria-labelledby={`${activeView}-view-title`}
          tabIndex={-1}
        >
          <ActiveView view={activeView} />
        </main>

        <footer className={styles.footer}>
          <span>{BRAND.productName}</span>
          <span>Local-first · Keine Cloud erforderlich</span>
        </footer>
      </div>
    </>
  );
}
