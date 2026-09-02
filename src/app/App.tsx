import type { NavigationAdapter } from "../services";
import type { SettingsStorage } from "../store/settings";
import { SettingsProvider, useSettings } from "../store/settings";
import { NavigationProvider } from "../store/navigation";
import { AppShell } from "./AppShell";

export interface AppProps {
  readonly navigationAdapter: NavigationAdapter;
  readonly storageAdapter: SettingsStorage;
  readonly now?: () => string;
}

function NavigationRoot({
  navigationAdapter
}: Readonly<{ navigationAdapter: NavigationAdapter }>) {
  const { settings } = useSettings();

  return (
    <NavigationProvider
      fallbackView={settings.startView}
      navigationAdapter={navigationAdapter}
    >
      <AppShell />
    </NavigationProvider>
  );
}

export function App({ navigationAdapter, storageAdapter, now }: AppProps) {
  const optionalProviderProps = now ? { now } : {};
  return (
    <SettingsProvider storageAdapter={storageAdapter} {...optionalProviderProps}>
      <NavigationRoot navigationAdapter={navigationAdapter} />
    </SettingsProvider>
  );
}
