import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { ChatDetailScreen, type ChatDetailConversation } from "../screens/chat/ChatDetailScreen";
import { ResourceDetailScreen } from "../screens/resources/ResourceDetailScreen";
import { SearchResourcesScreen } from "../screens/resources/SearchResourcesScreen";
import type { SearchResourceItem } from "../screens/resources/SearchResourcesScreen";
import { SearchNeedsScreen } from "../screens/needs/SearchNeedsScreen";
import { NeedDetailScreen } from "../screens/needs/NeedDetailScreen";
import { AccountPublicProfileScreen } from "../screens/profile/AccountPublicProfileScreen";
import { CampaignPublicInfoScreen } from "../screens/campaigns/CampaignPublicInfoScreen";
import { ErrorState } from "../components/state/ErrorState";
import { LoadingState } from "../components/state/LoadingState";
import {
  findNeedConversation,
  findResourceConversation,
  startNeedConversation,
  startResourceConversation
} from "../services/graphql/chat";
import type { ResourceDetailItem } from "../services/graphql/resources";
import type { NeedDetailItem } from "../services/graphql/needs";

type ExploreSurface = "resources" | "needs";
type ActiveConversation =
  | { id: string; kind: "resource" | "need" }
  | { id: null; kind: "resource" | "need"; draft: ChatDetailConversation };

export interface US2ExploreScreenProps {
  currentAccountId: string | null;
}

