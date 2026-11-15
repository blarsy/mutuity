export type CampaignListingStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "SUPERSEDED";

/** Composite relation identity is unchanged; submissionId guards each decision. */
export interface CampaignListingRelation {
  campaignId: string;
  submissionId: string;
  status: CampaignListingStatus;
  rejectionNote: string | null;
  submittedAt: string;
  isCurrent: boolean;
  campaignByCampaignId: {
    title: string;
    startAt: string;
    endAt: string;
  } | null;
}

export function isUnendedCampaignRelation(relation: CampaignListingRelation, now = Date.now()): boolean {
  return relation.campaignByCampaignId !== null && Date.parse(relation.campaignByCampaignId.endAt) > now;
}

export function isCurrentCampaignRelation(relation: CampaignListingRelation, now = Date.now()): boolean {
  return relation.isCurrent && relation.status !== "SUPERSEDED" && isUnendedCampaignRelation(relation, now);
}

/** Prefer a live application; otherwise retain the latest rejection as feedback. */
export function selectCampaignListingRelation(
  relations: readonly CampaignListingRelation[],
  now = Date.now()
): CampaignListingRelation | null {
  const sorted = [...relations].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  return sorted.find((relation) => isCurrentCampaignRelation(relation, now)) ??
    sorted.find((relation) => relation.status === "REJECTED") ?? null;
}

export function canSwitchListingCampaign(relation: CampaignListingRelation | null | undefined, now = Date.now()): boolean {
  if (!relation || !isCurrentCampaignRelation(relation, now)) return true;
  if (relation.status === "ACCEPTED") return false;
  if (relation.status === "PENDING") return now - Date.parse(relation.submittedAt) >= 24 * 60 * 60 * 1000;
  return true;
}