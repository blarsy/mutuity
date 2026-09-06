import type { Meta, StoryObj } from "@storybook/react";

import GoogleAuthCallbackPage from "../../pages/auth/google/callback";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof GoogleAuthCallbackPage> = {
  title: "Pages/Auth/Google Callback",
  component: GoogleAuthCallbackPage,
  parameters: pageParameters({
    pathname: "/auth/google/callback",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof GoogleAuthCallbackPage>;

export const Default: Story = {};
