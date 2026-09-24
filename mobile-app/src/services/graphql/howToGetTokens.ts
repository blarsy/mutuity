import {
  EMPTY_HOW_TO_GET_TOKENS_PROGRESS,
  PROFILE_OPPORTUNITY_IDS,
  REMAINING_OPPORTUNITY_IDS,
  type HowToGetTokensOpportunityId,
  type HowToGetTokensProgress
} from "../../features/howToGetTokens";
import { fetchMyProfile } from "./profile";
import { fetchMyResources } from "./resources";
import { fetchMyNeeds } from "./needs";

function hasRemaining(
  remaining: Partial<Record<HowToGetTokensOpportunityId, number>>,
  id: HowToGetTokensOpportunityId,
  count: number
): void {
  if (count > 0) {
    remaining[id] = count;
  }
}

/**
 * Loads the current progress through the Topes-earning opportunities by
 * resolving the account profile (for one-time profile rewards) and the
 * account's resources and needs (for recurring image / Topes-amount rewards).
 */
export async function fetchHowToGetTokensProgress(accountId: string): Promise<HowToGetTokensProgress> {
  if (!accountId) {
    return EMPTY_HOW_TO_GET_TOKENS_PROGRESS;
  }

  const [profile, resources, needs] = await Promise.all([
    fetchMyProfile(accountId),
    fetchMyResources({ creatorAccountId: accountId }),
    fetchMyNeeds(accountId)
  ]);

  const completed: HowToGetTokensOpportunityId[] = [];

  if (profile?.avatarUrl) {
    completed.push("profileAvatar");
  }

  if (profile?.bio?.trim()) {
    completed.push("profileBio");
  }

  if (profile?.location?.label?.trim()) {
    completed.push("profileLocation");
  }

  if ((profile?.profileLinks ?? []).length > 0) {
    completed.push("profileFirstLink");
  }

  const remaining: Partial<Record<HowToGetTokensOpportunityId, number>> = {};
  const resourcesWithoutImage = resources.filter((resource) => resource.imageUrls.length === 0).length;
  const resourcesWithoutTokenAmount = resources.filter((resource) => resource.defaultTokenAmount === 0).length;
  const needsWithoutImage = needs.filter((need) => (need.imageUrls ?? []).length === 0).length;
  const needsWithoutTokenAmount = needs.filter((need) => need.proposedTokenAmount === 0).length;

  hasRemaining(remaining, "resourceFirstImage", resourcesWithoutImage);
  hasRemaining(remaining, "resourceDefaultTokenAmount", resourcesWithoutTokenAmount);
  hasRemaining(remaining, "needFirstImage", needsWithoutImage);
  hasRemaining(remaining, "needDefaultTokenAmount", needsWithoutTokenAmount);

  return { completed, remaining };
}

export { PROFILE_OPPORTUNITY_IDS, REMAINING_OPPORTUNITY_IDS };