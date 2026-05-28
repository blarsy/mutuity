import { buildCampaignExplainerSlides } from "../../src/features/campaigns/campaignExplainer";

describe("campaign explainer slide model", () => {
  const labels: Record<string, string> = {
    "public.explainer.slides.purpose.title": "Purpose",
    "public.explainer.slides.purpose.body": "Purpose body",
    "public.explainer.slides.rewards.title": "Rewards",
    "public.explainer.slides.rewards.body": "Rewards body",
    "public.explainer.slides.governance.title": "Governance",
    "public.explainer.slides.governance.body": "Governance body"
  };

  const t = (key: string) => labels[key] ?? key;

  it("returns exactly the 3 base slides in expected order", () => {
    const slides = buildCampaignExplainerSlides(t);

    expect(slides.map(slide => slide.id)).toEqual(["purpose", "rewards", "governance"]);
  });

  it("maps translated title/body keys for each base slide", () => {
    const slides = buildCampaignExplainerSlides(t);

    expect(slides[0]).toEqual({ id: "purpose", title: "Purpose", body: "Purpose body" });
    expect(slides[1]).toEqual({ id: "rewards", title: "Rewards", body: "Rewards body" });
    expect(slides[2]).toEqual({ id: "governance", title: "Governance", body: "Governance body" });
  });
});
