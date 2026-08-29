import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { cancelResourceBid, fetchSentBids } from "../../services/graphql/bids";
import type { BidWorkspaceItem } from "./types";

export interface SentBidsScreenProps {
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
  onOpenResource?: (resourceId: string) => void;
  onOpenCounterparty?: (accountId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
}

export function SentBidsScreen({
  onOpenBid,
  onBackToMyHub,
  onOpenResource,
  onOpenCounterparty,
  onOpenConversation
}: SentBidsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsSentTitle", { defaultValue: "Sent bids" })}
      testID="sent-bids-screen"
      fetchBids={fetchSentBids}
      onCancelBid={async (bid) => {
        await cancelResourceBid(bid.id);
      }}
      {...(onOpenBid ? { onOpenBid } : {})}
      {...(onBackToMyHub ? { onBackToMyHub } : {})}
      {...(onOpenResource ? { onOpenResource } : {})}
      {...(onOpenCounterparty ? { onOpenCounterparty } : {})}
      {...(onOpenConversation ? { onOpenConversation } : {})}
    />
  );
}