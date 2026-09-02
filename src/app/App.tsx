import type { NavigationAdapter } from "../services";
import type { DashboardStorage } from "../features/dashboard/dashboardData";
import type { SettingsStorage } from "../store/settings";
import { SettingsProvider, useSettings } from "../store/settings";
import { NavigationProvider } from "../store/navigation";
import { WizardSessionProvider } from "../store/wizard";
import { AppShell } from "./AppShell";

export interface AppProps {
  readonly navigationAdapter: NavigationAdapter;
  readonly storageAdapter: SettingsStorage & DashboardStorage;
  readonly now?: () => string;
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

export function App({ navigationAdapter, storageAdapter, now }: AppProps) {
  const optionalProviderProps = now ? { now } : {};
  return (
    <SettingsProvider storageAdapter={storageAdapter} {...optionalProviderProps}>
      <NavigationRoot
        navigationAdapter={navigationAdapter}
        storageAdapter={storageAdapter}
      />
    </SettingsProvider>
  );
}
