import React from "react";
import { render } from "@testing-library/react-native";

import { FormFieldLabel } from "../../src/components/primitives/FormFieldLabel";
import { designTokens } from "../../src/theme/tokens";

function flattenStyles(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenStyles(entry));
  }

  return value === undefined ? [] : [value];
}

describe("FormFieldLabel", () => {
  it("renders labels with the shared form-field styling", () => {
    const { getByText } = render(<FormFieldLabel>Campaign</FormFieldLabel>);
    const label = getByText("Campaign");
    const resolvedStyles = flattenStyles(label.props.style);

    expect(resolvedStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: designTokens.colors.primary,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          fontSize: 12
        })
      ])
    );
  });
});
