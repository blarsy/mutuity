import React, { useEffect, useMemo, useState } from "react";

import { MyCampaignsScreen } from "../screens/campaigns/MyCampaignsScreen";
import { CampaignDetailScreen } from "../screens/campaigns/CampaignDetailScreen";
import { CampaignPublicInfoScreen } from "../screens/campaigns/CampaignPublicInfoScreen";
import { CampaignModerationStatus } from "../services/graphql/generated";
import { fetchCampaignById } from "../services/graphql/campaigns";
import type { CampaignItem } from "../services/graphql/campaigns";

type US3Screen = "list" | "detail" | "public";

export interface US3NavigatorProps {
  currentAccountId: string | null;
  pendingCampaignId?: string | null;
  onConsumePendingCampaign?: () => void;
}

function buildDefaultCampaignDates() {
  const now = new Date();

  const startAt = new Date(now);
  startAt.setDate(startAt.getDate() + 4);
  startAt.setHours(8, 0, 0, 0);

  const airdropAt = new Date(now);
  airdropAt.setDate(airdropAt.getDate() + 14);
  airdropAt.setHours(8, 0, 0, 0);

  const endAt = new Date(now);
  endAt.setDate(endAt.getDate() + 24);
  endAt.setHours(8, 0, 0, 0);

  return {
    startAt: startAt.toISOString(),
    airdropAt: airdropAt.toISOString(),
    endAt: endAt.toISOString()
  };
}

export function US3Navigator({ currentAccountId, pendingCampaignId, onConsumePendingCampaign }: US3NavigatorProps): React.JSX.Element {
  const [activeScreen, setActiveScreen] = useState<US3Screen>("list");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isNewCampaign, setIsNewCampaign] = useState(false);

  const defaultCampaignDates = useMemo(() => buildDefaultCampaignDates(), []);

  useEffect(() => {
    if (!pendingCampaignId) {
      return;
    }

    let cancelled = false;
    void fetchCampaignById(pendingCampaignId).then((campaign) => {
      if (cancelled || !campaign) {
        return;
      }
      setSelectedCampaign(campaign);
      setActiveScreen("public");
      onConsumePendingCampaign?.();
    });

    return () => {
      cancelled = true;
    };
  }, [pendingCampaignId, onConsumePendingCampaign]);

  if (activeScreen === "detail" && selectedCampaign) {
    return (
      <CampaignDetailScreen
        campaign={selectedCampaign}
        creatorAccountId={currentAccountId}
        isNew={isNewCampaign}
        onBack={() => {
          setActiveScreen("list");
          setIsNewCampaign(false);
          setRefreshToken((prev) => prev + 1);
        }}
        onSaved={() => {
          setActiveScreen("list");
          setIsNewCampaign(false);
          setRefreshToken((prev) => prev + 1);
        }}
      />
    );
  }

  if (activeScreen === "public" && selectedCampaign) {
    return (
      <CampaignPublicInfoScreen
        campaignId={selectedCampaign.id}
        currentAccountId={currentAccountId}
        onBack={() => {
          setActiveScreen("list");
          setSelectedCampaign(null);
        }}
      />
    );
  }

  return (
    <MyCampaignsScreen
      creatorAccountId={currentAccountId}
      refreshToken={refreshToken}
      onAddCampaign={() => {
        setIsNewCampaign(true);
        setSelectedCampaign({
          id: "new-campaign",
          title: "",
          theme: "",
          description: "",
          imageUrl: null,
          startAt: defaultCampaignDates.startAt,
          airdropAt: defaultCampaignDates.airdropAt,
          endAt: defaultCampaignDates.endAt,
          createdAt: new Date().toISOString(),
          creatorAccountId: currentAccountId,
          moderationStatus: CampaignModerationStatus.Pending,
          resourceCount: 0,
          needCount: 0,
          rewardsMultiplier: 5,
          airdropAmount: 3000
        });
        setActiveScreen("detail");
      }}
      onEditCampaign={(campaign) => {
        setIsNewCampaign(false);
        setSelectedCampaign(campaign);
        setActiveScreen("detail");
      }}
      onOpenCampaign={(campaign) => {
        setSelectedCampaign(campaign);
        setActiveScreen("public");
      }}
    />
  );
}
