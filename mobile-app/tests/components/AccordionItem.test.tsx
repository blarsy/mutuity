import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { Text } from "react-native-paper";

import { AccordionItem } from "../../src/components/primitives/AccordionItem";

describe("AccordionItem", () => {
  const renderWithPaper = (ui: React.ReactElement) => render(<PaperProvider>{ui}</PaperProvider>);

  it("hides its body by default", () => {
    const screen = renderWithPaper(
      <AccordionItem title="History" testID="history-accordion">
        <Text>Hidden content</Text>
      </AccordionItem>
    );

    expect(screen.queryByText("Hidden content")).toBeNull();
  });

  it("shows its body when expanded", () => {
    const screen = renderWithPaper(
      <AccordionItem title="History" testID="history-accordion" initialExpanded>
        <Text>Visible content</Text>
      </AccordionItem>
    );

    expect(screen.getByText("Visible content")).toBeTruthy();
  });

  it("toggles its body when the header is pressed", () => {
    const screen = renderWithPaper(
      <AccordionItem title="History" testID="history-accordion">
        <Text>Toggle content</Text>
      </AccordionItem>
    );

    expect(screen.queryByText("Toggle content")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "History" }));

    expect(screen.getByText("Toggle content")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "History" }));

    expect(screen.queryByText("Toggle content")).toBeNull();
  });
});