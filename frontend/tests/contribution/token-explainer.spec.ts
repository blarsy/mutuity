import { buildTokenExplainerSlides, resolveTokenExplainerDialogLayout } from "../../src/features/contribution/tokenExplainer";

describe("token explainer model", () => {
  const labels: Record<string, string> = {
    "topesGuide.slides.what.title": "What",
    "topesGuide.slides.what.body": "What body",
    "topesGuide.slides.earn.title": "Earn",
    "topesGuide.slides.earn.body": "Earn body",
    "topesGuide.slides.spend.title": "Spend",
    "topesGuide.slides.spend.body": "Spend body"
  };

  const t = (key: string) => labels[key] ?? key;

  it("returns exactly the 3 legacy token explainer slides", () => {
    const slides = buildTokenExplainerSlides(t);

    expect(slides).toEqual([
      { id: "what", title: "What", body: "What body" },
      { id: "earn", title: "Earn", body: "Earn body" },
      { id: "spend", title: "Spend", body: "Spend body" }
    ]);
  });

  it("resolves responsive dialog layout for mobile and desktop", () => {
    expect(resolveTokenExplainerDialogLayout(true)).toEqual({
      fullScreen: true,
      maxWidth: "md"
    });

    expect(resolveTokenExplainerDialogLayout(false)).toEqual({
      fullScreen: false,
      maxWidth: "sm"
    });
  });
});
