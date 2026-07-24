import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { fetchSentBids } from "../../services/graphql/bids";

export function SentBidsScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsSentTitle", { defaultValue: "Sent bids" })}
      testID="sent-bids-screen"
      fetchBids={fetchSentBids}
    />
  );
}