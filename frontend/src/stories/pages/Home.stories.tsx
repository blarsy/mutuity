import type { Meta, StoryObj } from "@storybook/react";

import HomePage from "../../pages/index";
import { ANONYMOUS_SESSION, AUTHENTICATED_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof HomePage> = {
  title: "Pages/Home",
  component: HomePage,
  parameters: pageParameters({
    pathname: "/",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof HomePage>;

export const SignedOut: Story = {};

export const SignedIn: Story = {
  parameters: { auth: { session: AUTHENTICATED_SESSION } }
};
