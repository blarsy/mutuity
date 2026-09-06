import type { Meta, StoryObj } from "@storybook/react";

import ContributionPage from "../../pages/contribution";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ContributionPage> = {
  title: "Pages/Contribution",
  component: ContributionPage,
  parameters: pageParameters({ pathname: "/contribution" })
};

export default meta;

type Story = StoryObj<typeof ContributionPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
