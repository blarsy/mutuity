import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { confirmEmailVerification } from "../features/auth/auth.api";
import { useAuth } from "../features/auth/AuthProvider";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { t } = useTranslation("auth");
  const token = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token.trim() : ""),
    [router.query.token]
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const loadingMessage = t("verifyEmail.verifyingMessage");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (token.length === 0) {
      setStatus("error");
      setMessage(t("verifyEmail.tokenMissing"));
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { message: successMessage } = await confirmEmailVerification({ token });
        await refreshSession();

        if (!cancelled) {
          setStatus("success");
          setMessage(successMessage ?? t("verifyEmail.successFallback"));
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
  }, [refreshSession, router.isReady, token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("verifyEmail.title")}
        </Typography>

        <Stack spacing={2}>
          {status === "loading" ? <Alert severity="info">{message || loadingMessage}</Alert> : null}
          {status === "success" ? <Alert severity="success">{message}</Alert> : null}
          {status === "error" ? <Alert severity="error">{message}</Alert> : null}
        </Stack>
      </Box>
    </Container>
  );
}
