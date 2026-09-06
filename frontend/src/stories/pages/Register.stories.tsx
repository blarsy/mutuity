import type { Meta, StoryObj } from "@storybook/react";

import RegisterPage from "../../pages/register";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof RegisterPage> = {
  title: "Pages/Auth/Register",
  component: RegisterPage,
  parameters: pageParameters({
    pathname: "/register",
    session: ANONYMOUS_SESSION
  })
};

export default meta;

type Story = StoryObj<typeof RegisterPage>;

export const Default: Story = {};
