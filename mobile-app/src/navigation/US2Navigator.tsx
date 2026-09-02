import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { ChatDetailScreen } from "../screens/chat/ChatDetailScreen";
import { ResourceDetailScreen } from "../screens/resources/ResourceDetailScreen";
import { SearchResourcesScreen } from "../screens/resources/SearchResourcesScreen";
import type { SearchResourceItem } from "../screens/resources/SearchResourcesScreen";
import { SearchNeedsScreen } from "../screens/needs/SearchNeedsScreen";
import { AccountPublicProfileScreen } from "../screens/profile/AccountPublicProfileScreen";
import { ErrorState } from "../components/state/ErrorState";
import { LoadingState } from "../components/state/LoadingState";
import { openOrCreateResourceConversation } from "../services/graphql/chat";
import type { ResourceDetailItem } from "../services/graphql/resources";

type ExploreSurface = "resources" | "needs";

export interface US2ExploreScreenProps {
  currentAccountId: string | null;
}

export function US2ExploreScreen({ currentAccountId }: US2ExploreScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSurface, setActiveSurface] = useState<ExploreSurface>("resources");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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
      const conversationId = await openOrCreateResourceConversation({
        resourceId: resource.id,
        ownerAccountId: resource.creatorAccountId,
        bidderAccountId: currentAccountId,
        initialMessage: t("resourceChatInitialMessage", {
          defaultValue: "Hello, I am interested in {{title}}.",
          title: resource.title
        })
      });
      setActiveConversationId(conversationId);
    } catch {
      setOpenDetailError(
        t("chatOpenError", { defaultValue: "We could not open this conversation." })
      );
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

  if (activeConversationId && currentAccountId) {
    return (
      <ChatDetailScreen
        conversationId={activeConversationId}
        currentAccountId={currentAccountId}
        conversation={null}
        onBackToList={() => setActiveConversationId(null)}
        onOpenLinkedResource={(resourceId) => setSelectedResourceId(resourceId)}
        onOpenLinkedAccount={(accountId) => setSelectedAccountId(accountId)}
      />
    );
  }

  if (activeSurface === "needs") {
    return (
      <SearchNeedsScreen
        currentAccountId={currentAccountId}
        onSwitchToResources={() => setActiveSurface("resources")}
      />
    );
  }

  return (
    <SearchResourcesScreen
      currentAccountId={currentAccountId}
      onOpenResource={handleOpenResource}
      onSwitchToNeeds={() => setActiveSurface("needs")}
    />
  );
}
