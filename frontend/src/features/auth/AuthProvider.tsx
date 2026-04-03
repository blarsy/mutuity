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

const anonymousSession: AuthSession = {
  authenticated: false,
  account: null,
  role: "anonymous",
  expiresAt: null
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(anonymousSession);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applySession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setStatus(nextSession.authenticated ? "authenticated" : "anonymous");
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await getCurrentSession();
      applySession(nextSession);
    } catch (error) {
      console.error("[auth] Failed to restore session", error);
      applySession(anonymousSession);
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
      applySession(anonymousSession);
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
      applySession(anonymousSession);

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
