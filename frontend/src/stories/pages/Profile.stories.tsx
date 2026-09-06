import type { Meta, StoryObj } from "@storybook/react";

import ProfilePage from "../../pages/profile";
import { ANONYMOUS_SESSION, UNVERIFIED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/Profile",
  component: ProfilePage,
  parameters: pageParameters({ pathname: "/profile" })
};

export default meta;

type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};

export const EmailNotVerified: Story = {
  parameters: { auth: { session: UNVERIFIED_SESSION } }
};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
