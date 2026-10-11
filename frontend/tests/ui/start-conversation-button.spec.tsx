import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StartConversationButton } from "../../src/features/chat/StartConversationDialog";

jest.mock("next/link", () => ({ __esModule: true, default: "a" }));

const props = {
  kind: "resource" as const,
  contextId: "resource-id",
  otherAccountId: "owner-id",
  title: "Resource",
  buttonLabel: "Contact creator"
};

describe("StartConversationButton", () => {
  it("renders the chat asset as an accessible, tooltip-labelled gift-style icon link", () => {
    const html = renderToStaticMarkup(createElement(StartConversationButton, props));
    expect(html).toContain("MuiIconButton-colorPrimary");
    expect(html).toContain('aria-label="Contact creator"');
    expect(html).toContain('href="/topela/CHAT.svg"');
    expect(html).toContain('flood-color="currentColor"');
    expect(html).toContain('in2="shape" operator="in"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('kind=resource&amp;draft=1&amp;contextId=resource-id');
    expect(html).not.toContain(">Contact creator<");
  });

  it("keeps an existing conversation accessible even when new conversations are disabled", () => {
    const html = renderToStaticMarkup(createElement(StartConversationButton, {
      ...props, existingConversationId: "thread-id", disabled: true, disabledReason: "Unavailable"
    }));
    expect(html).toContain('href="/chat?kind=resource&amp;id=thread-id"');
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).not.toContain("Unavailable");
  });

  it("preserves disabled explanations and lookup loading guards", () => {
    const disabledHtml = renderToStaticMarkup(createElement(StartConversationButton, {
      ...props, disabled: true, disabledReason: "Unavailable"
    }));
    expect(disabledHtml).toContain('aria-disabled="true"');
    expect(disabledHtml).toContain("Unavailable");
    const loadingHtml = renderToStaticMarkup(createElement(StartConversationButton, {
      ...props, lookupLoading: true, disabledReason: "Unavailable"
    }));
    expect(loadingHtml).toContain('aria-disabled="true"');
    expect(loadingHtml).not.toContain("Unavailable");
  });
});