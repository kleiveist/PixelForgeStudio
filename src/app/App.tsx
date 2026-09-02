import type { NavigationAdapter } from "../services";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
import type { WizardStorage } from "../features/wizard";
import type { SettingsStorage } from "../store/settings";
import { SettingsProvider, useSettings } from "../store/settings";
import {
  ProfileLibraryProvider,
  type ProfileLibraryStorage
} from "../store/profiles";
import { NavigationProvider } from "../store/navigation";
import { WizardSessionProvider } from "../store/wizard";
import { AppShell } from "./AppShell";

export interface AppProps {
  readonly navigationAdapter: NavigationAdapter;
  readonly storageAdapter: SettingsStorage &
    DashboardStorage &
    ProfileLibraryStorage &
    WizardStorage;
  readonly now?: () => string;
  readonly createProfileId?: () => string;
  readonly createDraftId?: () => string;
}

function NavigationRoot({
  navigationAdapter,
  storageAdapter,
  now,
  createDraftId
}: Readonly<{
  navigationAdapter: NavigationAdapter;
  storageAdapter: DashboardStorage & WizardStorage;
  now?: () => string;
  createDraftId?: () => string;
}>) {
  const { settings } = useSettings();

  return (
    <NavigationProvider
      fallbackView={settings.startView}
      navigationAdapter={navigationAdapter}
    >
      <WizardSessionProvider>
        <AppShell
          activeBaseProfileId={settings.activeBaseProfileId}
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
  createDraftId
}: AppProps) {
  const optionalProviderProps = now ? { now } : {};
  const optionalProfileProviderProps = {
    ...(now ? { now } : {}),
    ...(createProfileId ? { createProfileId } : {})
  };
  return (
    <SettingsProvider storageAdapter={storageAdapter} {...optionalProviderProps}>
      <ProfileLibraryProvider
        storageAdapter={storageAdapter}
        {...optionalProfileProviderProps}
      >
        <NavigationRoot
          navigationAdapter={navigationAdapter}
          storageAdapter={storageAdapter}
          {...(now ? { now } : {})}
          {...(createDraftId ? { createDraftId } : {})}
        />
      </ProfileLibraryProvider>
    </SettingsProvider>
  );
}
