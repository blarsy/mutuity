import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { confirmPasswordReset, requestPasswordReset } from "../features/auth/auth.api";

export default function RestoreAccessPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const identifierFromQuery = useMemo(
    () => (typeof router.query.identifier === "string" ? router.query.identifier.trim().toLowerCase() : ""),
    [router.query.identifier]
  );
  const tokenFromQuery = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token.trim() : ""),
    [router.query.token]
  );

  const [identifier, setIdentifier] = useState(identifierFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (identifierFromQuery && identifier.trim().length === 0) {
      setIdentifier(identifierFromQuery);
    }
  }, [identifier, identifierFromQuery]);

  const handleRequestReset = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await requestPasswordReset({
        identifier: identifier.trim().toLowerCase()
      });

      setSuccess(response?.message ?? t("restoreAccess.resetRequestedFallback"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.genericRetry", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (password !== confirmPassword) {
      setError(t("restoreAccess.passwordMismatch"));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await confirmPasswordReset({
        token: tokenFromQuery,
        password
      });

      setSuccess(response?.message ?? t("restoreAccess.passwordUpdated", { defaultValue: "Password updated." }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.genericRetry", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("restoreAccess.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {tokenFromQuery
            ? t("restoreAccess.subtitleWithToken")
            : t("restoreAccess.subtitleWithoutToken")}
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          {tokenFromQuery ? (
            <>
              <TextField
                helperText={t("restoreAccess.newPasswordHelper")}
                label={t("restoreAccess.newPasswordLabel")}
                onChange={event => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <TextField
                label={t("restoreAccess.confirmPasswordLabel")}
                onChange={event => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
              <Button disabled={loading || password.length < 8 || confirmPassword.length < 8} onClick={handleConfirmReset} variant="contained">
                {t("restoreAccess.setPasswordButton")}
              </Button>
            </>
          ) : (
            <>
              <TextField
                label={t("restoreAccess.emailLabel")}
                onChange={event => setIdentifier(event.target.value)}
                required
                type="email"
                value={identifier}
              />
              <Button disabled={loading || identifier.trim().length === 0} onClick={handleRequestReset} variant="contained">
                {t("restoreAccess.sendResetButton")}
              </Button>
            </>
          )}

          <Button component={NextLink} href="/login">
            {t("restoreAccess.backToSignIn")}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
