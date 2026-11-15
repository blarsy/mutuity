import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ModerationListingGroup } from "../../src/screens/campaigns/ModerationListingGroup";

it("sorts accepted and pending by last action with submission fallback and independently collapses rejected items", () => {
  const screen = render(<ModerationListingGroup
    testID="rejected"
    rejectedLabel="Also show rejected resources"
    items={[
      { id: "pending", status: "PENDING", submittedAt: "2026-01-03" },
      { id: "accepted", status: "ACCEPTED", submittedAt: "2026-01-01", actedAt: "2026-01-04" },
      { id: "accepted-fallback", status: "ACCEPTED", submittedAt: "2026-01-02", actedAt: null },
      { id: "rejected-old", status: "REJECTED", submittedAt: "2026-01-01", actedAt: "2026-01-02" },
      { id: "rejected-new", status: "REJECTED", submittedAt: "2026-01-01", actedAt: "2026-01-05" },
      { id: "superseded", status: "SUPERSEDED", submittedAt: "2026-01-06" }
    ]}
    renderItem={item => <Text key={item.id} testID="entry">{item.id}</Text>}
  />);
  expect(screen.getAllByTestId("entry").map(item => item.props.children)).toEqual(["accepted", "pending", "accepted-fallback"]);
  const toggle = screen.getByRole("button", { name: "Also show rejected resources" });
  expect(toggle.props.accessibilityState.expanded).toBe(false);
  fireEvent.press(toggle);
  expect(screen.getAllByTestId("entry").map(item => item.props.children)).toEqual([
    "accepted", "pending", "accepted-fallback", "rejected-new", "rejected-old"
  ]);
  fireEvent.press(toggle);
  expect(screen.queryByTestId("rejected-list")).toBeNull();
});
