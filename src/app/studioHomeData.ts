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
import type { StorageReadResult } from "../services";

export interface StudioHomeDraftSummary {
  readonly id: StableId;
  readonly projectName: string;
  readonly categoryLabel: string | null;
  readonly currentStep: string;
  readonly savedAt: string;
}

export interface StudioHomeData {
  readonly collectionStatus: DashboardCollectionStatus;
  readonly recentProfiles: readonly DashboardProfileSummary[];
  readonly skippedProfileCount: number;
  readonly draftStatus: DashboardDraftStatus;
  readonly draft: StudioHomeDraftSummary | null;
}

function summarizeDraft(draft: WizardDraft): StudioHomeDraftSummary {
  return {
    id: draft.draftId,
    projectName: draft.projectName || "Unbenanntes Projekt",
    categoryLabel:
      "category" in draft
        ? getDashboardCategory(draft.category).label
        : null,
    currentStep: draft.currentStep,
    savedAt: draft.savedAt
  };
}

export function createStudioHomeData(
  profileResult: StorageReadResult<ProfileLibrary>,
  draftResult: StorageReadResult<WizardDraft>,
  activeBaseProfileId: StableId | null
): StudioHomeData {
  const dashboard = createDashboardData(
    profileResult,
    draftResult,
    activeBaseProfileId
  );

  return {
    collectionStatus: dashboard.collectionStatus,
    recentProfiles: dashboard.recentProfiles,
    skippedProfileCount: dashboard.skippedProfileCount,
    draftStatus: dashboard.draftStatus,
    draft: dashboard.draft ? summarizeDraft(dashboard.draft) : null
  };
}
