/** @jest-environment jsdom */
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";

import VerifyEmailPage from "../../src/pages/verify-email";
import ConfirmEmailChangePage from "../../src/pages/confirm-email-change";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { apolloClient } from "../../src/services/graphql/client";

let mockToken: string;
let mockReady = true;
let mockLanguage = "en";
const mockTranslators: Record<string, (key: string) => string> = {
  en: key => `en:${key}`,
  fr: key => `fr:${key}`
};
jest.mock("next/router", () => ({ useRouter: () => ({ isReady: mockReady, query: { token: mockToken } }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: mockTranslators[mockLanguage] }) }));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: { language: "en" } }));
jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: { mutate: jest.fn(), query: jest.fn() },
  resetAccountGraphqlState: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../src/features/logging/operationalLogger", () => ({ logBackofficeError: jest.fn() }));

const client = apolloClient as unknown as { mutate: jest.Mock; query: jest.Mock };
const anonymous = { authenticated: false, account: null, role: "anonymous", expiresAt: null };
const authenticated = {
  authenticated: true,
  account: { id: "confirmed-account", displayName: "Test", externalSubject: "test@example.com", emailVerified: true },
  role: "identified_account",
  expiresAt: null
};

describe.each([
  ["verification", VerifyEmailPage, "Email verified."],
  ["email change", ConfirmEmailChangePage, "Email changed."]
] as const)("%s page", (flow, Page, success) => {
  let container: HTMLDivElement;
  let root: Root;
  let sequence = 0;
  const render = async () => {
    await act(async () => { root.render(<StrictMode><AuthProvider><Page /></AuthProvider></StrictMode>); });
  };

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.resetAllMocks();
    // resetAllMocks also resets the cache-reset mock's implementation.
    const { resetAccountGraphqlState } = jest.requireMock("../../src/services/graphql/client");
    resetAccountGraphqlState.mockResolvedValue(undefined);
    client.query.mockResolvedValue({ data: { authSession: anonymous } });
    mockToken = `${flow}-${++sequence}`;
    mockReady = true;
    mockLanguage = "en";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("confirms once under StrictMode, language changes and a real AuthProvider identity remount", async () => {
    let resolve!: (value: object) => void;
    client.mutate.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    await render();
    expect(client.mutate).toHaveBeenCalledTimes(1);

    mockLanguage = "fr";
    await render();
    expect(client.mutate).toHaveBeenCalledTimes(1);

    // Session restoration changes anonymous -> authenticated, which really
    // remounts the page through AuthProvider's keyed Fragment.
    client.query.mockResolvedValue({ data: { authSession: authenticated } });
    await act(async () => { resolve({ data: {} }); });
    expect(container.textContent).toContain(success);
    expect(client.mutate).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalled();
  });

  it("waits for the router and rejects a missing token without a mutation", async () => {
    mockReady = false;
    await render();
    expect(client.mutate).not.toHaveBeenCalled();
    mockReady = true;
    mockToken = "";
    await render();
    expect(container.textContent).toContain("tokenMissing");
    expect(client.mutate).not.toHaveBeenCalled();
  });

  it("keeps invalid-token errors and ignores an old response when the URL token changes", async () => {
    let resolve!: (value: object) => void;
    client.mutate.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    await render();
    mockToken += "-invalid";
    client.mutate.mockRejectedValueOnce(new Error("That verification link is invalid or expired"));
    await render();
    expect(container.textContent).toContain("That verification link is invalid or expired");
    await act(async () => { resolve({ data: {} }); });
    expect(container.textContent).not.toContain(success);
    expect(client.mutate).toHaveBeenCalledTimes(2);
  });
});