import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { bootstrapSession, clearPersistedToken, setPersistedToken } from "./session";

export interface AuthSession {
  token: string | null;
  accountId: string | null;
  authenticated: boolean;
  loading: boolean;
}

export interface AuthContextValue {
  session: AuthSession;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  invalidateSession: (reason?: string) => Promise<void>;
}

const initialSession: AuthSession = {
  token: null,
  accountId: null,
  authenticated: false,
  loading: true
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  const payloadSegment = parts[1];

  if (!payloadSegment || typeof globalThis.atob !== "function") {
    return null;
  }

  try {
    const payloadBase64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const payloadJson = globalThis.atob(normalized);
    const parsed = JSON.parse(payloadJson) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function resolveAccountIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  if (UUID_PATTERN.test(token)) {
    return token;
  }

  if (token.startsWith("mock:")) {
    const accountId = token.slice("mock:".length);
    return UUID_PATTERN.test(accountId) ? accountId : null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const candidates = [payload.accountId, payload.account_id, payload.sub];
  const accountId = candidates.find((value) => typeof value === "string" && UUID_PATTERN.test(value));

  return typeof accountId === "string" ? accountId : null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<AuthSession>(initialSession);

  useEffect(() => {
    let isMounted = true;

    void bootstrapSession()
      .then(({ token }) => {
        if (!isMounted) {
          return;
        }

        setSession({
          token,
          accountId: resolveAccountIdFromToken(token),
          authenticated: Boolean(token),
          loading: false
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSession({ token: null, accountId: null, authenticated: false, loading: false });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: async (token: string) => {
        setSession({ token, accountId: resolveAccountIdFromToken(token), authenticated: true, loading: false });
        try {
          await setPersistedToken(token);
        } catch (error) {
          console.warn("[auth:persist-token-failed]", error);
        }
      },
      signOut: async () => {
        setSession({ token: null, accountId: null, authenticated: false, loading: false });
        try {
          await clearPersistedToken();
        } catch (error) {
          console.warn("[auth:clear-token-failed]", error);
        }
      },
      invalidateSession: async (reason?: string) => {
        if (reason) {
          console.warn("[auth:invalid-session]", reason);
        }

        setSession({ token: null, accountId: null, authenticated: false, loading: false });
        try {
          await clearPersistedToken();
        } catch (error) {
          console.warn("[auth:clear-token-failed]", error);
        }
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
