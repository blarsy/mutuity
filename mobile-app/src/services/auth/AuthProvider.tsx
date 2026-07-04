import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { bootstrapSession, clearPersistedToken, setPersistedToken } from "./session";

export interface AuthSession {
  token: string | null;
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
  authenticated: false,
  loading: true
};

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<AuthSession>(initialSession);

  useEffect(() => {
    let isMounted = true;

    void bootstrapSession().then(({ token }) => {
      if (!isMounted) {
        return;
      }

      setSession({
        token,
        authenticated: Boolean(token),
        loading: false
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: async (token: string) => {
        await setPersistedToken(token);
        setSession({ token, authenticated: true, loading: false });
      },
      signOut: async () => {
        await clearPersistedToken();
        setSession({ token: null, authenticated: false, loading: false });
      },
      invalidateSession: async (reason?: string) => {
        if (reason) {
          console.warn("[auth:invalid-session]", reason);
        }

        await clearPersistedToken();
        setSession({ token: null, authenticated: false, loading: false });
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
