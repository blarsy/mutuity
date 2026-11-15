import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import {
  canSwitchListingCampaign,
  isCurrentCampaignRelation,
  isUnendedCampaignRelation,
  type CampaignListingRelation
} from "../../services/graphql/campaignListing";

export function useCampaignListingRules(relation: CampaignListingRelation | null | undefined) {
  const [, setBoundaryRevision] = useState(0);
  // A freshly loaded relation must use the current clock, not the time when
  // the editor first mounted (which may precede the 24h switching boundary).
  const now = Date.now();
  useEffect(() => {
    if (!relation) return;
    const clock = Date.now();
    const nextBoundary = [
      Date.parse(relation.submittedAt) + 24 * 60 * 60 * 1000,
      Date.parse(relation.campaignByCampaignId?.endAt ?? "")
    ].filter((boundary) => boundary > clock).sort((a, b) => a - b)[0];
    if (nextBoundary === undefined) return;
    // Update only at lifecycle boundaries, not on a ticking interval that would
    // reset an open PickerDialog's draft selection on every parent render.
    const timer = setTimeout(() => setBoundaryRevision((revision) => revision + 1), Math.min(nextBoundary - clock + 1, 2147483647));
    return () => clearTimeout(timer);
  }, [relation, now]);
  return {
    canSwitch: canSwitchListingCampaign(relation, now),
    requiresCampaign: Boolean(relation && isCurrentCampaignRelation(relation, now) &&
      (relation.status === "PENDING" || relation.status === "ACCEPTED")),
    canResubmit: Boolean(relation?.status === "REJECTED" && isUnendedCampaignRelation(relation, now))
  };
}

export function CampaignListingFeedback({ relation, canSwitch, canResubmit, busy, onResubmit }: {
  relation: CampaignListingRelation | null | undefined;
  canSwitch: boolean;
  canResubmit: boolean;
  busy: boolean;
  onResubmit: () => void;
}): React.JSX.Element | null {
  const { t } = useTranslation("common");
  if (!relation) return null;
  return (
    <View testID="campaign-listing-feedback">
      <Text>{relation.campaignByCampaignId?.title}</Text>
      <Text>{t(`listingCampaignStatus${relation.status}`)}</Text>
      {relation.status === "REJECTED" ? <>
        <Text>{relation.rejectionNote || t("listingCampaignRejectedWithoutNote")}</Text>
        <Text>{t("listingCampaignEditDoesNotResubmit")}</Text>
      </> : null}
      {!canSwitch ? <Text>{t(relation.status === "ACCEPTED" ? "listingCampaignAcceptedLock" : "listingCampaignPendingLock")}</Text> : null}
      {canResubmit ? <Button disabled={busy} onPress={onResubmit}>{t("listingCampaignResubmit")}</Button> : null}
    </View>
  );
}