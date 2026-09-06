import type { Meta, StoryObj } from "@storybook/react";

import PublicResourcesPage from "../../pages/resources/index";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof PublicResourcesPage> = {
  title: "Pages/Resources/Public Resources",
  component: PublicResourcesPage,
  parameters: pageParameters({ pathname: "/resources", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof PublicResourcesPage>;

export const SignedOut: Story = {};

export const SignedIn: Story = {
  parameters: { auth: { session: AUTHENTICATED_SESSION } }
};
