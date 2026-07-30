import React, { useState } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CampaignDetailScreen } from "../../src/screens/campaigns/CampaignDetailScreen";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import type { CampaignItem } from "../../src/services/graphql/campaigns";

import "../../src/i18n";

function CampaignModerationHarness(): React.JSX.Element {
  const [campaign, setCampaign] = useState<CampaignItem>({
    id: "campaign-approved",
    title: "Neighborhood cleanup drive",
    description: "Clean up the local park",
    imageUrl: null,
    startAt: "2026-08-01T00:00:00.000Z",
    airdropAt: "2026-08-15T00:00:00.000Z",
    endAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-07-25T12:00:00.000Z",
    creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
    moderationStatus: CampaignModerationStatus.Approved,
    resourceCount: 3,
    needCount: 2,
    theme: "",
    pendingEntries: [
      {
        id: "entry-1",
        type: "resource",
        title: "Rakes and brooms",
        creatorAccountId: "00000000-0000-0000-0000-000000000001",
        creatorDisplayName: "Alice"
      },
      {
        id: "entry-2",
        type: "need",
        title: "Need volunteers for cleanup",
        creatorAccountId: "00000000-0000-0000-0000-000000000002",
        creatorDisplayName: "Bob"
      }
    ]
  });

  return React.createElement(CampaignDetailScreen, {
    campaign,
    creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
    onApprovePendingEntry: (entryId: string) => {
      setCampaign((prev) => ({
        ...prev,
        pendingEntries: (prev.pendingEntries ?? []).filter((e) => e.id !== entryId)
      }));
    },
    onRejectPendingEntry: (entryId: string) => {
      setCampaign((prev) => ({
        ...prev,
        pendingEntries: (prev.pendingEntries ?? []).filter((e) => e.id !== entryId)
      }));
    }
  });
}

describe("US3 campaign moderation acceptance", () => {
  it("campaign creator moderates resources and needs", async () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null, React.createElement(CampaignModerationHarness))
    );

    await waitFor(() => {
      expect(screen.getByText("Neighborhood cleanup drive")).toBeTruthy();
    });

    expect(screen.getByText("Rakes and brooms")).toBeTruthy();
    expect(screen.getByText("Need volunteers for cleanup")).toBeTruthy();

    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    fireEvent.press(approveButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Rakes and brooms")).toBeNull();
    });

    expect(screen.getByText("Need volunteers for cleanup")).toBeTruthy();
  });
});

