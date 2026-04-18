import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

import { useAuth } from "./AuthProvider";

export function buildLoginHref(asPath: string | null | undefined): string {
  const nextPath = asPath && asPath !== "/login" ? asPath : "/";
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function useRequireAuth() {
  const router = useRouter();
  const { session, status } = useAuth();

  const loginHref = useMemo(() => buildLoginHref(router.asPath), [router.asPath]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (status === "anonymous") {
      void router.replace(loginHref);
    }
  }, [loginHref, router, status]);

  return {
    isAuthenticated: session.authenticated,
    isChecking: status === "loading",
    isRedirecting: status === "anonymous",
    loginHref,
    status
  };
}
