import type { Meta, StoryObj } from "@storybook/react";

import RestoreAccessPage from "../../pages/restore-access";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof RestoreAccessPage> = {
  title: "Pages/Auth/Restore Access",
  component: RestoreAccessPage,
  parameters: pageParameters({
    pathname: "/restore-access",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof RestoreAccessPage>;

export const Default: Story = {};
