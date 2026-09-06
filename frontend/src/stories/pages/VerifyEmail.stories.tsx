import type { Meta, StoryObj } from "@storybook/react";

import VerifyEmailPage from "../../pages/verify-email";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof VerifyEmailPage> = {
  title: "Pages/Auth/Verify Email",
  component: VerifyEmailPage,
  parameters: pageParameters({
    pathname: "/verify-email",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof VerifyEmailPage>;

export const Default: Story = {};

export const WithToken: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: "/verify-email",
        asPath: "/verify-email?token=dummy-token",
        query: { token: "dummy-token" }
      }
    }
  }
};
