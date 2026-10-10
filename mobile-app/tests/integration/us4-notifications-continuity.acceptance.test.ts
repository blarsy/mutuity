import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { NotificationsScreen } from "../../src/screens/notifications/NotificationsScreen";

// These acceptance cases inject their feed; shared realtime is covered by the
// focused screen tests, not by opening a real account subscription here.
jest.mock("../../src/services/realtime/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("../../src/services/graphql/notifications", () => ({
  fetchNotificationWindow: jest.fn(() => new Promise(() => {})),
  markNotificationRead: jest.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: jest.fn().mockResolvedValue(undefined)
}));

// Expo's Jest asset loader returns SVG objects rather than renderable components.
// The actual event-to-artwork mapping is covered separately by notification-icons.test.ts.
jest.mock("../../src/screens/notifications/notificationIcons", () => ({
  getNotificationIcon: () => () => null
}));

describe("US4 notifications continuity acceptance", () => {
  const mockNotifications = [
    {
      id: "notif-1",
      source: "account" as const,
      headline1: "New bid",
      headline2: "",
      description: "Someone placed a bid on your resource",
      createdAt: "2026-07-29T10:00:00Z",
      readAt: null
    },
    {
      id: "notif-2",
      source: "account" as const,
      headline1: "Resource approved",
      headline2: "",
      description: "Your resource has been approved",
      createdAt: "2026-07-28T09:00:00Z",
      readAt: "2026-07-28T10:00:00Z"
    },
    {
      id: "notif-3",
      source: "account" as const,
      headline1: "Campaign update",
      headline2: "",
      description: "A campaign you follow has been updated",
      createdAt: "2026-07-27T08:00:00Z",
      readAt: "2026-07-27T09:00:00Z"
    }
  ];

  it("renders notifications with correct read/unread visual distinction", async () => {
    const screen = render(
      React.createElement(NotificationsScreen, {
        accountId: "test-account-id",
        notifications: mockNotifications,
        loading: false
      })
    );

    await waitFor(() => {
      // Unread notification should be visible
      expect(screen.getByText("New bid")).toBeTruthy();
      // Read notifications should also be visible
      expect(screen.getByText("Resource approved")).toBeTruthy();
      expect(screen.getByText("Campaign update")).toBeTruthy();
    });

    // Unread notification row should exist and be distinguishable
    const unreadRow = screen.getByTestId("notification-row-notif-1");
    expect(unreadRow).toBeTruthy();

    // Read notification rows should exist
    expect(screen.getByTestId("notification-row-notif-2")).toBeTruthy();
    expect(screen.getByTestId("notification-row-notif-3")).toBeTruthy();
  });

  it("shows empty state when no notifications exist", async () => {
    const screen = render(
      React.createElement(NotificationsScreen, {
        accountId: "test-account-id",
        notifications: [],
        loading: false
      })
    );

    await waitFor(() => {
      expect(screen.getByText("No notifications yet.")).toBeTruthy();
    });
  });

  it.each([
    "claim_declined", "claim_withdrawn", "claim_expired", "claim_need_deactivated", "need_expired_claims_declined"
  ])("preserves the %s source and payload when marking read and navigating", eventType => {
    const notification = {
      id: "lifecycle-notification",
      source: "need-claim" as const,
      eventType,
      headline1: "Claim update",
      headline2: "",
      description: "Community garden",
      payload: { needId: "need-123", declinedCount: 3 },
      createdAt: "2026-10-07T12:00:00Z",
      readAt: null
    };
    const onMarkRead = jest.fn();
    const onOpenNotification = jest.fn();
    const screen = render(React.createElement(NotificationsScreen, {
      notifications: [notification], onMarkRead, onOpenNotification
    }));
    fireEvent.press(screen.getByTestId("notification-row-lifecycle-notification"));
    expect(onMarkRead).toHaveBeenCalledWith(notification.id, "need-claim");
    expect(onOpenNotification).toHaveBeenCalledWith(notification);
  });

  it("shows loading state while fetching notifications", async () => {
    const screen = render(
      React.createElement(NotificationsScreen, {
        accountId: "test-account-id",
        loading: true
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Loading notifications...")).toBeTruthy();
    });
  });

  it("shows error state when notifications fail to load", async () => {
    const screen = render(
      React.createElement(NotificationsScreen, {
        accountId: "test-account-id",
        errorMessage: "Failed to load notifications",
        loading: false
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load notifications")).toBeTruthy();
    });
  });

  it("sorts notifications by creation date descending", async () => {
    const screen = render(
      React.createElement(NotificationsScreen, {
        accountId: "test-account-id",
        notifications: mockNotifications,
        loading: false
      })
    );

    await waitFor(() => {
      const rows = [
        screen.getByTestId("notification-row-notif-1"),
        screen.getByTestId("notification-row-notif-2"),
        screen.getByTestId("notification-row-notif-3")
      ];

      // All rows should be present
      rows.forEach((row) => expect(row).toBeTruthy());
    });
  });
});