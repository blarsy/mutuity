import type { Meta, StoryObj } from "@storybook/react";

import AppleAuthCallbackPage from "../../pages/auth/apple/callback";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof AppleAuthCallbackPage> = {
  title: "Pages/Auth/Apple Callback",
  component: AppleAuthCallbackPage,
  parameters: pageParameters({
    pathname: "/auth/apple/callback",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof AppleAuthCallbackPage>;

export const Default: Story = {};
