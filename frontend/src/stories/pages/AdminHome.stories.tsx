import type { Meta, StoryObj } from "@storybook/react";

import AdminIndexPage from "../../pages/admin/index";
import { ADMIN_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof AdminIndexPage> = {
  title: "Pages/Admin/Admin Home",
  component: AdminIndexPage,
  parameters: pageParameters({ pathname: "/admin", session: ADMIN_SESSION })
};

export default meta;

type Story = StoryObj<typeof AdminIndexPage>;

export const Default: Story = {};
