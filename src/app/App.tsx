import { useMemo } from "react";
import {
  createBrowserOutputWorkspaceAdapter,
  type LegacyV1StorageMigrationResult,
  type NavigationAdapter,
  type OutputWorkspaceAdapter
} from "../services";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
import type { WizardStorage } from "../features/wizard";
import type { SettingsStorage } from "../store/settings";
import {
  SettingsProvider,
  resolveStudioStartRoute,
  useSettings
} from "../store/settings";
import {
  ProfileLibraryProvider,
  type ProfileLibraryStorage
} from "../store/profiles";
import { NavigationProvider } from "../store/navigation";
import { WizardSessionProvider } from "../store/wizard";
import { StudioShell } from "./StudioShell";

export interface AppProps {
  readonly navigationAdapter: NavigationAdapter;
  readonly storageAdapter: SettingsStorage &
    DashboardStorage &
    ProfileLibraryStorage &
    WizardStorage;
  readonly now?: () => string;
  readonly createProfileId?: () => string;
  readonly createBaseProfileId?: () => string;
  readonly createDraftId?: () => string;
  readonly outputAdapter?: OutputWorkspaceAdapter;
  readonly startupMigration?: LegacyV1StorageMigrationResult;
}

function NavigationRoot({
  navigationAdapter,
  storageAdapter,
  outputAdapter,
  startupMigration,
  now,
  createDraftId
}: Readonly<{
  navigationAdapter: NavigationAdapter;
  storageAdapter: DashboardStorage & WizardStorage;
  outputAdapter: OutputWorkspaceAdapter;
  startupMigration: LegacyV1StorageMigrationResult;
  now?: () => string;
  createDraftId?: () => string;
}>) {
  const { settings } = useSettings();
  const fallbackRoute = useMemo(
    () => resolveStudioStartRoute(settings),
    [settings.startView]
  );

  return (
    <NavigationProvider
      fallbackRoute={fallbackRoute}
      fallbackView={settings.startView}
      navigationAdapter={navigationAdapter}
    >
      <WizardSessionProvider>
        <StudioShell
          activeBaseProfileId={settings.activeBaseProfileId}
          outputAdapter={outputAdapter}
          startupMigration={startupMigration}
          storageAdapter={storageAdapter}
          {...(now ? { now } : {})}
          {...(createDraftId ? { createDraftId } : {})}
        />
      </WizardSessionProvider>
    </NavigationProvider>
  );
}

export function App({
  navigationAdapter,
  storageAdapter,
  now,
  createProfileId,
  createBaseProfileId,
  createDraftId,
  outputAdapter = createBrowserOutputWorkspaceAdapter(),
  startupMigration = { status: "notNeeded" }
}: AppProps) {
  const optionalProviderProps = now ? { now } : {};
  const optionalProfileProviderProps = {
    ...(now ? { now } : {}),
    ...(createProfileId ? { createProfileId } : {}),
    ...(createBaseProfileId ? { createBaseProfileId } : {})
  };
  return (
    <SettingsProvider storageAdapter={storageAdapter} {...optionalProviderProps}>
      <ProfileLibraryProvider
        storageAdapter={storageAdapter}
        {...optionalProfileProviderProps}
      >
        <NavigationRoot
          navigationAdapter={navigationAdapter}
          outputAdapter={outputAdapter}
          startupMigration={startupMigration}
          storageAdapter={storageAdapter}
          {...(now ? { now } : {})}
          {...(createDraftId ? { createDraftId } : {})}
        />
      </ProfileLibraryProvider>
    </SettingsProvider>
  );
}
