import type { ComponentProps } from "react";

import { NeedSummaryFacts } from "./NeedSummaryFacts";

export default {
  title: "Need/NeedSummaryFacts",
  component: NeedSummaryFacts
};

type StoryArgs = ComponentProps<typeof NeedSummaryFacts>;

function Template(args: StoryArgs) {
  return <NeedSummaryFacts {...args} />;
}

export const PendingNeed = {
  render: Template,
  args: {
    location: "Tournai",
    intensity: "SHARING",
    proposedTopesAmount: 250,
    joinedAt: "2026-04-19T10:00:00.000Z",
    triagedAt: null
  }
};

export const TriagedNeed = {
  render: Template,
  args: {
    location: "Mons",
    intensity: "LEG_UP",
    proposedTopesAmount: null,
    joinedAt: "2026-04-19T09:00:00.000Z",
    triagedAt: "2026-04-19T10:30:00.000Z"
  }
};
