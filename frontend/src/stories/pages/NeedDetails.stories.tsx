import type { Meta, StoryObj } from "@storybook/react";

import NeedDetailsPage from "../../pages/needs/[needId]";
import { MOCK_NEED_ID, mockNeedDetail } from "../fixtures/listings";
import { withAppShellOperations } from "../harness/appShellOperations";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";

const meta: Meta<typeof NeedDetailsPage> = {
  title: "Pages/Needs/Need Details",
  component: NeedDetailsPage,
  args: {
    needId: MOCK_NEED_ID,
    initialNeed: mockNeedDetail
  },
  parameters: {
    nextjs: {
      router: {
        pathname: "/needs/[needId]",
        asPath: `/needs/${MOCK_NEED_ID}`,
        query: { needId: MOCK_NEED_ID }
      }
    },
    auth: { session: AUTHENTICATED_SESSION },
    apollo: { operations: withAppShellOperations({ ClaimConversationLookup: {} }) }
  }
};

export default meta;

type Story = StoryObj<typeof NeedDetailsPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};

export const NotFound: Story = {
  args: { initialNeed: null }
};

export const Inactive: Story = {
  args: { initialNeed: { ...mockNeedDetail, isActive: false } }
};
