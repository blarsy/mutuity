import type { Meta, StoryObj } from "@storybook/react";

import LoginPage from "../../pages/login";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Auth/Login",
  component: LoginPage,
  parameters: pageParameters({
    pathname: "/login",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};

export const WithReturnPath: Story = {
  parameters: {
    nextjs: { router: { pathname: "/login", asPath: "/login?next=%2Fclaims", query: { next: "/claims" } } }
  }
};
