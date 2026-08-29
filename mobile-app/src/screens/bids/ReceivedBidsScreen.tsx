import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { fetchReceivedBids, respondToResourceBid } from "../../services/graphql/bids";
import type { BidWorkspaceItem } from "./types";

export interface ReceivedBidsScreenProps {
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
  onOpenResource?: (resourceId: string) => void;
  onOpenCounterparty?: (accountId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
}

export function ReceivedBidsScreen({
  onOpenBid,
  onBackToMyHub,
  onOpenResource,
  onOpenCounterparty,
  onOpenConversation
}: ReceivedBidsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsReceivedTitle", { defaultValue: "Received bids" })}
      testID="received-bids-screen"
      fetchBids={fetchReceivedBids}
      onAcceptBid={async (bid) => {
        await respondToResourceBid(bid.id, "ACCEPTED");
      }}
      onDeclineBid={async (bid) => {
        await respondToResourceBid(bid.id, "DECLINED");
      }}
      {...(onOpenBid ? { onOpenBid } : {})}
      {...(onBackToMyHub ? { onBackToMyHub } : {})}
      {...(onOpenResource ? { onOpenResource } : {})}
      {...(onOpenCounterparty ? { onOpenCounterparty } : {})}
      {...(onOpenConversation ? { onOpenConversation } : {})}
    />
  );
}