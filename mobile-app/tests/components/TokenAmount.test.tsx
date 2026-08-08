import React from "react";
import { render } from "@testing-library/react-native";
import { TokenAmount } from "../../src/components/TokenAmount";

describe("TokenAmount", () => {
  it("renders the token symbol icon", () => {
    const { getByTestId } = render(<TokenAmount amount={42} />);

    expect(getByTestId("token-amount-icon")).toBeTruthy();
  });
});
