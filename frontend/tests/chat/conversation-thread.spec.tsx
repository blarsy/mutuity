import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConversationHeader } from "../../src/features/chat/ConversationHeader";
import {
  isComposerBodyReady,
  parseImageUrls,
  MAX_IMAGE_ATTACHMENTS
} from "../../src/features/chat/ConversationThread";
import { conversationParticipantUrl } from "../../src/features/chat/chatRouting";

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

  it("renders the participant display name as a link to their account page", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "resource",
        contextId: "res-001",
        contextTitle: "3D printer",
        otherAccountId: "account-xyz",
        otherAccountDisplayName: "Alice",
        t
      })
    );

    expect(markup).toContain("/accounts/account-xyz");
    expect(markup).toContain("Alice");
  });

  it("omits participant link when otherAccountId is not provided", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationHeader, {
        kind: "need",
        contextId: "need-001",
        contextTitle: "Tool sharing",
        t
      })
    );

    expect(markup).not.toContain("/accounts/");
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

describe("parseImageUrls", () => {
  it("parses newline-separated URLs", () => {
    expect(parseImageUrls("https://a.com/1.png\nhttps://b.com/2.png")).toEqual([
      "https://a.com/1.png",
      "https://b.com/2.png"
    ]);
  });

  it("parses comma-separated URLs", () => {
    expect(parseImageUrls("https://a.com/1.png, https://b.com/2.png")).toEqual([
      "https://a.com/1.png",
      "https://b.com/2.png"
    ]);
  });

  it("strips blank entries", () => {
    expect(parseImageUrls("https://a.com/1.png\n\nhttps://b.com/2.png")).toEqual([
      "https://a.com/1.png",
      "https://b.com/2.png"
    ]);
  });

  it(`caps output at ${MAX_IMAGE_ATTACHMENTS} entries`, () => {
    const input = Array.from({ length: MAX_IMAGE_ATTACHMENTS + 3 }, (_, i) => `https://a.com/${i}.png`).join("\n");
    const result = parseImageUrls(input);
    expect(result).toHaveLength(MAX_IMAGE_ATTACHMENTS);
  });

  it("returns an empty array for blank input", () => {
    expect(parseImageUrls("")).toEqual([]);
    expect(parseImageUrls("   \n   ")).toEqual([]);
  });
});

describe("conversationParticipantUrl", () => {
  it("builds the account page URL for a participant", () => {
    expect(conversationParticipantUrl("account-abc")).toBe("/accounts/account-abc");
  });
});