export function US2ExploreScreen({ currentAccountId }: US2ExploreScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSurface, setActiveSurface] = useState<ExploreSurface>("resources");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [openDetailError, setOpenDetailError] = useState<string | null>(null);

  const handleOpenResource = (resource: SearchResourceItem): void => {
    setSelectedResourceId(resource.id);
    setOpenDetailError(null);
  };

  const handleOpenCreatorAccount = (accountId: string): void => {
    setSelectedAccountId(accountId);
  };

  const handleOpenResourceChat = async (resource: ResourceDetailItem): Promise<void> => {
    if (!currentAccountId) {
      setOpenDetailError(
        t("chatSignInRequired", { defaultValue: "Sign in to open a conversation." })
      );
      return;
    }

    if (resource.creatorAccountId === currentAccountId) {
      setOpenDetailError(
        t("chatWithSelfNotAllowed", { defaultValue: "You cannot start a chat with yourself." })
      );
      return;
    }

    setOpeningConversation(true);
    setOpenDetailError(null);

    try {
      const conversationId = await findResourceConversation({
        resourceId: resource.id,
        ownerAccountId: resource.creatorAccountId,
        bidderAccountId: currentAccountId
      });
      setSelectedResourceId(null);
      setActiveConversation(conversationId
        ? { id: conversationId, kind: "resource" }
        : {
            id: null,
            kind: "resource",
            draft: {
              id: "draft-resource",
              otherAccountId: resource.creatorAccountId,
              otherAccountDisplayName: resource.creatorDisplayName,
              otherAccountAvatarUrl: resource.creatorAvatarUrl,
              linkedResourceId: resource.id,
              linkedResourceTitle: resource.title,
              linkedResourceImageUrl: resource.imageUrls[0] ?? null
            }
          });
    } catch {
      setOpenDetailError(
        t("chatOpenError", { defaultValue: "We could not open this conversation." })
      );
    } finally {
      setOpeningConversation(false);
    }
  };

  const handleOpenNeedChat = async (need: NeedDetailItem): Promise<void> => {
    if (!currentAccountId) return;

    setOpeningConversation(true);
    setOpenDetailError(null);
    try {
      const conversationId = await findNeedConversation({
        needId: need.id,
        creatorAccountId: need.creatorAccountId,
        claimerAccountId: currentAccountId
      });
      setSelectedNeedId(null);
      setActiveConversation(conversationId
        ? { id: conversationId, kind: "need" }
        : {
            id: null,
            kind: "need",
            draft: {
              id: "draft-need",
              otherAccountId: need.creatorAccountId,
              otherAccountDisplayName: need.creatorDisplayName,
              otherAccountAvatarUrl: need.creatorAvatarUrl,
              linkedResourceId: need.id,
              linkedResourceTitle: need.title,
              linkedResourceImageUrl: need.imageUrls?.[0] ?? null
            }
          });
    } catch {
      setOpenDetailError(t("chatOpenError", { defaultValue: "We could not open this conversation." }));
    } finally {
      setOpeningConversation(false);
    }
  };

  if (openingConversation) {
    return <LoadingState label={t("chatConversationLoading", { defaultValue: "Opening conversation..." })} />;
  }

  if (selectedAccountId) {
    return (
      <AccountPublicProfileScreen
        accountId={selectedAccountId}
        onBack={() => setSelectedAccountId(null)}
      />
    );
  }

  if (selectedCampaignId) {
    return (
      <CampaignPublicInfoScreen
        campaignId={selectedCampaignId}
        currentAccountId={currentAccountId}
        onBack={() => setSelectedCampaignId(null)}
      />
    );
  }

  if (selectedResourceId) {
    if (openDetailError) {
      return (
        <ErrorState
          message={openDetailError}
          onRetry={() => setOpenDetailError(null)}
        />
      );
    }

    return (
      <ResourceDetailScreen
        resourceId={selectedResourceId}
        currentAccountId={currentAccountId}
        onOpenCreatorAccount={handleOpenCreatorAccount}
        onOpenResourceChat={(resource) => {
          void handleOpenResourceChat(resource);
        }}
        onBack={() => setSelectedResourceId(null)}
      />
    );
  }

  if (selectedNeedId) {
    if (openDetailError) {
      return <ErrorState message={openDetailError} onRetry={() => setOpenDetailError(null)} />;
    }

    return (
      <NeedDetailScreen
        needId={selectedNeedId}
        currentAccountId={currentAccountId}
        onOpenCreatorAccount={handleOpenCreatorAccount}
        onOpenNeedChat={(need) => { void handleOpenNeedChat(need); }}
        onBack={() => setSelectedNeedId(null)}
      />
    );
  }

  if (activeConversation && currentAccountId) {
    const draft = activeConversation.id === null ? activeConversation.draft : null;

    return (
      <ChatDetailScreen
        conversationId={activeConversation.id}
        conversationKind={activeConversation.kind}
        currentAccountId={currentAccountId}
        conversation={draft}
        onBackToList={() => setActiveConversation(null)}
        onOpenLinkedResource={(resourceId) => setSelectedResourceId(resourceId)}
        onOpenLinkedNeed={(needId) => setSelectedNeedId(needId)}
        onOpenLinkedAccount={(accountId) => setSelectedAccountId(accountId)}
        {...(draft ? {
          onSendMessage: async (messageText: string, imageUri?: string | null) => {
            const conversationId = activeConversation.kind === "resource"
              ? await startResourceConversation({
                  resourceId: draft.linkedResourceId!,
                  otherAccountId: draft.otherAccountId!,
                  messageText,
                  ...(imageUri ? { imageUrl: imageUri } : {})
                })
              : await startNeedConversation({
                  needId: draft.linkedResourceId!,
                  messageText,
                  ...(imageUri ? { imageUrl: imageUri } : {})
                });
            setActiveConversation({ id: conversationId, kind: activeConversation.kind });
          }
        } : {})}
      />
    );
  }

  if (activeSurface === "needs") {
    return (
      <SearchNeedsScreen
        currentAccountId={currentAccountId}
        onOpenNeed={(need) => setSelectedNeedId(need.id)}
        onSwitchToResources={() => setActiveSurface("resources")}
        onOpenCampaign={(campaignId) => setSelectedCampaignId(campaignId)}
      />
    );
  }

  return (
    <SearchResourcesScreen
      currentAccountId={currentAccountId}
      onOpenResource={handleOpenResource}
      onSwitchToNeeds={() => setActiveSurface("needs")}
      onOpenCampaign={(campaignId) => setSelectedCampaignId(campaignId)}
    />
  );
}
