import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NeedCard } from "../../src/features/ui/NeedCard";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
// These tests cover content wiring, not sanitization; avoid jsdom's ESM-only dependency in node Jest.
jest.mock("isomorphic-dompurify", () => ({ __esModule: true, default: { sanitize: (html: string) => html } }));

describe("need card content", () => {
  it("renders plain mobile descriptions and omits inaccessible device images", () => {
    const html = renderToStaticMarkup(createElement(NeedCard, {
      title: "Need", creatorName: "Creator", description: "A plain mobile description",
      imageUrls: ["file:///simulator/cache/image.jpg", "content://picker/image"]
    }));
    expect(html).toContain("A plain mobile description");
    expect(html).not.toContain("No description yet.");
    expect(html).not.toContain("file://");
    expect(html).not.toContain("content://");
    expect(html).toContain("No image");
  });

  it("preserves public image URLs and rich descriptions", () => {
    const html = renderToStaticMarkup(createElement(NeedCard, {
      title: "Need", creatorName: "Creator", description: "<p>A rich <strong>description</strong></p>",
      imageUrls: ["file:///cache/image.jpg", "https://example.com/public.jpg"]
    }));
    expect(html).toContain("https://example.com/public.jpg");
    expect(html).not.toContain("file://");
    expect(html).toContain("<strong>description</strong>");
  });

  it("shows the header thumbnail and large gallery by default", () => {
    const html = renderToStaticMarkup(createElement(NeedCard, {
      title: "Need", creatorName: "Creator",
      imageUrls: ["https://example.com/public.jpg", "https://example.com/other.jpg"]
    }));
    expect((html.match(/<img /g) ?? []).length).toBe(2);
    expect(html).toContain("ArrowForwardIosIcon");
  });

  it("keeps only the header thumbnail when the gallery is hidden", () => {
    const html = renderToStaticMarkup(createElement(NeedCard, {
      title: "Need", creatorName: "Creator", showImageGallery: false,
      imageUrls: ["https://example.com/public.jpg", "https://example.com/other.jpg"]
    }));
    expect((html.match(/<img /g) ?? []).length).toBe(1);
    expect(html).toContain("https://example.com/public.jpg");
    expect(html).not.toContain("padding-top:100%");
    expect(html).not.toContain("ArrowForwardIosIcon");
    expect(html).not.toContain("ArrowBackIosNewIcon");
  });

  it("omits the large empty-image placeholder when the gallery is hidden", () => {
    const html = renderToStaticMarkup(createElement(NeedCard, {
      title: "Need", creatorName: "Creator", showImageGallery: false
    }));
    // The small header thumbnail retains its own empty-image label.
    expect((html.match(/>No image</g) ?? []).length).toBe(1);
    expect(html).not.toContain("padding-top:100%");
  });
});