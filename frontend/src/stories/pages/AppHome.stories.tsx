import type { Meta, StoryObj } from "@storybook/react";

import AppHomePage from "../../pages/app";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof AppHomePage> = {
  title: "Pages/App Home",
  component: AppHomePage,
  parameters: pageParameters({
    pathname: "/app",
    session: AUTHENTICATED_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof AppHomePage>;

export const SignedIn: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
