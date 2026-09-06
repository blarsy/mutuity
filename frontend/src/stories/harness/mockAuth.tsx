import type { ReactNode } from "react";

import { ANONYMOUS_SESSION, AuthContext, type AuthStatus } from "../../features/auth/AuthProvider";
import type { AuthSession } from "../../features/auth/types";

export type MockAuthParameters = {
  session?: AuthSession;
  status?: AuthStatus;
};

export const MOCK_ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";

export const AUTHENTICATED_SESSION: AuthSession = {
  authenticated: true,
  account: {
    id: MOCK_ACCOUNT_ID,
    displayName: "Camille Dupont",
    externalSubject: "camille@example.org",
    avatarUrl: null,
    emailVerified: true,
    preferredLanguage: "fr"
  },
  role: "identified_account",
  expiresAt: "2099-01-01T00:00:00.000Z"
};

export const ADMIN_SESSION: AuthSession = {
  ...AUTHENTICATED_SESSION,
  account: {
    ...AUTHENTICATED_SESSION.account!,
    displayName: "Admin Mutuity",
    externalSubject: "admin@example.org"
  },
  role: "admin"
};

export const UNVERIFIED_SESSION: AuthSession = {
  ...AUTHENTICATED_SESSION,
  account: { ...AUTHENTICATED_SESSION.account!, emailVerified: false }
};

export { ANONYMOUS_SESSION };

/** Replaces AuthProvider so stories never hit the real session endpoint. */
export function MockAuthProvider({
  children,
  parameters
}: {
  children: ReactNode;
  parameters?: MockAuthParameters;
}) {
  const session = parameters?.session ?? ANONYMOUS_SESSION;
  const status = parameters?.status ?? (session.authenticated ? "authenticated" : "anonymous");

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        refreshSession: async () => undefined,
        signIn: async () => session,
        signOut: async () => undefined
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
