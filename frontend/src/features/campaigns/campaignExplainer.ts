export type CampaignExplainerSlide = {
  id: "purpose" | "rewards" | "governance" | "onboarding";
  title: string;
  body: string;
  details?: string[];
  ctas?: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
};

type BuildCampaignExplainerOptions = {
  isAuthenticated: boolean;
  isCampaignCreator: boolean;
  moderationStatus: string | null | undefined;
  loginHref: string;
  registerHref: string;
  androidUrl: string;
  iosUrl: string;
};

function moderationDetailKey(moderationStatus: string | null | undefined) {
  switch (moderationStatus) {
    case "APPROVED":
      return "public.explainer.slides.governance.status.approved";
    case "PENDING":
      return "public.explainer.slides.governance.status.pending";
    case "AWAITING_ADAPTATION":
      return "public.explainer.slides.governance.status.awaitingAdaptation";
    case "REJECTED":
      return "public.explainer.slides.governance.status.rejected";
    default:
      return "public.explainer.slides.governance.status.unknown";
  }
}

export function buildCampaignExplainerSlides(
  t: (key: string) => string,
  options: BuildCampaignExplainerOptions
): CampaignExplainerSlide[] {
  const baseSlides: CampaignExplainerSlide[] = [
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
      body: t("public.explainer.slides.governance.body"),
      details: [
        t(
          options.isCampaignCreator
            ? "public.explainer.slides.governance.triage.creator"
            : "public.explainer.slides.governance.triage.contributor"
        ),
        t(moderationDetailKey(options.moderationStatus))
      ]
    }
  ];
  return baseSlides;
}
