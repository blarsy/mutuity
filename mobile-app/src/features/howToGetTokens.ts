/**
 * The ways a user can earn Topes, mirroring the web client's
 * `TOPES_EARNING_OPPORTUNITIES` list on the Contribution page.
 *
 * `amount` is `null` when the reward is variable (e.g. campaign airdrops).
 */
export type HowToGetTokensOpportunityId =
  | "profileAvatar"
  | "profileBio"
  | "profileLocation"
  | "profileFirstLink"
  | "resourceFirstImage"
  | "resourceDefaultTokenAmount"
  | "resourceAge24h"
  | "needFirstImage"
  | "needDefaultTokenAmount"
  | "needAge24h"
  | "campaignAirdrop";

export interface HowToGetTokensOpportunity {
  id: HowToGetTokensOpportunityId;
  amount: number | null;
}

export const HOW_TO_GET_TOKENS_OPPORTUNITIES: HowToGetTokensOpportunity[] = [
  { id: "profileAvatar", amount: 20 },
  { id: "profileBio", amount: 20 },
  { id: "profileLocation", amount: 20 },
  { id: "profileFirstLink", amount: 20 },
  { id: "resourceFirstImage", amount: 20 },
  { id: "resourceDefaultTokenAmount", amount: 20 },
  { id: "resourceAge24h", amount: 20 },
  { id: "needFirstImage", amount: 10 },
  { id: "needDefaultTokenAmount", amount: 10 },
  { id: "needAge24h", amount: 10 },
  { id: "campaignAirdrop", amount: null }
];

/**
 * One-time profile-filling rewards. These are collected once and can be shown
 * as "done" (visually checked) once the account has completed the milestone.
 */
export const PROFILE_OPPORTUNITY_IDS: readonly HowToGetTokensOpportunityId[] = [
  "profileAvatar",
  "profileBio",
  "profileLocation",
  "profileFirstLink"
];

/**
 * Recurring rewards whose "remaining" count advertises how many resources or
 * needs still lack a required image or Topes amount.
 */
export const REMAINING_OPPORTUNITY_IDS: readonly HowToGetTokensOpportunityId[] = [
  "resourceFirstImage",
  "resourceDefaultTokenAmount",
  "needFirstImage",
  "needDefaultTokenAmount"
];

/**
 * Snapshot of how far the account has progressed through the earning
 * opportunities, used to render collected rewards as done and to advertise the
 * number of rewards that can still be reaped.
 */
export interface HowToGetTokensProgress {
  /** Opportunity ids the account has already collected (one-time profile rewards). */
  completed: HowToGetTokensOpportunityId[];
  /** Remaining collectible count per recurring opportunity. */
  remaining: Partial<Record<HowToGetTokensOpportunityId, number>>;
}

export const EMPTY_HOW_TO_GET_TOKENS_PROGRESS: HowToGetTokensProgress = {
  completed: [],
  remaining: {}
};
