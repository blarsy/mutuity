import { useState } from "react";
import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { changePassword } from "../features/auth/auth.api";
import { useRequireAuth } from "../features/auth/requireAuth";

export default function ChangePasswordPage() {
  const { t } = useTranslation("auth");
  const { isAuthenticated, isChecking } = useRequireAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      setSuccess(t("changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.genericRetry", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Alert severity="info">{t("authGuard.checking", { ns: "common" })}</Alert>
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("changePassword.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("changePassword.subtitle")}
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <TextField
            label={t("changePassword.currentPasswordLabel")}
            onChange={event => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
          <TextField
            helperText={t("changePassword.newPasswordHelper")}
            label={t("changePassword.newPasswordLabel")}
            onChange={event => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
          <TextField
            label={t("changePassword.confirmPasswordLabel")}
            onChange={event => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />

          <Button
            disabled={loading || currentPassword.length === 0 || newPassword.length < 8 || confirmPassword.length < 8}
            onClick={handleSubmit}
            variant="contained"
          >
            {t("changePassword.submitButton")}
          </Button>
          <Button component={NextLink} href="/">
            {t("changePassword.backHome")}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
