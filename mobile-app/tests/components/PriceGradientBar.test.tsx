import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { PriceGradientBar } from "../../src/components/primitives/PriceGradientBar";

describe("PriceGradientBar", () => {
  it("ignores repeated layout notifications for the same width and percent", () => {
    const onPercentChanged = jest.fn();

    const { getByTestId } = render(
      <PriceGradientBar
        testID="price-gradient-bar"
        percent={50}
        onPercentChanged={onPercentChanged}
      />
    );

    fireEvent(getByTestId("price-gradient-bar"), "layout", {
      nativeEvent: { layout: { width: 200 } }
    });

    fireEvent(getByTestId("price-gradient-bar"), "layout", {
      nativeEvent: { layout: { width: 200 } }
    });

    expect(onPercentChanged).toHaveBeenCalledTimes(1);
  });
});
