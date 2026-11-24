/** @jest-environment jsdom */
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ChatPage from "../../src/pages/chat";
import { COUNT_CHAT_CONVERSATIONS_QUERY, LIST_CHAT_CONVERSATIONS_QUERY } from "../../src/features/chat/chat.queries";

const mockRouter = {
  query: {} as Record<string, string>,
  push: jest.fn(),
  replace: jest.fn()
};
const mockRefetch = jest.fn();
const mockConversations = [
  { conversationKind: "resource", conversationId: "first", contextId: "r1", contextTitle: "First", otherAccountId: "a1", otherAccountDisplayName: "Alex", lastMessagePreview: null, unreadCount: 0, lastActivityAt: null },
  { conversationKind: "need", conversationId: "second", contextId: "n1", contextTitle: "Second", otherAccountId: "a2", otherAccountDisplayName: "Blair", lastMessagePreview: null, unreadCount: 0, lastActivityAt: null }
];

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: React.forwardRef<HTMLAnchorElement, { href: string; children: ReactNode }>(function MockLink({ href, children, ...props }, ref) {
    return <a ref={ref} href={href} {...props} onClick={event => { event.preventDefault(); void mockRouter.push(href); }}>{children}</a>;
  })
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("../../src/components/PageContainer", () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { account: { id: "me" } } }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: () => undefined }));
jest.mock("@apollo/client/react", () => ({
  useQuery: (query: unknown) => ({
    data: query === LIST_CHAT_CONVERSATIONS_QUERY
      ? { listChatConversations: { nodes: mockConversations } }
      : query === COUNT_CHAT_CONVERSATIONS_QUERY ? { countChatConversations: 2 } : undefined,
    loading: false,
    refetch: mockRefetch
  }),
  useMutation: () => [jest.fn()]
}));

let container: HTMLDivElement;
let root: Root;

function renderQuery(query: Record<string, string>) {
  mockRouter.query = query;
  act(() => root.render(<ChatPage />));
}

function click(element: Element | null) {
  expect(element).not.toBeNull();
  act(() => element!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
}

describe("chat responsive navigation", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mockRouter.query = {};
    mockRouter.push.mockReset().mockResolvedValue(true);
    mockRouter.replace.mockReset().mockResolvedValue(true);
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn()
    }));
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("starts with the list, opens a conversation, returns to the list and opens another", () => {
    renderQuery({});
    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
    expect(mockRouter.replace).not.toHaveBeenCalled();

    click(container.querySelector('a[href="/chat?kind=resource&id=first"]'));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/chat?kind=resource&id=first");
    renderQuery({ kind: "resource", id: "first" });
    click(container.querySelector('button[aria-label="thread.back"]'));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/chat");
    renderQuery({});
    expect(mockRouter.replace).not.toHaveBeenCalled();

    click(container.querySelector('a[href="/chat?kind=need&id=second"]'));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/chat?kind=need&id=second");
    renderQuery({ kind: "need", id: "second" });
    expect(container.querySelector('button[aria-label="thread.back"]')).not.toBeNull();
  });

  it.each<Record<string, string>>([
    { kind: "need", id: "second" },
    { kind: "need", draft: "1", contextId: "n1", otherAccountId: "a2", title: "Draft" }
  ])("lets a directly opened thread or draft return to the list", query => {
    renderQuery(query);
    click(container.querySelector('button[aria-label="thread.back"]'));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/chat");
    renderQuery({});
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(container.textContent).toContain("First");
  });

  it("still auto-opens the first conversation on wider screens", () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn()
    }));
    renderQuery({});
    expect(mockRouter.replace).toHaveBeenCalledWith("/chat?kind=resource&id=first");
  });
});