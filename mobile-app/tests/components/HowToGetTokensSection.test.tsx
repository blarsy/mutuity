import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { HowToGetTokensSection } from "../../src/components/howToGetTokens/HowToGetTokensSection";
import { HOW_TO_GET_TOKENS_OPPORTUNITIES } from "../../src/features/howToGetTokens";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; defaultValue_plural?: string; count?: number }) => {
      if (options?.count === undefined) {
        return options?.defaultValue ?? key;
      }

      // Mimic i18next plural resolution: pick the plural variant when the
      // count is not exactly 1, then interpolate {{count}}.
      const raw = options.count === 1 ? options.defaultValue : options.defaultValue_plural;
      return (raw ?? options.defaultValue ?? key).replaceAll("{{count}}", String(options.count));
    }
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
    expect(screen.getAllByText("+ 10").length).toBeGreaterThan(0);
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

  it("renders collected one-time rewards as done without a go action", () => {
    const screen = renderWithPaper(
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={{ completed: ["profileAvatar", "profileBio"], remaining: {} }}
      />
    );

    // Collected rewards no longer expose a "Go" button and are replaced by a
    // done icon; every other opportunity still renders its Go button.
    const goButtons = screen.getAllByRole("button", { name: "Go" });
    const pendingOpportunityCount = HOW_TO_GET_TOKENS_OPPORTUNITIES.length - 2;
    expect(goButtons).toHaveLength(pendingOpportunityCount);

    const doneIcons = screen.getAllByTestId("how-to-get-tokens-done");
    expect(doneIcons).toHaveLength(2);
  });

  it("advertises the number of rewards left to reap", () => {
    const screen = renderWithPaper(
      <HowToGetTokensSection
        onGoToOpportunity={() => undefined}
        progress={{
          completed: [],
          remaining: { resourceFirstImage: 3, needDefaultTokenAmount: 1 }
        }}
      />
    );

    expect(screen.getByText("3 rewards to reap")).toBeTruthy();
    expect(screen.getByText("1 reward to reap")).toBeTruthy();
  });
});
