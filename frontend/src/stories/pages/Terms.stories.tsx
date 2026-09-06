import type { Meta, StoryObj } from "@storybook/react";

import TermsPage from "../../pages/terms";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof TermsPage> = {
  title: "Pages/Legal/Terms",
  component: TermsPage,
  parameters: pageParameters({ pathname: "/terms", session: ANONYMOUS_SESSION })
};

export default meta;

type Story = StoryObj<typeof TermsPage>;

export const Default: Story = {};
