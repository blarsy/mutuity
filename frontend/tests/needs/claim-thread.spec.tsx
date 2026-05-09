import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ClaimConversationThreadView,
  canSendClaimMessages,
  parseImageMetadataInput,
  sortConversationMessages,
  type ClaimConversationViewMessage
} from "../../src/features/needs/ClaimConversationPanel";
import { NeedClaimStatusChip } from "../../src/features/needs/NeedClaimStatusChip";

describe("claim thread helpers", () => {
  it("allows settled conversations to continue while keeping declined claims closed", () => {
    expect(canSendClaimMessages("OPEN", true, false)).toBe(true);
    expect(canSendClaimMessages("SETTLED", true, false)).toBe(true);
    expect(canSendClaimMessages("SETTLED", false, true)).toBe(true);
    expect(canSendClaimMessages("DECLINED", true, true)).toBe(false);
    expect(canSendClaimMessages("EXPIRED", true, true)).toBe(false);
  });

  it("parses comma- and newline-separated image metadata into an ordered URL list", () => {
    expect(
      parseImageMetadataInput(` https://example.com/one.png\nhttps://example.com/two.png, https://example.com/three.png `)
    ).toEqual([
      "https://example.com/one.png",
      "https://example.com/two.png",
      "https://example.com/three.png"
    ]);
  });

  it("renders the message thread content in chronological order with attachment labels", () => {
    const messages: ClaimConversationViewMessage[] = sortConversationMessages([
      {
        id: "b",
        senderAccountId: "creator-1",
        body: "Second reply",
        createdAt: "2026-04-04T12:00:10.000Z",
        readAt: null,
        imageUrls: ["https://example.com/plan.png"]
      },
      {
        id: "a",
        senderAccountId: "claimer-1",
        body: "Initial claimer note",
        createdAt: "2026-04-04T12:00:00.000Z",
        readAt: "2026-04-04T12:01:00.000Z",
        imageUrls: []
      }
    ]);

    const markup = renderToStaticMarkup(
      createElement(ClaimConversationThreadView, {
        currentAccountId: "creator-1",
        messages
      })
    );

    expect(markup.indexOf("Initial claimer note")).toBeLessThan(markup.indexOf("Second reply"));
    expect(markup).toContain("Attachment 1");
    // "read" indicator renders as locale-dependent text ("read" EN / "lu" FR)
    expect(markup).toMatch(/read|lu/);
  });

  it("renders the settlement summary with the recorded Topes amount", () => {
    const markup = renderToStaticMarkup(
      createElement(NeedClaimStatusChip, {
        status: "SETTLED",
        settledAt: "2026-04-04T12:00:00.000Z",
        topesAmount: 180
      })
    );

    expect(markup).toContain("settled");
    expect(markup).toContain("180 Topes recorded");
  });
});
