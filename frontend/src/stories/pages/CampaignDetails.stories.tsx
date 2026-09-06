import type { Meta, StoryObj } from "@storybook/react";

import PublicCampaignDetailPage from "../../pages/campaigns/[campaignId]";
import {
  MOCK_CAMPAIGN_ID,
  mockCampaignDetail,
  mockCampaignFormattedDates
} from "../fixtures/listings";
import { withAppShellOperations } from "../harness/appShellOperations";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";

const meta: Meta<typeof PublicCampaignDetailPage> = {
  title: "Pages/Campaigns/Campaign Details",
  component: PublicCampaignDetailPage,
  args: {
    campaignId: MOCK_CAMPAIGN_ID,
    initialCampaign: mockCampaignDetail,
    formattedDates: mockCampaignFormattedDates
  },
  parameters: {
    nextjs: {
      router: {
        pathname: "/campaigns/[campaignId]",
        asPath: `/campaigns/${MOCK_CAMPAIGN_ID}`,
        query: { campaignId: MOCK_CAMPAIGN_ID }
      }
    },
    auth: { session: AUTHENTICATED_SESSION },
    apollo: { operations: withAppShellOperations() }
  }
};

export default meta;

type Story = StoryObj<typeof PublicCampaignDetailPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};

export const NotFound: Story = {
  args: { initialCampaign: null }
};
