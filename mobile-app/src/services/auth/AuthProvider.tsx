import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { bootstrapSession, clearPersistedToken, setPersistedAccountId, setPersistedLanguage, setPersistedToken } from "./session";
import { fetchAccountSnapshotById, type AuthAccountSnapshot } from "../graphql/auth";
import { resetAccountGraphqlState } from "../graphql/client";
import { logAppEvent } from "../monitoring/logger";

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

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<AuthSession>(initialSession);
  const { i18n } = useTranslation();
  const sessionRef = useRef(session);
  const generation = useRef(0);
  const hydrationGeneration = useRef(0);
  const mounted = useRef(true);
  // Serialize writes: an older SecureStore write must never finish after logout
  // or a newer sign-in and restore the previous account's credentials.
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());

  const publishSession = (next: AuthSession) => {
    sessionRef.current = next;
    setSession(next);
  };
  const isCurrent = (version: number) => mounted.current && generation.current === version;
  const beginTransition = () => {
    const version = ++generation.current;
    hydrationGeneration.current += 1;
    publishSession({ ...initialSession });
    return version;
  };
  const enqueuePersistence = (task: () => Promise<void>): Promise<void> => {
    const result = persistenceQueue.current.then(task);
    persistenceQueue.current = result.catch(() => undefined);
    return result;
  };

  const hydrateAccountSnapshot = async (accountId: string | null): Promise<AuthAccountSnapshot | null> => {
    if (!accountId) {
      return null;
    }

    try {
      return await fetchAccountSnapshotById(accountId);
    } catch (error) {
      logAppEvent({ level: "warn", message: "auth-account-hydration-failed", details: error });
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;
    const version = generation.current;

    void bootstrapSession()
      .then(async ({ token, accountId, language }) => {
        if (!isCurrent(version)) {
          return;
        }

        const resolvedAccountId = accountId ?? resolveAccountIdFromToken(token);
        await enqueuePersistence(async () => {
          if (!isCurrent(version)) return;
          await resetAccountGraphqlState();
          if (!isCurrent(version)) return;
          // Repair older sessions whose account id was only encoded in the token.
          await setPersistedAccountId(token ? resolvedAccountId : null);
        });
        if (!isCurrent(version)) return;
        if (language && i18n.language !== language) {
          await i18n.changeLanguage(language);
        }
        if (!isCurrent(version)) return;
        const hydration = ++hydrationGeneration.current;
        const account = token ? await hydrateAccountSnapshot(resolvedAccountId) : null;
        if (!isCurrent(version) || hydration !== hydrationGeneration.current) return;
        publishSession({
          token,
          accountId: token ? account?.id ?? resolvedAccountId : null,
          account,
          authenticated: Boolean(token),
          loading: false
        });
      })
      .catch((error) => {
        if (!isCurrent(version)) {
          return;
        }
        logAppEvent({ level: "warn", message: "auth-bootstrap-failed", details: error });
        publishSession({ ...initialSession, loading: false });
      });

    return () => {
      mounted.current = false;
      generation.current += 1;
      hydrationGeneration.current += 1;
    };
  }, [i18n]);

  const endSession = async (reason?: string) => {
    const version = beginTransition();
    if (reason) logAppEvent({ level: "warn", message: "auth-invalid-session", details: reason });
    try {
      await enqueuePersistence(async () => {
        if (!isCurrent(version)) return;
        try {
          await resetAccountGraphqlState();
        } finally {
          // A cache failure must not prevent logout; a storage failure must not
          // leave operations/cache created during the transition alive either.
          try {
            await clearPersistedToken();
          } finally {
            await resetAccountGraphqlState();
          }
        }
      });
    } catch (error) {
      logAppEvent({ level: "error", message: "auth-clear-token-failed", details: error });
    } finally {
      if (isCurrent(version)) publishSession({ ...initialSession, loading: false });
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: async (token: string, accountId?: string | null) => {
        const version = beginTransition();
        const resolvedAccountId = accountId ?? resolveAccountIdFromToken(token);
        try {
          await enqueuePersistence(async () => {
            if (!isCurrent(version)) return;
            await resetAccountGraphqlState();
            if (!isCurrent(version)) return;
            await setPersistedToken(token);
            await setPersistedAccountId(resolvedAccountId);
            await resetAccountGraphqlState();
          });
        } catch (error) {
          logAppEvent({ level: "error", message: "auth-persist-token-failed", details: error });
          if (isCurrent(version)) {
            await endSession();
            throw error;
          }
          return;
        }
        if (!isCurrent(version)) return;
        publishSession({ token, accountId: resolvedAccountId, account: null, authenticated: true, loading: false });
        const hydration = ++hydrationGeneration.current;
        const account = await hydrateAccountSnapshot(resolvedAccountId);
        if (!isCurrent(version) || hydration !== hydrationGeneration.current) return;
        publishSession({
          ...sessionRef.current,
          accountId: account?.id ?? resolvedAccountId,
          account
        });
      },
      signOut: () => endSession(),
      invalidateSession: (reason?: string) => endSession(reason),
      changeLanguage: async (language: string) => {
        await i18n.changeLanguage(language);
        try {
          await setPersistedLanguage(language);
        } catch (error) {
          logAppEvent({ level: "warn", message: "auth-persist-language-failed", details: error });
        }
      },
      refreshSession: async () => {
        const current = sessionRef.current;
        const version = generation.current;
        if (!current.authenticated || !current.accountId) {
          return;
        }

        const hydration = ++hydrationGeneration.current;
        const account = await hydrateAccountSnapshot(current.accountId);
        if (!isCurrent(version) || hydration !== hydrationGeneration.current) return;
        publishSession({
          ...sessionRef.current,
          accountId: account?.id ?? current.accountId,
          account
        });
      }
    }),
    [session, i18n]
  );

  return (
    <AuthContext.Provider value={value}>
      <React.Fragment key={JSON.stringify([session.accountId, session.token])}>{children}</React.Fragment>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
