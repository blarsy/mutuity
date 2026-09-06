import type { Meta, StoryObj } from "@storybook/react";

import AccountDetailsPage from "../../pages/accounts/[accountId]";
import {
  MOCK_ACCOUNT_ID,
  mockAccountDetail,
  mockAccountNeeds,
  mockAccountResources
} from "../fixtures/listings";
import { withAppShellOperations } from "../harness/appShellOperations";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";

const meta: Meta<typeof AccountDetailsPage> = {
  title: "Pages/Accounts/Account Details",
  component: AccountDetailsPage,
  args: {
    accountId: MOCK_ACCOUNT_ID,
    initialAccount: mockAccountDetail,
    initialNeeds: mockAccountNeeds,
    initialResources: mockAccountResources
  },
  parameters: {
    nextjs: {
      router: {
        pathname: "/accounts/[accountId]",
        asPath: `/accounts/${MOCK_ACCOUNT_ID}`,
        query: { accountId: MOCK_ACCOUNT_ID }
      }
    },
    auth: { session: AUTHENTICATED_SESSION },
    apollo: { operations: withAppShellOperations() }
  }
};

export default meta;

type Story = StoryObj<typeof AccountDetailsPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};

export const NotFound: Story = {
  args: { initialAccount: null, initialNeeds: [], initialResources: [] }
};
