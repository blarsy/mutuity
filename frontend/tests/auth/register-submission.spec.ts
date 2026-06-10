import type { ReactNode } from "react";

import { submitRegistration } from "../../src/features/auth/registerSubmission";

describe("submitRegistration", () => {
  it("uses social registration when provider and subject are present", async () => {
    const registerLocal = jest.fn().mockResolvedValue({ message: "local" });
    const registerSocial = jest.fn().mockResolvedValue({ message: "social" });

    await submitRegistration({
      displayName: "  Jane Doe  ",
      identifier: "  Jane@Example.COM ",
      password: "password-123",
      preferredLanguage: "en",
      provider: "google",
      providerSubject: "  google-sub-123  ",
      registerLocal,
      registerSocial
    });

    expect(registerLocal).not.toHaveBeenCalled();
    expect(registerSocial).toHaveBeenCalledTimes(1);
    expect(registerSocial).toHaveBeenCalledWith({
      identifier: "jane@example.com",
      displayName: "Jane Doe",
      password: "password-123",
      provider: "google",
      providerSubject: "google-sub-123",
      providerEmail: "jane@example.com",
      providerEmailVerified: true,
      preferredLanguage: "en"
    });
  });

  it("uses local registration when provider subject is missing", async () => {
    const registerLocal = jest.fn().mockResolvedValue({ message: "local" });
    const registerSocial = jest.fn().mockResolvedValue({ message: "social" });

    await submitRegistration({
      displayName: "  John Doe  ",
      identifier: "  John@Example.COM ",
      password: "password-123",
      preferredLanguage: "fr",
      provider: "google",
      providerSubject: "   ",
      registerLocal,
      registerSocial
    });

    expect(registerSocial).not.toHaveBeenCalled();
    expect(registerLocal).toHaveBeenCalledTimes(1);
    expect(registerLocal).toHaveBeenCalledWith({
      displayName: "John Doe",
      identifier: "john@example.com",
      password: "password-123",
      preferredLanguage: "fr"
    });
  });
});

describe("RegisterPage social provider branch", () => {
  it("calls social registration mutation with normalized variables when provider query is present", async () => {
    let submitOnClick: (() => Promise<void>) | undefined;

    const registerLocalAccountMock = jest.fn().mockResolvedValue({ message: "local" });
    const registerSocialAccountMock = jest.fn().mockResolvedValue({ message: "social" });
    const signInMock = jest.fn().mockResolvedValue(undefined);
    const replaceMock = jest.fn().mockResolvedValue(true);

    await jest.isolateModulesAsync(async () => {
      jest.doMock("@mui/material", () => {
        const { createElement } = jest.requireActual("react") as typeof import("react");

        return {
          Alert: ({ children }: { children: ReactNode }) => createElement("div", null, children),
          Box: ({ children }: { children: ReactNode }) => createElement("div", null, children),
          Button: ({ children, onClick, variant }: { children: ReactNode; onClick?: () => Promise<void>; variant?: string }) => {
            if (variant === "contained") {
              submitOnClick = onClick;
            }
            return createElement("button", { type: "button" }, children);
          },
          Container: ({ children }: { children: ReactNode }) => createElement("div", null, children),
          Stack: ({ children }: { children: ReactNode }) => createElement("div", null, children),
          TextField: () => null,
          Typography: ({ children }: { children: ReactNode }) => createElement("div", null, children)
        };
      });

      jest.doMock("next/link", () => ({
        __esModule: true,
        default: ({ children }: { children: ReactNode }) => children
      }));

      jest.doMock("next/router", () => ({
        useRouter: () => ({
          query: {
            provider: "google",
            providerSubject: " google-sub-123 "
          },
          replace: replaceMock
        })
      }));

      jest.doMock("react-i18next", () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          i18n: { language: "en-US" }
        })
      }));

      jest.doMock("../../src/features/auth/auth.api", () => ({
        registerLocalAccount: registerLocalAccountMock,
        registerLocalAccountWithSocialIdentity: registerSocialAccountMock
      }));

      jest.doMock("../../src/features/auth/AuthProvider", () => ({
        useAuth: () => ({ signIn: signInMock })
      }));

      jest.doMock("../../src/features/auth/SocialAuthButtons", () => ({
        SocialAuthButtons: () => null
      }));

      const react = require("react") as typeof import("react");
      const useStateSpy = jest.spyOn(react, "useState");

      useStateSpy
        .mockImplementationOnce(() => [" Jane Doe ", jest.fn()] as never)
        .mockImplementationOnce(() => [" Jane@Example.COM ", jest.fn()] as never)
        .mockImplementationOnce(() => ["password-123", jest.fn()] as never)
        .mockImplementationOnce(() => [false, jest.fn()] as never)
        .mockImplementationOnce(() => [null, jest.fn()] as never)
        .mockImplementationOnce(() => [null, jest.fn()] as never);

      const { renderToStaticMarkup } = require("react-dom/server") as typeof import("react-dom/server");
      const { default: RegisterPage } = require("../../src/pages/register") as {
        default: () => JSX.Element;
      };

      renderToStaticMarkup(react.createElement(RegisterPage));

      expect(typeof submitOnClick).toBe("function");
      await submitOnClick?.();

      expect(registerLocalAccountMock).not.toHaveBeenCalled();
      expect(registerSocialAccountMock).toHaveBeenCalledTimes(1);
      expect(registerSocialAccountMock).toHaveBeenCalledWith({
        identifier: "jane@example.com",
        displayName: "Jane Doe",
        password: "password-123",
        provider: "google",
        providerSubject: "google-sub-123",
        providerEmail: "jane@example.com",
        providerEmailVerified: true,
        preferredLanguage: "en"
      });

      expect(signInMock).toHaveBeenCalledWith({
        identifier: "jane@example.com",
        password: "password-123"
      });
      expect(replaceMock).toHaveBeenCalledWith("/");

      useStateSpy.mockRestore();
    });
  });
});
