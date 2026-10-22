import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { Dialog, PaperProvider } from "react-native-paper";
import * as SafeArea from "react-native-safe-area-context";

import { PickerDialog } from "../../src/components/primitives/PickerDialog";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context/jest/mock").default,
  useSafeAreaInsets: jest.fn()
}));

describe("PickerDialog viewport bounds", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    { height: 800, top: 0, bottom: 0 },
    { height: 390, top: 0, bottom: 21 },
    { height: 844, top: 47, bottom: 34 }
  ])("caps the entire dialog for a $height-point window", ({ height, top, bottom }) => {
    jest.mocked(ReactNative.useWindowDimensions).mockReturnValue({
      width: 390,
      height,
      scale: 1,
      fontScale: 1
    });
    jest.mocked(SafeArea.useSafeAreaInsets).mockReturnValue({ top, bottom, left: 0, right: 0 });
    const onConfirm = jest.fn();
    const items = Array.from({ length: 100 }, (_, index) => ({
      value: String(index),
      label: `Campaign ${index}`
    }));
    const screen = render(
      <PaperProvider>
        <PickerDialog
          visible
          title="Campaigns"
          items={items}
          selectedValues={[]}
          onConfirm={onConfirm}
          onDismiss={jest.fn()}
          testID="campaign-picker"
        />
      </PaperProvider>
    );

    expect(ReactNative.StyleSheet.flatten(screen.UNSAFE_getByType(Dialog).props.style)).toMatchObject({
      maxHeight: height - top - bottom - 32,
      marginHorizontal: 16,
      marginVertical: 16
    });
    expect(screen.UNSAFE_getByType(Dialog.Content)).toHaveStyle({ flexShrink: 1, minHeight: 0 });
    expect(screen.UNSAFE_getByType(ReactNative.ScrollView)).toBeTruthy();

    fireEvent.press(screen.getByText("Campaign 99"));
    fireEvent.press(screen.getByText("OK"));
    expect(onConfirm).toHaveBeenCalledWith(["99"]);
  });
});