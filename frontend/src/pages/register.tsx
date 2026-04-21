import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { registerLocalAccount } from "../features/auth/auth.api";
import { useAuth } from "../features/auth/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useTranslation("auth");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length > 0 && identifier.trim().length > 0 && password.length >= 8 && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedIdentifier = identifier.trim().toLowerCase();

      const response = await registerLocalAccount({
        displayName: displayName.trim(),
        identifier: normalizedIdentifier,
        password
      });

      await signIn({
        identifier: normalizedIdentifier,
        password
      });

      setSuccess(response?.message ?? t("register.successFallback"));
      await router.replace("/");
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
          {t("register.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("register.subtitle")}
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <TextField
            label={t("register.accountNameLabel")}
            onChange={event => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <TextField
            label={t("register.emailLabel")}
            onChange={event => setIdentifier(event.target.value)}
            required
            type="email"
            value={identifier}
          />
          <TextField
            helperText={t("register.passwordHelper")}
            label={t("register.passwordLabel")}
            onChange={event => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          <Button disabled={!canSubmit} onClick={handleSubmit} variant="contained">
            {t("register.submitButton")}
          </Button>
          <Button component={NextLink} href="/login">
            {t("register.backToSignIn")}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
