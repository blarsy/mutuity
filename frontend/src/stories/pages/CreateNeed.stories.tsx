import type { Meta, StoryObj } from "@storybook/react";

import CreateNeedPage from "../../pages/needs/create";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CreateNeedPage> = {
  title: "Pages/Needs/Create Need",
  component: CreateNeedPage,
  parameters: pageParameters({ pathname: "/needs/create" })
};

export default meta;

type Story = StoryObj<typeof CreateNeedPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
