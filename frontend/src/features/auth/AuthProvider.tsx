import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import { getCurrentSession, login as loginRequest, logout as logoutRequest } from "./auth.api";
import { AUTH_REQUIRED_EVENT } from "./events";
import type { AuthSession, LoginInput } from "./types";
import { logBackofficeError } from "../logging/operationalLogger";
import i18n from "../../i18n";
import { resetAccountGraphqlState } from "../../services/graphql/client";

const LANGUAGE_STORAGE_KEY = "mutuity-language";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(ANONYMOUS_SESSION);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const requestVersion = useRef(0);
  const identityRef = useRef<string | null>(null);
  const cacheResetRef = useRef<Promise<void>>(Promise.resolve());

  const applySession = useCallback(async (nextSession: AuthSession, version: number) => {
    if (version !== requestVersion.current) return;
    const identity = nextSession.authenticated ? nextSession.account?.id ?? null : null;
    if (identity !== identityRef.current) {
      identityRef.current = identity;
      setSession(ANONYMOUS_SESSION);
      setStatus("loading");
      cacheResetRef.current = cacheResetRef.current.catch(() => undefined).then(resetAccountGraphqlState);
    }
    await cacheResetRef.current;
    if (version !== requestVersion.current) return;
    setSession(nextSession);
    setStatus(getAuthStatus(nextSession));
  }, []);

  const refreshSession = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const nextSession = await getCurrentSession();
      await applySession(nextSession, version);
      return;
    } catch (error) {
      console.error("[auth] Failed to restore session", error);
      void logBackofficeError("[auth] Failed to restore session", error, {
        context: "auth_session_restore"
      });
      await applySession(ANONYMOUS_SESSION, version);
    }
  }, [applySession]);

  const signIn = useCallback(
    async (input: LoginInput) => {
      const version = ++requestVersion.current;
      const nextSession = await loginRequest(input);
      await applySession(nextSession, version);
      return nextSession;
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const nextSession = await logoutRequest();
      await applySession(nextSession, version);
      return;
    } catch (error) {
      console.error("[auth] Failed to sign out", error);
      void logBackofficeError("[auth] Failed to sign out", error, {
        context: "auth_sign_out"
      });
      await applySession(ANONYMOUS_SESSION, version);
    }
  }, [applySession]);

  useEffect(() => {
    void refreshSession().catch(error => {
      console.error("[auth] Failed to initialize account state", error);
    });
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
  }, [refreshSession]);

  useEffect(() => {
    if (!session.authenticated || !session.account?.preferredLanguage) {
      return;
    }

    const lang = session.account.preferredLanguage;

    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, [session.authenticated, session.account?.preferredLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleAuthRequired = () => {
      void applySession(ANONYMOUS_SESSION, ++requestVersion.current).catch(error => {
        console.error("[auth] Failed to clear account state", error);
      });

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

  return (
    <AuthContext.Provider value={value}>
      <Fragment key={session.authenticated ? session.account?.id : "anonymous"}>{children}</Fragment>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
