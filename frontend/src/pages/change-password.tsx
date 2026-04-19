import { useState } from "react";
import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";

import { changePassword } from "../features/auth/auth.api";
import { useRequireAuth } from "../features/auth/requireAuth";

export default function ChangePasswordPage() {
  const { isAuthenticated, isChecking } = useRequireAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Alert severity="info">Checking your session…</Alert>
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
          Change password
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Update your password for your current account.
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <TextField
            label="Current password"
            onChange={event => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
          <TextField
            helperText="Minimum 8 characters"
            label="New password"
            onChange={event => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
          <TextField
            label="Confirm new password"
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
            Update password
          </Button>
          <Button component={NextLink} href="/">
            Back to home
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
