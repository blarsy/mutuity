import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { NavigationBackHeader } from "../../src/components/primitives";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
  })
}));

describe("NavigationBackHeader", () => {
  it("renders an accessible back button and invokes the parent navigation callback", () => {
    const onBack = jest.fn();
    const screen = render(<NavigationBackHeader onBack={onBack} />);

    fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does not render when no parent navigation callback is provided", () => {
    const screen = render(<NavigationBackHeader />);

    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});
