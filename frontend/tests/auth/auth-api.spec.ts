import {
  changePassword,
  confirmEmailVerification,
  confirmPasswordReset,
  getCurrentSession,
  login,
  registerLocalAccount,
  requestEmailVerification,
  requestPasswordReset
} from "../../src/features/auth/auth.api";
import { apolloClient } from "../../src/services/graphql/client";

jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn(),
    mutate: jest.fn()
  }
}));

type ApolloLike = {
  query: jest.Mock;
  mutate: jest.Mock;
};

function mockedApollo() {
  return apolloClient as unknown as ApolloLike;
}

describe("auth api local flow coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS;
    delete process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_RESEND_THROTTLE_MS;
    delete process.env.NEXT_PUBLIC_PASSWORD_RESET_TOKEN_TTL_MS;
    delete process.env.NEXT_PUBLIC_PASSWORD_RESET_REQUEST_THROTTLE_MS;
  });

  it("normalizes missing authSession payload to anonymous in getCurrentSession", async () => {
    mockedApollo().query.mockResolvedValueOnce({
      data: {
        authSession: null
      }
    });

    await expect(getCurrentSession()).resolves.toEqual({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });
  });

  it("registerLocalAccount sends local registration variables and returns fixed safe message", async () => {
    process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS = "98765";

    mockedApollo().mutate.mockResolvedValueOnce({
      data: {
        registerLocalAccountWithPassword: {
          boolean: true
        }
      }
    });

    await expect(
      registerLocalAccount({
        identifier: "new@example.com",
        displayName: "New User",
        password: "password123"
      })
    ).resolves.toEqual({
      message: "Account created. Please verify your email."
    });

    expect(mockedApollo().mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          identifier: "new@example.com",
          displayName: "New User",
          password: "password123",
          verificationTtlMs: 98765
        }
      })
    );
  });

  it("requestEmailVerification applies ttl/throttle env values and keeps response generic", async () => {
    process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS = "120000";
    process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_RESEND_THROTTLE_MS = "45000";

    mockedApollo().mutate.mockResolvedValueOnce({
      data: {
        requestEmailVerification: {
          boolean: true
        }
      }
    });

    await expect(
      requestEmailVerification({
        identifier: "verify@example.com"
      })
    ).resolves.toEqual({
      message: "If an account exists for that email, verification instructions have been sent."
    });

    expect(mockedApollo().mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          identifier: "verify@example.com",
          verificationTtlMs: 120000,
          throttleMs: 45000
        }
      })
    );
  });

  it("requestPasswordReset applies ttl/throttle env values and keeps response generic", async () => {
    process.env.NEXT_PUBLIC_PASSWORD_RESET_TOKEN_TTL_MS = "1800000";
    process.env.NEXT_PUBLIC_PASSWORD_RESET_REQUEST_THROTTLE_MS = "90000";

    mockedApollo().mutate.mockResolvedValueOnce({
      data: {
        requestPasswordReset: {
          boolean: true
        }
      }
    });

    await expect(
      requestPasswordReset({
        identifier: "recover@example.com"
      })
    ).resolves.toEqual({
      message: "If an account exists for that email, password reset instructions have been sent."
    });

    expect(mockedApollo().mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          identifier: "recover@example.com",
          resetTtlMs: 1800000,
          throttleMs: 90000
        }
      })
    );
  });

  it("maps verification and reset confirmation payloads to success messages", async () => {
    mockedApollo().mutate
      .mockResolvedValueOnce({
        data: {
          confirmEmailVerification: {
            boolean: true
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          confirmPasswordResetWithPassword: {
            boolean: true
          }
        }
      });

    await expect(confirmEmailVerification({ token: "verification-token" })).resolves.toEqual({
      message: "Email verified."
    });

    expect(mockedApollo().mutate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        variables: {
          token: "verification-token"
        }
      })
    );

    await expect(
      confirmPasswordReset({
        token: "reset-token",
        password: "next-password123"
      })
    ).resolves.toEqual({
      message: "Password updated. You can now sign in."
    });

    expect(mockedApollo().mutate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        variables: {
          token: "reset-token",
          nextPassword: "next-password123"
        }
      })
    );
  });

  it("returns normalized sessions for login and changePassword", async () => {
    mockedApollo().mutate
      .mockResolvedValueOnce({
        data: {
          authLogin: {
            authSession: {
              authenticated: true,
              role: "identified_account",
              expiresAt: "2026-04-20T10:00:00.000Z",
              account: {
                id: "acc-1",
                displayName: "Alice",
                externalSubject: "alice@example.com",
                emailVerified: false
              }
            }
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          authChangePassword: {
            authSession: {
              authenticated: true,
              role: "identified_account",
              expiresAt: "2026-04-20T11:00:00.000Z",
              account: {
                id: "acc-1",
                displayName: "Alice",
                externalSubject: "alice@example.com",
                emailVerified: true
              }
            }
          }
        }
      });

    await expect(
      login({
        identifier: "alice@example.com",
        password: "password123"
      })
    ).resolves.toMatchObject({
      authenticated: true,
      account: {
        externalSubject: "alice@example.com",
        emailVerified: false
      }
    });

    await expect(
      changePassword({
        currentPassword: "password123",
        newPassword: "next-password123"
      })
    ).resolves.toMatchObject({
      authenticated: true,
      account: {
        externalSubject: "alice@example.com",
        emailVerified: true
      }
    });
  });

  it("propagates explicit error messages and falls back to safe generic copy", async () => {
    mockedApollo().mutate
      .mockRejectedValueOnce(new Error("Token expired"))
      .mockRejectedValueOnce({});

    await expect(confirmEmailVerification({ token: "expired-token" })).rejects.toThrow("Token expired");

    await expect(
      confirmPasswordReset({
        token: "bad-token",
        password: "next-password123"
      })
    ).rejects.toThrow("Something went wrong. Please try again.");
  });
});
