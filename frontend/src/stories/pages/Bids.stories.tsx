import type { Meta, StoryObj } from "@storybook/react";

import BidsPage from "../../pages/bids";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof BidsPage> = {
  title: "Pages/Bids",
  component: BidsPage,
  parameters: pageParameters({ pathname: "/bids" })
};

export default meta;

type Story = StoryObj<typeof BidsPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
