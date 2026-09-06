import type { Meta, StoryObj } from "@storybook/react";

import SupportPage from "../../pages/support";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof SupportPage> = {
  title: "Pages/Support",
  component: SupportPage,
  parameters: pageParameters({ pathname: "/support", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof SupportPage>;

export const Default: Story = {};
