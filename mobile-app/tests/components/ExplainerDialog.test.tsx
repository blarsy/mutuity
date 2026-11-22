import React from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { ExplainerDialog } from "../../src/components/explainer/ExplainerDialog";

jest.mock("../../src/assets/img/CROSS.svg", () => "CrossIcon");

const labels = {
  stepLabel: "Step {{current}} of {{total}}",
  close: "Close guide",
  previous: "Previous slide",
  next: "Next slide"
};

const slides = [
  { id: "one", title: "First", body: "First body" },
  { id: "two", title: "Second", body: "Second body" },
  { id: "three", title: "Third", body: "Third body" }
];

describe("ExplainerDialog", () => {
  it("navigates with labelled chevrons and disables them at the boundaries", () => {
    const screen = render(
      <PaperProvider>
        <ExplainerDialog visible onClose={jest.fn()} title="Guide" slides={slides} labels={labels} />
      </PaperProvider>
    );

    const previous = screen.getByRole("button", { name: labels.previous });
    const next = screen.getByRole("button", { name: labels.next });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();

    fireEvent.press(next);
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
    expect(previous).toBeEnabled();
    fireEvent.press(next);
    expect(screen.getByText("Step 3 of 3")).toBeTruthy();
    expect(next).toBeDisabled();
    fireEvent.press(previous);
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
  });

  it("keeps the cross in the dialog while navigating and closes from the cross or backdrop", () => {
    const onClose = jest.fn();
    const screen = render(
      <PaperProvider>
        <ExplainerDialog visible onClose={onClose} title="Guide" slides={slides} labels={labels} testID="guide-dialog" />
      </PaperProvider>
    );

    const dialog = within(screen.getByTestId("guide-dialog"));
    expect(dialog.getByText("Guide")).toBeTruthy();
    expect(dialog.getByRole("button", { name: labels.close })).toBeTruthy();
    fireEvent.press(dialog.getByRole("button", { name: labels.next }));
    expect(dialog.getByText("Step 2 of 3")).toBeTruthy();
    fireEvent.press(dialog.getByRole("button", { name: labels.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("explainer-backdrop", { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not render controls when hidden or without slides", () => {
    const screen = render(
      <PaperProvider>
        <ExplainerDialog visible={false} onClose={jest.fn()} title="Guide" slides={slides} labels={labels} />
      </PaperProvider>
    );
    expect(screen.queryByRole("button", { name: labels.close })).toBeNull();

    screen.rerender(
      <PaperProvider>
        <ExplainerDialog visible onClose={jest.fn()} title="Guide" slides={[]} labels={labels} />
      </PaperProvider>
    );
    expect(screen.queryByRole("button", { name: labels.close })).toBeNull();
  });
});