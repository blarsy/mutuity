import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { bootstrapSession, clearPersistedToken, setPersistedAccountId, setPersistedLanguage, setPersistedToken } from "./session";
import { fetchAccountSnapshotById, type AuthAccountSnapshot } from "../graphql/auth";

export interface AuthSession {
  token: string | null;
  accountId: string | null;
  account: AuthAccountSnapshot | null;
  authenticated: boolean;
  loading: boolean;
}

export interface AuthContextValue {
  session: AuthSession;
  signIn: (token: string, accountId?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  invalidateSession: (reason?: string) => Promise<void>;
  changeLanguage: (language: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const initialSession: AuthSession = {
  token: null,
  accountId: null,
  account: null,
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
  const { i18n } = useTranslation();

  const hydrateAccountSnapshot = async (accountId: string | null): Promise<AuthAccountSnapshot | null> => {
    if (!accountId) {
      return null;
    }

    try {
      return await fetchAccountSnapshotById(accountId);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    void bootstrapSession()
      .then(async ({ token, accountId, language }) => {
        if (!isMounted) {
          return;
        }

        // Restore persisted language preference
        if (language && i18n.language !== language) {
          void i18n.changeLanguage(language);
        }

        const resolvedAccountId = accountId ?? resolveAccountIdFromToken(token);
        const account = token ? await hydrateAccountSnapshot(resolvedAccountId) : null;

        setSession({
          token,
          accountId: account?.id ?? resolvedAccountId,
          account,
          authenticated: Boolean(token),
          loading: false
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSession({ token: null, accountId: null, account: null, authenticated: false, loading: false });
      });

    return () => {
      isMounted = false;
    };
  }, [i18n]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: async (token: string, accountId?: string | null) => {
        const resolvedAccountId = accountId ?? resolveAccountIdFromToken(token);
        setSession({ token, accountId: resolvedAccountId, account: null, authenticated: true, loading: false });
        try {
          await setPersistedToken(token);
          await setPersistedAccountId(resolvedAccountId);
        } catch (error) {
          console.warn("[auth:persist-token-failed]", error);
        }

        const account = await hydrateAccountSnapshot(resolvedAccountId);
        setSession((previous) => ({
          ...previous,
          accountId: account?.id ?? previous.accountId,
          account
        }));
      },
      signOut: async () => {
        setSession({ token: null, accountId: null, account: null, authenticated: false, loading: false });
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

        setSession({ token: null, accountId: null, account: null, authenticated: false, loading: false });
        try {
          await clearPersistedToken();
        } catch (error) {
          console.warn("[auth:clear-token-failed]", error);
        }
      },
      changeLanguage: async (language: string) => {
        await i18n.changeLanguage(language);
        try {
          await setPersistedLanguage(language);
        } catch (error) {
          console.warn("[auth:persist-language-failed]", error);
        }
      },
      refreshSession: async () => {
        if (!session.authenticated || !session.accountId) {
          setSession((previous) => ({ ...previous, account: null }));
          return;
        }

        const account = await hydrateAccountSnapshot(session.accountId);
        setSession((previous) => ({
          ...previous,
          accountId: account?.id ?? previous.accountId,
          account
        }));
      }
    }),
    [session, i18n]
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
