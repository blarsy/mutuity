import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

import { confirmEmailVerification } from "../features/auth/auth.api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const token = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token.trim() : ""),
    [router.query.token]
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (token.length === 0) {
      setStatus("error");
      setMessage("Verification token is missing or invalid.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { message: successMessage } = await confirmEmailVerification({ token });

        if (!cancelled) {
          setStatus("success");
          setMessage(successMessage ?? "Email verified. You can now sign in.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Verification failed.");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Verify email
        </Typography>

        <Stack spacing={2}>
          {status === "loading" ? <Alert severity="info">{message}</Alert> : null}
          {status === "success" ? <Alert severity="success">{message}</Alert> : null}
          {status === "error" ? <Alert severity="error">{message}</Alert> : null}

          <Button component={NextLink} href="/login" variant="contained">
            Continue to sign in
          </Button>
          <Button component={NextLink} href="/register">
            Back to create account
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
