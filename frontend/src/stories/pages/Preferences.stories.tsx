import type { Meta, StoryObj } from "@storybook/react";

import PreferencesPage from "../../pages/preferences";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const meta: Meta<typeof PreferencesPage> = {
  title: "Pages/Preferences",
  component: PreferencesPage,
  parameters: pageParameters({ pathname: "/preferences" })
};

export default meta;

type Story = StoryObj<typeof PreferencesPage>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
