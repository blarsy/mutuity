import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { PriceGradientBar } from "../../src/components/primitives/PriceGradientBar";

describe("PriceGradientBar", () => {
  it("does not change the value on layout and responds to user interaction", () => {
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

    expect(onPercentChanged).not.toHaveBeenCalled();

    fireEvent(getByTestId("price-gradient-bar"), "layout", {
      nativeEvent: { layout: { width: 200 } }
    });

    expect(onPercentChanged).not.toHaveBeenCalled();

    fireEvent(getByTestId("price-gradient-bar"), "pressIn", {
      nativeEvent: { locationX: 100 }
    });

    expect(onPercentChanged).toHaveBeenCalledTimes(1);
    expect(onPercentChanged).toHaveBeenCalledWith(50);
  });
});
