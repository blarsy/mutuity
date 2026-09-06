import type { Meta, StoryObj } from "@storybook/react";

import CreateResourcePage from "../../pages/resources/create";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CreateResourcePage> = {
  title: "Pages/Resources/Create Resource",
  component: CreateResourcePage,
  parameters: pageParameters({ pathname: "/resources/create" })
};

export default meta;

type Story = StoryObj<typeof CreateResourcePage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
