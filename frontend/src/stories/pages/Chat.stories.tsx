import type { Meta, StoryObj } from "@storybook/react";

import ChatPage from "../../pages/chat";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ChatPage> = {
  title: "Pages/Chat",
  component: ChatPage,
  parameters: pageParameters({ pathname: "/chat" })
};

export default meta;

type Story = StoryObj<typeof ChatPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
