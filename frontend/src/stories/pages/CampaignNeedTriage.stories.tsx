import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import CampaignNeedTriagePage from "../../pages/campaigns/triage";
import { CampaignTriageStoryProvider } from "../harness/CampaignTriageStoryProvider";
import { TRIAGE_CAMPAIGN_ID, TRIAGE_MUTATION_ERROR, type CampaignTriagePhase } from "../harness/campaignTriageMocks";
import { ANONYMOUS_SESSION } from "../harness/mockAuth";
import { pageParameters } from "../harness/pageStory";

const renderPhase = (phase: CampaignTriagePhase) => () => (
  <CampaignTriageStoryProvider kind="need" phase={phase}>
    <CampaignNeedTriagePage />
  </CampaignTriageStoryProvider>
);

const meta: Meta<typeof CampaignNeedTriagePage> = {
  title: "Pages/Campaigns/Need Triage",
  component: CampaignNeedTriagePage,
  render: renderPhase("mixed"),
  parameters: pageParameters({ pathname: "/campaigns/triage" })
};

export default meta;

type Story = StoryObj<typeof CampaignNeedTriagePage>;

export const Default: Story = {};

export const Pending: Story = { render: renderPhase("pending") };
export const Accepted: Story = { render: renderPhase("accepted") };
export const Rejected: Story = { render: renderPhase("rejected") };
export const Empty: Story = { render: renderPhase("empty") };
export const Loading: Story = { render: renderPhase("loading") };
export const QueryError: Story = { render: renderPhase("queryError") };

export const FilteredByCampaign: Story = {
  parameters: pageParameters({ pathname: "/campaigns/triage", query: { campaignId: TRIAGE_CAMPAIGN_ID } })
};

export const Accepting: Story = {
  render: renderPhase("accepting"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByRole("button", { name: /^(Accept|Accepter)$/i });
    await userEvent.click(buttons[0]!);
    await expect(buttons[1]).toBeDisabled();
  }
};

export const Rejecting: Story = {
  render: renderPhase("rejecting"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByRole("button", { name: /^(Reject|Rejeter)$/i });
    await userEvent.click(buttons[0]!);
    await expect(buttons[1]).toBeDisabled();
  }
};

export const ModerationError: Story = {
  render: renderPhase("moderationError"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = await canvas.findAllByRole("button", { name: /^(Accept|Accepter)$/i });
    await userEvent.click(buttons[0]!);
    await expect(await canvas.findByText(TRIAGE_MUTATION_ERROR)).toBeVisible();
    await expect(buttons[0]).toBeEnabled();
  }
};

export const SignedOut: Story = {
  parameters: { auth: { session: ANONYMOUS_SESSION } }
};
