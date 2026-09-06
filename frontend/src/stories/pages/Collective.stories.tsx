import type { Meta, StoryObj } from "@storybook/react";

import CollectivePage from "../../pages/collective";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof CollectivePage> = {
  title: "Pages/Collective",
  component: CollectivePage,
  parameters: pageParameters({ pathname: "/collective", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof CollectivePage>;

export const Default: Story = {};
