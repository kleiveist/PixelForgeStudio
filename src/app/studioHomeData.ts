import type { AssetCategory } from "../domain/assets";
import { getDashboardCategory } from "../features/dashboard/dashboardCatalog";
import {
  createDashboardData,
  type DashboardCollectionStatus,
  type DashboardDraftStatus,
  type DashboardProfileSummary
} from "../features/dashboard/dashboardData";
import type {
  ProfileLibrary,
  StableId,
  WizardDraft
} from "../schemas";
import type {
  AnimationProjectSummary,
  StorageReadResult
} from "../services";
import type { AnimationProjectListStatus } from "../store/animation";

export interface StudioHomeDraftSummary {
  readonly id: StableId;
  readonly projectName: string;
  readonly categoryLabel: string | null;
}

export interface StudioHomeProfileSummary {
  readonly id: StableId;
  readonly name: string;
  readonly category: AssetCategory;
  readonly categoryLabel: string;
  readonly subtypeLabel: string;
  readonly favorite: boolean;
}

export interface StudioHomeAnimationProjectSummary {
  readonly id: StableId;
  readonly name: string;
  readonly updatedAt: string;
  readonly directionSourceMode: AnimationProjectSummary["directionSourceMode"];
}

export interface StudioHomeAnimationSummaryPort {
  readonly status: AnimationProjectListStatus;
  readonly projects: readonly AnimationProjectSummary[];
  readonly error: string | null;
}

export interface StudioHomeData {
  readonly collectionStatus: DashboardCollectionStatus;
  readonly recentProfiles: readonly StudioHomeProfileSummary[];
  readonly skippedProfileCount: number;
  readonly draftStatus: DashboardDraftStatus;
  readonly draft: StudioHomeDraftSummary | null;
  readonly animationStatus: AnimationProjectListStatus;
  readonly recentAnimationProjects: readonly StudioHomeAnimationProjectSummary[];
  readonly animationError: string | null;
}

function summarizeDraft(draft: WizardDraft): StudioHomeDraftSummary {
  return {
    id: draft.draftId,
    projectName: draft.projectName || "Unbenanntes Projekt",
    categoryLabel:
      "category" in draft
        ? getDashboardCategory(draft.category).label
        : null
  };
}

function summarizeProfile(
  profile: DashboardProfileSummary
): StudioHomeProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    category: profile.category,
    categoryLabel: profile.categoryLabel,
    subtypeLabel: profile.subtypeLabel,
    favorite: profile.favorite
  };
}

export function createStudioHomeData(
  profileResult: StorageReadResult<ProfileLibrary>,
  draftResult: StorageReadResult<WizardDraft>,
  activeBaseProfileId: StableId | null,
  animationPort: StudioHomeAnimationSummaryPort = {
    status: "idle",
    projects: [],
    error: null
  }
): StudioHomeData {
  const dashboard = createDashboardData(
    profileResult,
    draftResult,
    activeBaseProfileId
  );

  return {
    collectionStatus: dashboard.collectionStatus,
    recentProfiles: dashboard.recentProfiles.map(summarizeProfile),
    skippedProfileCount: dashboard.skippedProfileCount,
    draftStatus: dashboard.draftStatus,
    draft: dashboard.draft ? summarizeDraft(dashboard.draft) : null,
    animationStatus: animationPort.status,
    recentAnimationProjects: animationPort.projects.slice(0, 3).map((project) => ({
      id: project.projectId,
      name: project.name,
      updatedAt: project.updatedAt,
      directionSourceMode: project.directionSourceMode
    })),
    animationError: animationPort.error
  };
}
