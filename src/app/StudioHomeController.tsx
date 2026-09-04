import type { AnimationStudioView, StudioRoute } from "../domain/navigation";
import type { StableId } from "../schemas";
import type { V2StorageAdapter } from "../services";
import { useNavigation } from "../store/navigation";
import { useAnimationProject } from "../store/animation";
import { useProfileLibrary } from "../store/profiles";
import { useSettings } from "../store/settings";
import { useWizardSession } from "../store/wizard";
import { createStudioHomeData } from "./studioHomeData";
import { StudioHomeView } from "./StudioHomeView";

export type StudioHomeStorage = Pick<V2StorageAdapter, "readDraft">;

export interface StudioHomeControllerProps {
  readonly activeBaseProfileId: StableId | null;
  readonly storageAdapter: StudioHomeStorage;
}

function animationStartRoute(view: AnimationStudioView): StudioRoute {
  return view === "workspace"
    ? { studio: "animation", view: "workspace" }
    : { studio: "animation", view };
}

export function StudioHomeController({
  activeBaseProfileId,
  storageAdapter
}: StudioHomeControllerProps) {
  const { navigateTo } = useNavigation();
  const animationProjects = useAnimationProject();
  const { libraryResult } = useProfileLibrary();
  const { settings } = useSettings();
  const { requestProfile, requestResume } = useWizardSession();
  const data = createStudioHomeData(
    libraryResult,
    storageAdapter.readDraft(),
    activeBaseProfileId,
    {
      status: animationProjects.projectListStatus,
      projects: animationProjects.projectSummaries,
      error: animationProjects.projectListError
    }
  );

  const openProfile = (profileId: StableId) => {
    requestProfile(profileId);
    navigateTo({ studio: "prompt", view: "wizard" });
  };

  const resumeDraft = (draftId: StableId) => {
    requestResume(draftId);
    navigateTo({ studio: "prompt", view: "wizard" });
  };

  const openAnimationProject = async (
    projectId: StableId
  ): Promise<string | null> => {
    const result = await animationProjects.openProject(projectId);
    if (result.status !== "ok") return result.message;
    navigateTo({ studio: "animation", view: "workspace", projectId });
    return null;
  };

  return (
    <StudioHomeView
      animationRoute={animationStartRoute(settings.animationStartView)}
      data={data}
      onOpenProfile={openProfile}
      onOpenAnimationProject={openAnimationProject}
      onResumeDraft={resumeDraft}
      promptRoute={{ studio: "prompt", view: settings.startView }}
    />
  );
}
