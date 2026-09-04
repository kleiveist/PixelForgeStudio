import { useEffect, useRef } from "react";
import { ForgeMarkIcon } from "../components/icons/ForgeMarkIcon";
import {
  StudioLink,
  StudioSwitcher
} from "../components/navigation";
import { ThemeSwitcher } from "../components/theme";
import { Badge } from "../components/ui";
import { BRAND } from "../config";
import { studioRoutesEqual } from "../domain/navigation";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
import type { WizardStorage } from "../features/wizard";
import type { StableId } from "../schemas";
import type {
  LegacyV1StorageMigrationResult,
  OutputWorkspaceAdapter
} from "../services";
import { useNavigation } from "../store/navigation";
import { useWizardSession } from "../store/wizard";
import {
  AnimationStudioNavigation,
  AnimationStudioShell
} from "./AnimationStudioShell";
import {
  PromptStudioNavigation,
  PromptStudioShell
} from "./AppShell";
import styles from "./AppShell.module.css";
import { StudioHomeController } from "./StudioHomeController";
import {
  studioRouteContextLabel,
  studioRouteHeadingId,
  studioRouteTitle
} from "./studioViewConfig";

export interface StudioShellProps {
  readonly activeBaseProfileId: StableId | null;
  readonly createDraftId?: () => string;
  readonly now?: () => string;
  readonly outputAdapter: OutputWorkspaceAdapter;
  readonly startupMigration: LegacyV1StorageMigrationResult;
  readonly storageAdapter: DashboardStorage & WizardStorage;
}

export function StudioShell({
  activeBaseProfileId,
  createDraftId,
  now,
  outputAdapter,
  startupMigration,
  storageAdapter
}: StudioShellProps) {
  const { activeRoute } = useNavigation();
  const { sessionRevision } = useWizardSession();
  const mainRef = useRef<HTMLElement>(null);
  const previousRouteRef = useRef(activeRoute);
  const previousWizardSessionRevisionRef = useRef(sessionRevision);

  useEffect(() => {
    const previousTitle = document.title;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    document.title = studioRouteTitle(activeRoute);
    const routeChanged = !studioRoutesEqual(
      previousRouteRef.current,
      activeRoute
    );
    const wizardSessionChanged =
      activeRoute.studio === "prompt" &&
      activeRoute.view === "wizard" &&
      previousWizardSessionRevisionRef.current !== sessionRevision;

    if (routeChanged || wizardSessionChanged) {
      mainRef.current?.focus({ preventScroll: true });
    }
    previousRouteRef.current = activeRoute;
    previousWizardSessionRevisionRef.current = sessionRevision;
  }, [activeRoute, sessionRevision]);

  return (
    <>
      <a
        className={styles.skipLink}
        href="#main-content"
        onClick={() => mainRef.current?.focus()}
      >
        Zum Inhalt springen
      </a>

      <div
        className={styles.shell}
        data-active-studio={activeRoute.studio}
        data-studio-shell="true"
      >
        <header className={styles.header}>
          <div className={styles.topbar}>
            <StudioLink
              aria-label={`${BRAND.productName} – Startseite`}
              className={styles.brand}
              route={{ studio: "home" }}
            >
              <span className={styles.mark} aria-hidden="true">
                <ForgeMarkIcon />
              </span>
              <span>
                <strong>{BRAND.shortName}</strong>
                <small>Studio</small>
              </span>
            </StudioLink>

            <StudioSwitcher />

            <div className={styles.headerTools}>
              <Badge tone="accent">
                {studioRouteContextLabel(activeRoute)} · {BRAND.versionLabel}
              </Badge>
              <ThemeSwitcher />
            </div>
          </div>

          {activeRoute.studio === "prompt" ? (
            <PromptStudioNavigation />
          ) : null}
          {activeRoute.studio === "animation" ? (
            <AnimationStudioNavigation route={activeRoute} />
          ) : null}
        </header>

        <main
          ref={mainRef}
          id="main-content"
          className={styles.main}
          aria-labelledby={studioRouteHeadingId(activeRoute)}
          tabIndex={-1}
        >
          {activeRoute.studio === "home" ? (
            <StudioHomeController
              activeBaseProfileId={activeBaseProfileId}
              storageAdapter={storageAdapter}
            />
          ) : null}
          {activeRoute.studio === "prompt" ? (
            <PromptStudioShell
              activeBaseProfileId={activeBaseProfileId}
              {...(createDraftId ? { createDraftId } : {})}
              {...(now ? { now } : {})}
              outputAdapter={outputAdapter}
              startupMigration={startupMigration}
              storageAdapter={storageAdapter}
              view={activeRoute.view}
            />
          ) : null}
          {activeRoute.studio === "animation" ? (
            <AnimationStudioShell route={activeRoute} />
          ) : null}
        </main>

        <footer className={styles.footer}>
          <span>{BRAND.productName}</span>
          <span>Local-first · Keine Cloud erforderlich</span>
        </footer>
      </div>
    </>
  );
}
