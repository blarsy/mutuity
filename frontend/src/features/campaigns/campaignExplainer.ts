export type CampaignExplainerSlide = {
  id: "purpose" | "rewards" | "governance";
  title: string;
  body: string;
};

export function buildCampaignExplainerSlides(t: (key: string) => string): CampaignExplainerSlide[] {
  return [
    {
      id: "purpose",
      title: t("public.explainer.slides.purpose.title"),
      body: t("public.explainer.slides.purpose.body")
    },
    {
      id: "rewards",
      title: t("public.explainer.slides.rewards.title"),
      body: t("public.explainer.slides.rewards.body")
    },
    {
      id: "governance",
      title: t("public.explainer.slides.governance.title"),
      body: t("public.explainer.slides.governance.body")
    }
  ];
}
