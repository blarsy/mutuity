import type { Meta, StoryObj } from "@storybook/react";

import CampaignsPage from "../../pages/campaigns/index";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CampaignsPage> = {
  title: "Pages/Campaigns/Campaigns",
  component: CampaignsPage,
  parameters: pageParameters({ pathname: "/campaigns", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof CampaignsPage>;

export const SignedOut: Story = {};

export const SignedIn: Story = {
  parameters: { auth: { session: AUTHENTICATED_SESSION } }
};
