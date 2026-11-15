import { useEffect, useState } from "react";
import type { CampaignNeedStatus } from "../../graphql/generated";

/** Shared shape of need/resource submission fields selected by lifecycle queries. */
export type CampaignListingRelation = {
  campaignId: string;
  submissionId: string;
  submittedAt: string;
  rejectionNote: string | null;
  isCurrent: boolean;
  status: `${CampaignNeedStatus}`;
  campaignByCampaignId: {
    title: string;
    startAt: string;
    endAt: string;
  } | null;
};

export function isOngoingCampaignRelation(relation: CampaignListingRelation, now = Date.now()) {
  return Date.parse(relation.campaignByCampaignId?.endAt ?? "") > now;
}

export function isCurrentCampaignRelation(relation: CampaignListingRelation, now = Date.now()) {
  return relation.isCurrent && isOngoingCampaignRelation(relation, now)
    && (relation.status === "PENDING" || relation.status === "ACCEPTED");
}

export function effectiveCampaignRelation(relations: readonly CampaignListingRelation[], now = Date.now()) {
  const newestFirst = [...relations].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  return newestFirst.find(relation => isCurrentCampaignRelation(relation, now))
    ?? (newestFirst[0]?.status === "REJECTED" ? newestFirst[0] : null);
}

export function campaignSelectionLocked(relation: CampaignListingRelation | null, now = Date.now()) {
  if (!relation || !isCurrentCampaignRelation(relation, now)) return false;
  // Missing/invalid submission dates fail closed; the server remains authoritative.
  return relation.status === "ACCEPTED" || !(now - Date.parse(relation.submittedAt) >= 24 * 60 * 60 * 1000);
}

/** Status for a campaign's join picker, respecting a slot held by another campaign. */
export function campaignJoinStatus(relations: readonly CampaignListingRelation[], campaignId: string, now = Date.now()) {
  const current = relations.find(relation => isCurrentCampaignRelation(relation, now));
  if (current && (current.campaignId === campaignId || campaignSelectionLocked(current, now))) return current.status;
  return relations.some(relation => relation.campaignId === campaignId && relation.status === "REJECTED")
    ? "REJECTED" as const : null;
}

export function shouldSubmitCampaignLink(previousCampaignId: string, nextCampaignId: string, explicitResubmit = false) {
  return Boolean(nextCampaignId) && (previousCampaignId !== nextCampaignId || explicitResubmit);
}

/** Re-evaluate the end date and 24-hour boundary even if the editor stays open. */
export function useCampaignLifecycleNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}