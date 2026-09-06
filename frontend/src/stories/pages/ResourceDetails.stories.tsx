import type { Meta, StoryObj } from "@storybook/react";

import ResourceDetailRoute from "../../pages/resources/[resourceId]";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const RESOURCE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const meta: Meta<typeof ResourceDetailRoute> = {
  title: "Pages/Resources/Resource Details",
  component: ResourceDetailRoute,
  parameters: pageParameters({
    pathname: "/resources/[resourceId]",
    asPath: `/resources/${RESOURCE_ID}`,
    query: { resourceId: RESOURCE_ID }
  })
};

export default meta;

type Story = StoryObj<typeof ResourceDetailRoute>;

export const Default: Story = {};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
