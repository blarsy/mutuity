import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HowToGetTokensSection } from "./HowToGetTokensSection";
import {
  HOW_TO_GET_TOKENS_OPPORTUNITIES,
  PROFILE_OPPORTUNITY_IDS,
  REMAINING_OPPORTUNITY_IDS,
  type HowToGetTokensOpportunityId,
  type HowToGetTokensProgress
} from "../../features/howToGetTokens";

const meta = {
  title: "Components/HowToGetTokensSection",
  component: HowToGetTokensSection,
  args: {
    onGoToOpportunity: () => undefined
  }
} satisfies Meta<typeof HowToGetTokensSection>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={styles.frame}>{children}</View>;
}

function buildProgress(
  completed: HowToGetTokensOpportunityId[],
  remaining: Partial<Record<HowToGetTokensOpportunityId, number>>
): HowToGetTokensProgress {
  return { completed, remaining };
}

/** Every opportunity is still pending: nothing collected, nothing to reap. */
export const AllPending: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={buildProgress([], {})}
      />
    </Frame>
  )
};

/** All one-time profile rewards collected; recurring rewards still pending. */
export const AllProfileRewardsCollected: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={buildProgress([...PROFILE_OPPORTUNITY_IDS], {})}
      />
    </Frame>
  )
};

/** Every reward collected: profile done and no remaining recurring rewards. */
export const AllCollected: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={buildProgress(
          [...PROFILE_OPPORTUNITY_IDS],
          {
            resourceFirstImage: 0,
            resourceDefaultTokenAmount: 0,
            needFirstImage: 0,
            needDefaultTokenAmount: 0
          }
        )}
      />
    </Frame>
  )
};

/** Mixed state: some profile rewards done, some recurring rewards left to reap. */
export const Mixed: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={buildProgress(
          ["profileAvatar", "profileBio"],
          { resourceFirstImage: 3, needDefaultTokenAmount: 1 }
        )}
      />
    </Frame>
  )
};

/** Only recurring rewards remain, with varying counts per opportunity. */
export const OnlyRecurringRemaining: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={buildProgress(
          [...PROFILE_OPPORTUNITY_IDS],
          {
            resourceFirstImage: 2,
            resourceDefaultTokenAmount: 5,
            needFirstImage: 1,
            needDefaultTokenAmount: 4
          }
        )}
      />
    </Frame>
  )
};

/** No progress provided: the section falls back to rendering everything pending. */
export const WithoutProgress: Story = {
  render: () => (
    <Frame>
      <HowToGetTokensSection onGoToOpportunity={() => undefined} />
    </Frame>
  )
};

const styles = StyleSheet.create({
  frame: {
    minHeight: 640,
    padding: 16
  }
});