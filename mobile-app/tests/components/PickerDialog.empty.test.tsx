import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { PickerDialog } from "../../src/components/primitives/PickerDialog";
import i18n from "../../src/i18n";

describe("PickerDialog empty state", () => {
  afterEach(async () => {
    await act(async () => { await i18n.changeLanguage("en"); });
  });

  it("shows a message for an empty list and replaces it when items arrive", () => {
    const onConfirm = jest.fn();
    const onDismiss = jest.fn();
    const renderPicker = (items: { value: string; label: string }[]) => (
      <PaperProvider>
        <PickerDialog visible title="Options" items={items} selectedValues={[]} onConfirm={onConfirm} onDismiss={onDismiss} />
      </PaperProvider>
    );
    const screen = render(renderPicker([]));

    expect(screen.getByText("No data available at this time")).toBeTruthy();
    fireEvent.press(screen.getByText("OK"));
    expect(onConfirm).toHaveBeenCalledWith([]);
    fireEvent.press(screen.getByText("Cancel"));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    screen.rerender(renderPicker([{ value: "one", label: "Option one" }]));
    expect(screen.queryByText("No data available at this time")).toBeNull();
    fireEvent.press(screen.getByText("Option one"));
    fireEvent.press(screen.getByText("OK"));
    expect(onConfirm).toHaveBeenLastCalledWith(["one"]);
  });

  it("shows the empty message in French", async () => {
    await act(async () => { await i18n.changeLanguage("fr"); });
    const screen = render(
      <PaperProvider>
        <PickerDialog visible title="Options" items={[]} selectedValues={[]} onConfirm={jest.fn()} onDismiss={jest.fn()} />
      </PaperProvider>
    );

    expect(screen.getByText("Aucune donnée disponible pour le moment")).toBeTruthy();
  });
});