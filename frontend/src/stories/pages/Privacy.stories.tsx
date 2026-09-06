import type { Meta, StoryObj } from "@storybook/react";

import PrivacyPage from "../../pages/privacy";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof PrivacyPage> = {
  title: "Pages/Legal/Privacy",
  component: PrivacyPage,
  parameters: pageParameters({ pathname: "/privacy", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof PrivacyPage>;

export const Default: Story = {};
