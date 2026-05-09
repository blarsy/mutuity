import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConversationHeader } from "../../src/features/chat/ConversationHeader";
import { isComposerBodyReady } from "../../src/features/chat/ConversationThread";

// Minimal translation stub that echoes back the key.
const t = (key: string) => key;

describe("ConversationHeader", () => {
  it("renders the context title as a navigation link when contextId and contextTitle are provided", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "need",
        contextId: "need-abc",
        contextTitle: "Community garden cleanup",
        t
      })
    );

    // Should contain a link pointing to the need context URL
    expect(markup).toContain("/needs/need-abc");
    expect(markup).toContain("Community garden cleanup");
    // Kind label should also appear
    expect(markup).toContain("kind.need");
  });

  it("renders the context title as plain text (no link) when contextId is null", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "resource",
        contextId: null,
        contextTitle: "Vintage bicycle",
        t
      })
    );

    expect(markup).toContain("Vintage bicycle");
    expect(markup).not.toContain("/resources/");
    expect(markup).toContain("kind.resource");
  });

  it("renders the loading placeholder when both contextId and contextTitle are null", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "resource",
        contextId: null,
        contextTitle: null,
        t
      })
    );

    // Should render the translation key for the loading state
    expect(markup).toContain("thread.loadingHeader");
  });

  it("renders the back button area when onBack handler is provided", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "need",
        contextId: "need-xyz",
        contextTitle: "Tool sharing",
        onBack: () => undefined,
        t
      })
    );

    // ArrowBackIcon renders an SVG; the Tooltip title lands in the translation key
    expect(markup).toContain("thread.back");
  });

  it("does not include back button markup when onBack is omitted", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "need",
        contextId: "need-xyz",
        contextTitle: "Tool sharing",
        t
      })
    );

    expect(markup).not.toContain("thread.back");
  });

  it("builds the resource context link correctly", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "resource",
        contextId: "res-999",
        contextTitle: "3D printer",
        t
      })
    );

    expect(markup).toContain("/resources/res-999");
    expect(markup).toContain("3D printer");
  });
});

describe("isComposerBodyReady", () => {
  it("returns false for an empty string", () => {
    expect(isComposerBodyReady("")).toBe(false);
  });

  it("returns false for whitespace-only input", () => {
    expect(isComposerBodyReady("   ")).toBe(false);
    expect(isComposerBodyReady("\t\n")).toBe(false);
  });

  it("returns true for any non-blank text", () => {
    expect(isComposerBodyReady("Hello")).toBe(true);
    expect(isComposerBodyReady("  Hi  ")).toBe(true);
  });
});
