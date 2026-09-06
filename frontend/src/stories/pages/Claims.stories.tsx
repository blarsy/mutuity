import type { Meta, StoryObj } from "@storybook/react";

import ClaimsPage from "../../pages/claims";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ClaimsPage> = {
  title: "Pages/Claims",
  component: ClaimsPage,
  parameters: pageParameters({ pathname: "/claims" })
};

export default meta;

type Story = StoryObj<typeof ClaimsPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
