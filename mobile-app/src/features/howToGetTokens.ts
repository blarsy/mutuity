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
