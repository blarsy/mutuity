/** @jest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LoginForm } from "../../src/features/auth/LoginForm";

const mockSignIn = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ signIn: mockSignIn, status: "ready" })
}));
jest.mock("../../src/features/auth/socialAuth", () => ({
  SOCIAL_AUTH_PROVIDERS: ["google", "apple"],
  getSocialAuthStartUrl: (provider: string, next: string) =>
    `https://auth.example.test/${provider}?next=${encodeURIComponent(next)}`
}));

let container: HTMLDivElement;
let root: Root;
beforeAll(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); });
beforeEach(async () => {
  mockSignIn.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<LoginForm nextDestination="/campaigns" />); });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it.each(["google", "apple"])("starts %s independently of empty credential fields", async provider => {
  const link = container.querySelector<HTMLAnchorElement>(`a[href*="/${provider}?"]`)!;
  expect(link).not.toBeNull();
  expect(link.closest("form")).toBeNull();
  expect(link.getAttribute("type")).toBe("button");
  expect(link.href).toContain("next=%2Fcampaigns");
  const submit = jest.fn();
  container.querySelector("form")!.addEventListener("submit", submit);
  // Prevent jsdom navigation only; the real browser follows the OAuth link.
  link.addEventListener("click", event => event.preventDefault());
  expect(document.activeElement).toBe(container.querySelector('[name="identifier"]'));
  // Browser clicks move focus before activation; click() alone misses Formik's
  // blur handler on the initially auto-focused email field.
  await act(async () => { link.focus(); });
  expect(container.querySelector('[name="identifier"]')?.getAttribute("aria-invalid")).toBe("false");
  await act(async () => { link.click(); });
  expect(submit).not.toHaveBeenCalled();
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(container.querySelector('[name="identifier"]')?.getAttribute("aria-invalid")).toBe("false");
});

it("still validates an empty password form on credential submission", async () => {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(container.querySelector('[name="identifier"]')?.getAttribute("aria-invalid")).toBe("true");
  expect(container.querySelector('[name="password"]')?.getAttribute("aria-invalid")).toBe("true");
});