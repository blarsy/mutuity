import type { Meta, StoryObj } from "@storybook/react";

import CreateCampaignPage from "../../pages/campaigns/create";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CreateCampaignPage> = {
  title: "Pages/Campaigns/Create Campaign",
  component: CreateCampaignPage,
  parameters: pageParameters({ pathname: "/campaigns/create" })
};

export default meta;

type Story = StoryObj<typeof CreateCampaignPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
