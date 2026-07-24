import React from "react";
import { useTranslation } from "react-i18next";

import { BidsListScreen } from "./BidsListScreen";
import { fetchReceivedBids } from "../../services/graphql/bids";

export function ReceivedBidsScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BidsListScreen
      title={t("myBidsReceivedTitle", { defaultValue: "Received bids" })}
      testID="received-bids-screen"
      fetchBids={fetchReceivedBids}
    />
  );
}