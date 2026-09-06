import type { Meta, StoryObj } from "@storybook/react";

import ManageResourcesPage from "../../pages/resources/manage";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ManageResourcesPage> = {
  title: "Pages/Resources/Manage Resources",
  component: ManageResourcesPage,
  parameters: pageParameters({ pathname: "/resources/manage" })
};

export default meta;

type Story = StoryObj<typeof ManageResourcesPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
