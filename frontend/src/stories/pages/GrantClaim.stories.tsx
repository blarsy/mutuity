import type { Meta, StoryObj } from "@storybook/react";

import GrantClaimPage from "../../pages/grants/[id]";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const GRANT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const meta: Meta<typeof GrantClaimPage> = {
  title: "Pages/Grants/Grant Claim",
  component: GrantClaimPage,
  parameters: pageParameters({
    pathname: "/grants/[id]",
    asPath: `/grants/${GRANT_ID}`,
    query: { id: GRANT_ID }
  })
};

export default meta;

type Story = StoryObj<typeof GrantClaimPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
