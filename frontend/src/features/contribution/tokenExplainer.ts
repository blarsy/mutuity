export type TokenExplainerSlideId = "what" | "earn" | "spend";

export type TokenExplainerSlide = {
  id: TokenExplainerSlideId;
  title: string;
  body: string;
};

export type TokenExplainerDialogLayout = {
  fullScreen: boolean;
  maxWidth: "sm" | "md";
};

const TOKEN_EXPLAINER_SLIDE_IDS: TokenExplainerSlideId[] = ["what", "earn", "spend"];

export function buildTokenExplainerSlides(t: (key: string) => string): TokenExplainerSlide[] {
  return TOKEN_EXPLAINER_SLIDE_IDS.map(id => ({
    id,
    title: t(`topesGuide.slides.${id}.title`),
    body: t(`topesGuide.slides.${id}.body`)
  }));
}

export function resolveTokenExplainerDialogLayout(isMobile: boolean): TokenExplainerDialogLayout {
  return {
    fullScreen: isMobile,
    maxWidth: isMobile ? "md" : "sm"
  };
}
