import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { getCurrentSession, login as loginRequest, logout as logoutRequest } from "./auth.api";
import { AUTH_REQUIRED_EVENT } from "./events";
import type { AuthSession, LoginInput } from "./types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  session: AuthSession;
  status: AuthStatus;
  refreshSession: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};

export const ANONYMOUS_SESSION: AuthSession = {
  authenticated: false,
  account: null,
  role: "anonymous",
  expiresAt: null
};

export function getAuthStatus(nextSession: AuthSession): AuthStatus {
  return nextSession.authenticated ? "authenticated" : "anonymous";
}

export async function restoreSessionForBootstrap(
  loadSession: () => Promise<AuthSession>
): Promise<AuthSession> {
  try {
    return await loadSession();
  } catch {
    return ANONYMOUS_SESSION;
  }
}

export async function resolveSessionAfterSignOut(
  performLogout: () => Promise<AuthSession>
): Promise<AuthSession> {
  try {
    return await performLogout();
  } catch {
    return ANONYMOUS_SESSION;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(ANONYMOUS_SESSION);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applySession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setStatus(getAuthStatus(nextSession));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await getCurrentSession();
      applySession(nextSession);
      return;
    } catch (error) {
      console.error("[auth] Failed to restore session", error);
      applySession(ANONYMOUS_SESSION);
    }
  }, [applySession]);

  const signIn = useCallback(
    async (input: LoginInput) => {
      const nextSession = await loginRequest(input);
      applySession(nextSession);
      return nextSession;
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    try {
      const nextSession = await logoutRequest();
      applySession(nextSession);
      return;
    } catch (error) {
      console.error("[auth] Failed to sign out", error);
      applySession(ANONYMOUS_SESSION);
    }
  }, [applySession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleAuthRequired = () => {
      applySession(ANONYMOUS_SESSION);

      if (window.location.pathname === "/login") {
        return;
      }

      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.assign(`/login?next=${encodeURIComponent(nextPath || "/")}`);
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [applySession]);

  const value = useMemo(
    () => ({
      session,
      status,
      refreshSession,
      signIn,
      signOut
    }),
    [refreshSession, session, signIn, signOut, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
