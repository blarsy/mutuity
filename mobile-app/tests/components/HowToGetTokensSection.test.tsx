import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { HowToGetTokensSection } from "../../src/components/howToGetTokens/HowToGetTokensSection";
import { HOW_TO_GET_TOKENS_OPPORTUNITIES } from "../../src/features/howToGetTokens";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key
  })
}));

describe("HowToGetTokensSection", () => {
  const renderWithPaper = (ui: React.ReactElement) => render(<PaperProvider>{ui}</PaperProvider>);

  it("renders every earning opportunity", () => {
    const screen = renderWithPaper(
      <HowToGetTokensSection onGoToOpportunity={() => undefined} testID="how-to-get-tokens-section" />
    );

    expect(screen.getByTestId("how-to-get-tokens-section")).toBeTruthy();

    for (const opportunity of HOW_TO_GET_TOKENS_OPPORTUNITIES) {
      expect(screen.getByText(opportunity.id)).toBeTruthy();
    }
  });

  it("shows a fixed reward amount for fixed opportunities", () => {
    const screen = renderWithPaper(
      <HowToGetTokensSection onGoToOpportunity={() => undefined} />
    );

    expect(screen.getAllByText("+ 20").length).toBeGreaterThan(0);
    expect(screen.getByText("+ 10")).toBeTruthy();
  });

  it("shows a variable label for the campaign airdrop", () => {
    const screen = renderWithPaper(
      <HowToGetTokensSection onGoToOpportunity={() => undefined} />
    );

    expect(screen.getByText("Variable")).toBeTruthy();
  });

  it("invokes onGoToOpportunity with the tapped opportunity id", () => {
    const onGoToOpportunity = jest.fn();
    const screen = renderWithPaper(
      <HowToGetTokensSection onGoToOpportunity={onGoToOpportunity} />
    );

    const goButtons = screen.getAllByRole("button", { name: "Go" });
    fireEvent.press(goButtons[0]);

    expect(onGoToOpportunity).toHaveBeenCalledWith("profileAvatar");
  });
});
