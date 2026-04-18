import {
  ANONYMOUS_SESSION,
  getAuthStatus,
  resolveSessionAfterSignOut,
  type AuthStatus
} from "../../src/features/auth/AuthProvider";
import type { AuthSession } from "../../src/features/auth/types";

describe("logout state reset", () => {
  it("applies returned anonymous session after successful logout", async () => {
    const loggedOutSession: AuthSession = {
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    };

    const nextSession = await resolveSessionAfterSignOut(async () => loggedOutSession);

    expect(nextSession).toEqual(ANONYMOUS_SESSION);
    expect(getAuthStatus(nextSession)).toBe<AuthStatus>("anonymous");
  });

  it("falls back to anonymous session if logout request fails", async () => {
    const nextSession = await resolveSessionAfterSignOut(async () => {
      throw new Error("logout failed");
    });

    expect(nextSession).toEqual(ANONYMOUS_SESSION);
    expect(getAuthStatus(nextSession)).toBe<AuthStatus>("anonymous");
  });
});
