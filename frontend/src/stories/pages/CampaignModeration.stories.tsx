import type { Meta, StoryObj } from "@storybook/react";

import CampaignModerationPage from "../../pages/campaigns/[campaignId]/moderation";
import { MOCK_CAMPAIGN_ID } from "../fixtures/listings";
import { ADMIN_SESSION, ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CampaignModerationPage> = {
  title: "Pages/Campaigns/Campaign Moderation",
  component: CampaignModerationPage,
  parameters: pageParameters({
    pathname: "/campaigns/[campaignId]/moderation",
    asPath: `/campaigns/${MOCK_CAMPAIGN_ID}/moderation`,
    query: { campaignId: MOCK_CAMPAIGN_ID }
  })
};

export default meta;

type Story = StoryObj<typeof CampaignModerationPage>;

export const Default: Story = {};

export const AsAdmin: Story = {
  parameters: { auth: { session: ADMIN_SESSION } }
};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
