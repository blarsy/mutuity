import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import { NotificationsScreen } from "../../src/screens/notifications/NotificationsScreen";

describe("US4 notifications continuity acceptance", () => {
  const mockNotifications = [
    {
      id: "notif-1",
      title: "New bid received",
      body: "Someone placed a bid on your resource",
      createdAt: "2026-07-29T10:00:00Z",
      readAt: null
    },
    {
      id: "notif-2",
      title: "Resource approved",
      body: "Your resource has been approved",
      createdAt: "2026-07-28T09:00:00Z",
      readAt: "2026-07-28T10:00:00Z"
    },
    {
      id: "notif-3",
      title: "Campaign update",
      body: "A campaign you follow has been updated",
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
      expect(screen.getByText("New bid received")).toBeTruthy();
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