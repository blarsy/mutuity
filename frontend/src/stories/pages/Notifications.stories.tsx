import type { Meta, StoryObj } from "@storybook/react";

import NotificationsPage from "../../pages/notifications";
import {
  NOTIFICATION_FIXTURES,
  buildNotificationsOverviewData,
  type NotificationFixture
} from "../fixtures/notifications";
import { withAppShellOperations } from "../harness/appShellOperations";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";

const meta: Meta<typeof NotificationsPage> = {
  title: "Pages/Notifications",
  component: NotificationsPage,
  parameters: {
    nextjs: { router: { pathname: "/notifications", asPath: "/notifications" } },
    auth: { session: AUTHENTICATED_SESSION }
  }
};

export default meta;

type Story = StoryObj<typeof NotificationsPage>;

function storyForFixtures(fixtures: NotificationFixture[]): Story {
  return {
    parameters: {
      apollo: {
        operations: withAppShellOperations({
          NotificationsOverview: buildNotificationsOverviewData(fixtures)
        })
      }
    }
  };
}

function storyForEventType(eventType: string): Story {
  const fixture = NOTIFICATION_FIXTURES.find(candidate => candidate.eventType === eventType);

  if (!fixture) {
    throw new Error(`Missing notification fixture for event type ${eventType}`);
  }

  return storyForFixtures([fixture]);
}

/** One dummy notification for every notification type the page can render. */
export const AllNotificationTypes = storyForFixtures(NOTIFICATION_FIXTURES);

export const Empty: Story = storyForFixtures([]);

export const Loading: Story = {
  parameters: {
    apollo: {
      operations: withAppShellOperations(),
      loadingOperations: ["NotificationsOverview"]
    }
  }
};

export const LoadFailed: Story = {
  parameters: {
    apollo: {
      operations: withAppShellOperations(),
      errorOperations: { NotificationsOverview: "Notifications are temporarily unavailable." }
    }
  }
};

export const SignedOut: Story = {
  parameters: {
    auth: { session: ANONYMOUS_SESSION },
    apollo: { operations: withAppShellOperations() }
  }
};

export const ClaimCreated = storyForEventType("claim_created");
export const ClaimSettled = storyForEventType("claim_settled");
export const ResourceBidCreated = storyForEventType("resource_bid_created");
export const ResourceBidExpiringSoon = storyForEventType("resource_bid_expiring_soon");
export const ResourceBidAccepted = storyForEventType("resource_bid_accepted");
export const ResourceBidDeclined = storyForEventType("resource_bid_declined");
export const ResourceBidCancelled = storyForEventType("resource_bid_cancelled");
export const ResourceBidExpired = storyForEventType("resource_bid_expired");
export const CampaignAirdropComingSoon = storyForEventType("campaign_airdrop_coming_soon");
export const CampaignAirdropDone = storyForEventType("campaign_airdrop_done");
export const WelcomeProfileReward = storyForEventType("welcome_profile_reward");
export const GiftTokensReceived = storyForEventType("gift_tokens_received");
export const CampaignModerationNoteReceived = storyForEventType("campaign_moderation_note_received");
export const CampaignApproved = storyForEventType("campaign_approved");
export const CampaignCreatorAdaptationSubmitted = storyForEventType("campaign_creator_adaptation_submitted");
export const UnknownEventTypeFallback = storyForEventType("some_future_event_type");
