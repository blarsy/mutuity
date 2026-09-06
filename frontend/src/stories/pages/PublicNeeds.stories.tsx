import type { Meta, StoryObj } from "@storybook/react";

import PublicNeedsPage from "../../pages/needs/index";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof PublicNeedsPage> = {
  title: "Pages/Needs/Public Needs",
  component: PublicNeedsPage,
  parameters: pageParameters({ pathname: "/needs", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof PublicNeedsPage>;

export const SignedOut: Story = {};

export const SignedIn: Story = {
  parameters: { auth: { session: AUTHENTICATED_SESSION } }
};
