import { useCallback, useMemo } from "react";
import {
  createBrowserOutputWorkspaceAdapter,
  createBrowserImageDecoder,
  type AnimationRepository,
  type ImageDecoder,
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
import {
  AnimationProjectProvider,
  useAnimationProject
} from "../store/animation";
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
  readonly animationRepository?: AnimationRepository | null;
  readonly animationRepositoryUnavailableMessage?: string;
  readonly createAnimationProjectId?: () => string;
  readonly createAnimationClipId?: () => string;
  readonly createAnimationPartAssetId?: () => string;
  readonly createAnimationImageBlobId?: () => string;
  readonly animationAutosaveDelayMs?: number;
  readonly animationImageDecoder?: ImageDecoder;
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
  const { projectDirty } = useAnimationProject();
  const fallbackRoute = useMemo(
    () => resolveStudioStartRoute(settings),
    [
      settings.animationStartView,
      settings.startStudio,
      settings.startView
    ]
  );
  const confirmNavigation = useCallback(
    () =>
      !projectDirty ||
      window.confirm(
        "Das aktive Animationsprojekt enthält ungespeicherte Änderungen. Trotzdem navigieren?"
      ),
    [projectDirty]
  );

  return (
    <NavigationProvider
      confirmNavigation={confirmNavigation}
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
  animationRepository = null,
  animationRepositoryUnavailableMessage,
  createAnimationProjectId,
  createAnimationClipId,
  createAnimationPartAssetId,
  createAnimationImageBlobId,
  animationAutosaveDelayMs,
  animationImageDecoder = createBrowserImageDecoder(),
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
        <AnimationProjectProvider
          repository={animationRepository}
          imageDecoder={animationImageDecoder}
          {...(animationRepositoryUnavailableMessage
            ? { unavailableMessage: animationRepositoryUnavailableMessage }
            : {})}
          {...(createAnimationProjectId
            ? { createProjectId: createAnimationProjectId }
            : {})}
          {...(createAnimationClipId
            ? { createClipId: createAnimationClipId }
            : {})}
          {...(createAnimationPartAssetId
            ? { createPartAssetId: createAnimationPartAssetId }
            : {})}
          {...(createAnimationImageBlobId
            ? { createImageBlobId: createAnimationImageBlobId }
            : {})}
          {...(animationAutosaveDelayMs !== undefined
            ? { autosaveDelayMs: animationAutosaveDelayMs }
            : {})}
          {...(now ? { now } : {})}
        >
          <NavigationRoot
            navigationAdapter={navigationAdapter}
            outputAdapter={outputAdapter}
            startupMigration={startupMigration}
            storageAdapter={storageAdapter}
            {...(now ? { now } : {})}
            {...(createDraftId ? { createDraftId } : {})}
          />
        </AnimationProjectProvider>
      </ProfileLibraryProvider>
    </SettingsProvider>
  );
}
