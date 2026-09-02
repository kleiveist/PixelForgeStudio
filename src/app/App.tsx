import type { NavigationAdapter } from "../services";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
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
    ProfileLibraryStorage;
  readonly now?: () => string;
  readonly createProfileId?: () => string;
}

function NavigationRoot({
  navigationAdapter,
  storageAdapter
}: Readonly<{
  navigationAdapter: NavigationAdapter;
  storageAdapter: DashboardStorage;
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
        />
      </WizardSessionProvider>
    </NavigationProvider>
  );
}

export function App({
  navigationAdapter,
  storageAdapter,
  now,
  createProfileId
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
        />
      </ProfileLibraryProvider>
    </SettingsProvider>
  );
}
