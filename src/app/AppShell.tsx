import { useCallback, useEffect, useRef } from "react";
import { ForgeMarkIcon } from "../components/icons/ForgeMarkIcon";
import { ViewLink } from "../components/navigation";
import { ThemeSwitcher } from "../components/theme";
import { Badge } from "../components/ui";
import { BRAND } from "../config";
import { APP_VIEW_IDS, type AppView } from "../domain/navigation";
import type { AssetCategory } from "../domain/assets";
import { PlaceholderView } from "../features/app-views/PlaceholderView";
import { ProfileLibraryView } from "../features/profiles";
import {
  DashboardView,
  type DashboardViewProps
} from "../features/dashboard/DashboardView";
import { getDashboardCategory } from "../features/dashboard/dashboardCatalog";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
import type { StableId } from "../schemas";
import { useNavigation } from "../store/navigation";
import { useSettings } from "../store/settings";
import { useWizardSession, type WizardStartIntent } from "../store/wizard";
import { APP_VIEW_DEFINITIONS } from "./appViewConfig";
import styles from "./AppShell.module.css";

interface ActiveViewProps {
  readonly activeBaseProfileId: StableId | null;
  readonly onOpenProfile: (profileId: StableId) => void;
  readonly onProfileDeleted: (profileId: StableId) => void;
  readonly onResumeDraft: (draftId: StableId) => void;
  readonly onSelectBaseProfile: DashboardViewProps["onSelectBaseProfile"];
  readonly onStartNewAsset: (category: AssetCategory | null) => void;
  readonly startIntent: WizardStartIntent | null;
  readonly storageAdapter: DashboardStorage;
  readonly view: AppView;
}

function wizardNotice(startIntent: WizardStartIntent | null) {
  if (!startIntent) return undefined;

  switch (startIntent.kind) {
    case "newAsset":
      return startIntent.category
        ? {
            label: "Startkategorie",
            value: getDashboardCategory(startIntent.category).label
          }
        : { label: "Neues Asset", value: "Kategorieauswahl offen" };
    case "profile":
      return { label: "Profilstart", value: startIntent.assetProfileId };
    case "resume":
      return { label: "Entwurf fortsetzen", value: startIntent.draftId };
  }
}

function ActiveView({
  activeBaseProfileId,
  onOpenProfile,
  onProfileDeleted,
  onResumeDraft,
  onSelectBaseProfile,
  onStartNewAsset,
  startIntent,
  storageAdapter,
  view
}: ActiveViewProps) {
  if (view === "dashboard") {
    return (
      <DashboardView
        activeBaseProfileId={activeBaseProfileId}
        storageAdapter={storageAdapter}
        onStartNewAsset={onStartNewAsset}
        onOpenProfile={onOpenProfile}
        onResumeDraft={onResumeDraft}
        onSelectBaseProfile={onSelectBaseProfile}
      />
    );
  }

  if (view === "profiles") {
    return (
      <ProfileLibraryView
        onLoadProfile={onOpenProfile}
        onProfileDeleted={onProfileDeleted}
        onStartNewAsset={() => onStartNewAsset(null)}
      />
    );
  }

  const notice = view === "wizard" ? wizardNotice(startIntent) : undefined;

  return (
    <PlaceholderView
      definition={APP_VIEW_DEFINITIONS[view]}
      {...(notice ? { notice } : {})}
      view={view}
    />
  );
}

export interface AppShellProps {
  readonly activeBaseProfileId: StableId | null;
  readonly storageAdapter: DashboardStorage;
}

export function AppShell({
  activeBaseProfileId,
  storageAdapter
}: AppShellProps) {
  const { activeView, navigate } = useNavigation();
  const {
    requestNewAsset,
    requestProfile,
    requestResume,
    clearProfileRequest,
    startIntent
  } = useWizardSession();
  const { setActiveBaseProfile } = useSettings();
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

  const startNewAsset = useCallback(
    (category: AssetCategory | null) => {
      requestNewAsset(category);
      navigate("wizard");
    },
    [navigate, requestNewAsset]
  );

  const openProfile = useCallback(
    (profileId: StableId) => {
      requestProfile(profileId);
      navigate("wizard");
    },
    [navigate, requestProfile]
  );

  const resumeDraft = useCallback(
    (draftId: StableId) => {
      requestResume(draftId);
      navigate("wizard");
    },
    [navigate, requestResume]
  );

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
            <ViewLink className={styles.brand} view="dashboard">
              <span className={styles.mark} aria-hidden="true">
                <ForgeMarkIcon />
              </span>
              <span>
                <strong>{BRAND.shortName}</strong>
                <small>Prompt Studio</small>
              </span>
              <span className={styles.visuallyHidden}> – Startseite</span>
            </ViewLink>

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
                    <ViewLink
                      className={styles.navigationLink}
                      indicateCurrent
                      view={view}
                    >
                      {APP_VIEW_DEFINITIONS[view].label}
                    </ViewLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className={styles.quickNavigation} aria-label="Schnellaktionen">
              <ViewLink className={styles.secondaryAction} view="profiles">
                Profile öffnen
              </ViewLink>
              <ViewLink
                className={styles.primaryAction}
                view="wizard"
                onNavigate={() => requestNewAsset(null)}
              >
                <span aria-hidden="true">＋</span>
                Neues Asset
              </ViewLink>
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
          <ActiveView
            activeBaseProfileId={activeBaseProfileId}
            onOpenProfile={openProfile}
            onProfileDeleted={clearProfileRequest}
            onResumeDraft={resumeDraft}
            onSelectBaseProfile={setActiveBaseProfile}
            onStartNewAsset={startNewAsset}
            startIntent={startIntent}
            storageAdapter={storageAdapter}
            view={activeView}
          />
        </main>

        <footer className={styles.footer}>
          <span>{BRAND.productName}</span>
          <span>Local-first · Keine Cloud erforderlich</span>
        </footer>
      </div>
    </>
  );
}
