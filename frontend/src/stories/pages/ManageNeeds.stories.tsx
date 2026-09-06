import type { Meta, StoryObj } from "@storybook/react";

import ManageNeedsPage from "../../pages/needs/manage";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ManageNeedsPage> = {
  title: "Pages/Needs/Manage Needs",
  component: ManageNeedsPage,
  parameters: pageParameters({ pathname: "/needs/manage" })
};

export default meta;

type Story = StoryObj<typeof ManageNeedsPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
