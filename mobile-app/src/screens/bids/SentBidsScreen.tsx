import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { fetchSentBids } from "../../services/graphql/bids";
import type { BidWorkspaceItem } from "./types";

export interface SentBidsScreenProps {
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
}

export function SentBidsScreen({ onOpenBid, onBackToMyHub }: SentBidsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsSentTitle", { defaultValue: "Sent bids" })}
      testID="sent-bids-screen"
      fetchBids={fetchSentBids}
      {...(onOpenBid ? { onOpenBid } : {})}
      {...(onBackToMyHub ? { onBackToMyHub } : {})}
    />
  );
}