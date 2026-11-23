import { renderToStaticMarkup } from "react-dom/server";
import { CampaignPicker } from "../../src/features/campaigns/CampaignPicker";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("campaign picker trigger", () => {
  const props = { label: "Campaign", options: [], selected: [], onChange: jest.fn() };

  it("renders a compact primary button with the FactCheck end icon for editors", () => {
    const html = renderToStaticMarkup(<CampaignPicker {...props} compact />);
    expect(html).toContain("MuiButton-outlinedPrimary");
    expect(html).not.toContain("MuiButton-fullWidth");
    expect(html).toMatch(/MuiButton-endIcon[\s\S]*data-testid="FactCheckIcon"/);
  });

  it("preserves the full-width primary search filter trigger", () => {
    const html = renderToStaticMarkup(<CampaignPicker {...props} multiple />);
    expect(html).toContain("MuiButton-outlinedPrimary");
    expect(html).toContain("MuiButton-fullWidth");
    expect(html).not.toContain('data-testid="FactCheckIcon"');
  });

  it("orders selected campaign titles by start date ascending", () => {
    const html = renderToStaticMarkup(
      <CampaignPicker
        {...props}
        options={[
          { id: "later", title: "Later", startAt: "2026-06-01T00:00:00Z" },
          { id: "earlier", title: "Earlier", startAt: "2026-01-01T00:00:00Z" }
        ]}
        selected={["later", "earlier"]}
      />
    );

    expect(html.indexOf("Earlier, Later")).toBeGreaterThan(-1);
  });
});