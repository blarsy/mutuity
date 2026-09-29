export type CampaignExplainerSlideId = "what" | "create" | "join" | "contribute" | "settle";

export type CampaignExplainerSlide = {
  id: CampaignExplainerSlideId;
  title: string;
  body: string;
};

const CAMPAIGN_EXPLAINER_SLIDE_IDS: CampaignExplainerSlideId[] = [
  "what",
  "create",
  "join",
  "contribute",
  "settle"
];

export function buildCampaignExplainerSlides(t: (key: string) => string): CampaignExplainerSlide[] {
  return CAMPAIGN_EXPLAINER_SLIDE_IDS.map((id) => ({
    id,
    title: t(`campaignsGuide.slides.${id}.title`),
    body: t(`campaignsGuide.slides.${id}.body`)
  }));
}