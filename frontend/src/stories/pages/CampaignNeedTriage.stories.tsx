import type { Meta, StoryObj } from "@storybook/react";

import CampaignNeedTriagePage from "../../pages/campaigns/triage";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CampaignNeedTriagePage> = {
  title: "Pages/Campaigns/Need Triage",
  component: CampaignNeedTriagePage,
  parameters: pageParameters({ pathname: "/campaigns/triage" })
};

export default meta;

type Story = StoryObj<typeof CampaignNeedTriagePage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
