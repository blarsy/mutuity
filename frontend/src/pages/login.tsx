import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Container, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";
import { LoginForm } from "../features/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { status, session } = useAuth();

  const nextDestination = useMemo(() => {
    const candidate = router.query.next;
    return typeof candidate === "string" && candidate.startsWith("/") ? candidate : "/";
  }, [router.query.next]);
  const isProtectedRedirect = nextDestination !== "/";

  useEffect(() => {
    if (status === "authenticated") {
      void router.replace(nextDestination);
    }
  }, [nextDestination, router, status]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Access protected actions and your account session.
        </Typography>

        {isProtectedRedirect && !session.authenticated ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please sign in to access that page. You’ll return there after login.
          </Alert>
        ) : null}

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Restoring your session…
          </Alert>
        ) : null}

        {session.authenticated ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            You are already signed in. Redirecting now…
          </Alert>
        ) : null}

        <LoginForm nextDestination={nextDestination} showSecondaryActions />
      </Box>
    </Container>
  );
}
