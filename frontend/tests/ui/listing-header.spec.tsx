import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ListingHeader } from "../../src/features/ui/ListingHeader";

describe("ListingHeader", () => {
  it("renders creator and expiry info", () => {
    const html = renderToStaticMarkup(
      createElement(ListingHeader, {
        creatorName: "Alice",
        expiresAt: "2026-06-01T10:00:00.000Z",
        expiresLabel: "Expires",
        noDateLabel: "No expiry set",
      })
    );

    expect(html).toContain("Alice");
    expect(html).toContain("Expires:");
  });

  it("renders fallback labels when no image and no expiry", () => {
    const html = renderToStaticMarkup(
      createElement(ListingHeader, {
        creatorName: "Bob",
        expiresAt: null,
        expiresLabel: "Expires",
        noDateLabel: "No expiry set",
        noImageLabel: "No image"
      })
    );

    expect(html).toContain("No image");
    expect(html).toContain("No expiry set");
  });
});
