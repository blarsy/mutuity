import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { cancelResourceBid, fetchSentBids } from "../../services/graphql/bids";
import type { BidWorkspaceItem } from "./types";

export interface SentBidsScreenProps {
  fetchBids?: (includeInactive: boolean) => Promise<BidWorkspaceItem[]>;
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
  onOpenResource?: (resourceId: string) => void;
  onOpenCounterparty?: (accountId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenChat?: (bid: BidWorkspaceItem) => Promise<void> | void;
  onBackToHub?: () => void;
}

export function SentBidsScreen({
  fetchBids = fetchSentBids,
  onOpenBid,
  onBackToMyHub,
  onOpenResource,
  onOpenCounterparty,
  onOpenConversation,
  onOpenChat,
  onBackToHub
}: SentBidsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsSentTitle", { defaultValue: "Sent bids" })}
      testID="sent-bids-screen"
      fetchBids={fetchBids}
      onCancelBid={async (bid) => {
        await cancelResourceBid(bid.id);
      }}
      {...(onOpenBid ? { onOpenBid } : {})}
      {...(onBackToMyHub ? { onBackToMyHub } : {})}
      {...(onOpenResource ? { onOpenResource } : {})}
      {...(onOpenCounterparty ? { onOpenCounterparty } : {})}
      {...(onOpenConversation ? { onOpenConversation } : {})}
      {...(onOpenChat ? { onOpenChat } : {})}
      {...(onBackToHub ? { onBackToHub } : {})}
    />
  );
}