import { useRouter } from "next/router";
import { useEffect } from "react";

import { useAuth } from "./AuthProvider";
import { useRequireAuth } from "./requireAuth";

export function useRequireAdmin() {
  const router = useRouter();
  const { session } = useAuth();
  const { isChecking, isRedirecting, isAuthenticated } = useRequireAuth();

  const isAdmin = isAuthenticated && session.role === "admin";
  const shouldRedirectForbidden =
    router.isReady && !isChecking && !isRedirecting && isAuthenticated && !isAdmin;

  useEffect(() => {
    if (!shouldRedirectForbidden) {
      return;
    }

    void router.replace("/");
  }, [router, shouldRedirectForbidden]);

  return {
    isAdmin,
    isChecking,
    isRedirecting,
    isForbiddenRedirecting: shouldRedirectForbidden
  };
}
