import type { Meta, StoryObj } from "@storybook/react";

import CampaignResourceTriagePage from "../../pages/campaigns/resource-triage";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CampaignResourceTriagePage> = {
  title: "Pages/Campaigns/Resource Triage",
  component: CampaignResourceTriagePage,
  parameters: pageParameters({ pathname: "/campaigns/resource-triage" })
};

export default meta;

type Story = StoryObj<typeof CampaignResourceTriagePage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
