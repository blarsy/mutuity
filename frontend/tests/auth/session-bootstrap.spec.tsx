import {
  ANONYMOUS_SESSION,
  getAuthStatus,
  restoreSessionForBootstrap,
  type AuthStatus
} from "../../src/features/auth/AuthProvider";
import type { AuthSession } from "../../src/features/auth/types";

describe("auth session bootstrap", () => {
  it("restores authenticated session state when bootstrap succeeds", async () => {
    const restoredSession: AuthSession = {
      authenticated: true,
      account: {
        id: "acc-1",
        displayName: "Alice",
        externalSubject: "local:acc-1",
        emailVerified: true
      },
      role: "identified_account",
      expiresAt: "2026-04-18T10:00:00.000Z"
    };

    const nextSession = await restoreSessionForBootstrap(async () => restoredSession);

    expect(nextSession).toEqual(restoredSession);
    expect(getAuthStatus(nextSession)).toBe<AuthStatus>("authenticated");
  });

  it("falls back to anonymous session when bootstrap request fails", async () => {
    const nextSession = await restoreSessionForBootstrap(async () => {
      throw new Error("session lookup failed");
    });

    expect(nextSession).toEqual(ANONYMOUS_SESSION);
    expect(getAuthStatus(nextSession)).toBe<AuthStatus>("anonymous");
  });
});
