import type { Meta, StoryObj } from "@storybook/react";

import ChangePasswordPage from "../../pages/change-password";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof ChangePasswordPage> = {
  title: "Pages/Auth/Change Password",
  component: ChangePasswordPage,
  parameters: pageParameters({ pathname: "/change-password" })
};

export default meta;

type Story = StoryObj<typeof ChangePasswordPage>;

export const Default: Story = {};
