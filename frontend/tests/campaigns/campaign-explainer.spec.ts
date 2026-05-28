import { buildCampaignExplainerSlides } from "../../src/features/campaigns/campaignExplainer";

describe("campaign explainer slide model", () => {
  const labels: Record<string, string> = {
    "public.explainer.slides.purpose.title": "Purpose",
    "public.explainer.slides.purpose.body": "Purpose body",
    "public.explainer.slides.rewards.title": "Rewards",
    "public.explainer.slides.rewards.body": "Rewards body",
    "public.explainer.slides.governance.title": "Governance",
    "public.explainer.slides.governance.body": "Governance body",
    "public.explainer.slides.onboarding.title": "Onboarding",
    "public.explainer.slides.onboarding.body": "Onboarding body",
    "public.explainer.slides.onboarding.login": "Sign in",
    "public.explainer.slides.onboarding.register": "Create account",
    "public.explainer.slides.onboarding.android": "Android app",
    "public.explainer.slides.onboarding.ios": "iOS app"
  };

  const t = (key: string) => labels[key] ?? key;

  const authenticatedOptions = {
    isAuthenticated: true,
    loginHref: "/login?next=%2Fcampaigns%2Fabc",
    registerHref: "/register?next=%2Fcampaigns%2Fabc",
    androidUrl: "https://play.google.com/store/apps/details?id=com.topela",
    iosUrl: "https://apps.apple.com/be/app/tope-la/id6470202780"
  };

  const anonymousOptions = {
    ...authenticatedOptions,
    isAuthenticated: false
  };

  it("returns exactly the 3 base slides in expected order", () => {
    const slides = buildCampaignExplainerSlides(t, authenticatedOptions);

    expect(slides.map(slide => slide.id)).toEqual(["purpose", "rewards", "governance"]);
  });

  it("maps translated title/body keys for each base slide", () => {
    const slides = buildCampaignExplainerSlides(t, authenticatedOptions);

    expect(slides[0]).toEqual({ id: "purpose", title: "Purpose", body: "Purpose body" });
    expect(slides[1]).toEqual({ id: "rewards", title: "Rewards", body: "Rewards body" });
    expect(slides[2]).toEqual({ id: "governance", title: "Governance", body: "Governance body" });
  });

  it("adds onboarding slide only for unauthenticated users", () => {
    const authSlides = buildCampaignExplainerSlides(t, authenticatedOptions);
    const unauthSlides = buildCampaignExplainerSlides(t, anonymousOptions);

    expect(authSlides.map(slide => slide.id)).toEqual(["purpose", "rewards", "governance"]);
    expect(unauthSlides.map(slide => slide.id)).toEqual(["purpose", "rewards", "governance", "onboarding"]);
  });

  it("wires onboarding CTA links for login/register and app stores", () => {
    const slides = buildCampaignExplainerSlides(t, anonymousOptions);
    const onboardingSlide = slides[slides.length - 1];

    expect(onboardingSlide.id).toBe("onboarding");
    expect(onboardingSlide.ctas).toEqual([
      { label: "Sign in", href: anonymousOptions.loginHref },
      { label: "Create account", href: anonymousOptions.registerHref },
      { label: "Android app", href: anonymousOptions.androidUrl, external: true },
      { label: "iOS app", href: anonymousOptions.iosUrl, external: true }
    ]);
  });
});
