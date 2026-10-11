import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntensityDisplay } from "../../src/components/IntensityPicker";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));
jest.mock("../../src/components/TokenAmount", () => ({
  TokenAmount: ({ amount }: { amount: number }) => createElement("span", { "data-testid": "token-amount" }, amount)
}));

describe("IntensityDisplay reference amount", () => {
  it.each([
    [1, 12.5], [99, 12.5], [100, 37.5], [999, 37.5],
    [1000, 62.5], [4999, 62.5], [5000, 87.5]
  ])("derives the intensity from %s tokens instead of the stored intensity", (tokenAmount, percent) => {
    const html = renderToStaticMarkup(createElement(IntensityDisplay, { intensity: "SHARING", tokenAmount }));
    expect(html).toContain(`left:${percent}%`);
    expect(html).toContain(`data-testid="token-amount">${tokenAmount}</span>`);
    expect(html).toContain("justify-content:center");
    expect(html.indexOf('data-testid="token-amount"')).toBeLessThan(html.indexOf("linear-gradient"));
    expect(html).not.toContain("intensity.suggestedAmount");
  });

  it.each([null, undefined])("retains the stored intensity without a reference amount (%s)", tokenAmount => {
    const html = renderToStaticMarkup(createElement(IntensityDisplay, { intensity: "COMMITMENT", tokenAmount }));
    expect(html).toContain("left:62.5%");
    expect(html).not.toContain('data-testid="token-amount"');
  });
});