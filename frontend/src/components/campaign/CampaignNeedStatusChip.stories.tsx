import type { ComponentProps } from "react";

import { CampaignNeedStatusChip } from "./CampaignNeedStatusChip";

export default {
  title: "Campaign/CampaignNeedStatusChip",
  component: CampaignNeedStatusChip
};

type StoryArgs = ComponentProps<typeof CampaignNeedStatusChip>;

function Template(args: StoryArgs) {
  return <CampaignNeedStatusChip {...args} />;
}

export const Pending = {
  render: Template,
  args: {
    status: "PENDING"
  }
};

export const Accepted = {
  render: Template,
  args: {
    status: "ACCEPTED"
  }
};

export const Rejected = {
  render: Template,
  args: {
    status: "REJECTED"
  }
};
