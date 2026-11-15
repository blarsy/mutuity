import { renderToStaticMarkup } from "react-dom/server";
import { CampaignPicker } from "../../src/features/campaigns/CampaignPicker";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("campaign picker trigger", () => {
  const props = { label: "Campaign", options: [], selected: [], onChange: jest.fn() };

  it("renders a compact secondary button with the FactCheck end icon for editors", () => {
    const html = renderToStaticMarkup(<CampaignPicker {...props} compact />);
    expect(html).toContain("MuiButton-outlinedSecondary");
    expect(html).not.toContain("MuiButton-fullWidth");
    expect(html).toMatch(/MuiButton-endIcon[\s\S]*data-testid="FactCheckIcon"/);
  });

  it("preserves the full-width primary search filter trigger", () => {
    const html = renderToStaticMarkup(<CampaignPicker {...props} multiple />);
    expect(html).toContain("MuiButton-outlinedPrimary");
    expect(html).toContain("MuiButton-fullWidth");
    expect(html).not.toContain('data-testid="FactCheckIcon"');
  });
});