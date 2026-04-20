import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";

import { confirmPasswordReset, requestPasswordReset } from "../features/auth/auth.api";

export default function RestoreAccessPage() {
  const router = useRouter();
  const tokenFromQuery = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token.trim() : ""),
    [router.query.token]
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestReset = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await requestPasswordReset({
        identifier: identifier.trim().toLowerCase()
      });

      setSuccess(response?.message ?? "Password reset requested.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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

      setSuccess(response?.message ?? "Password updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Restore access
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {tokenFromQuery
            ? "Set your new password to complete access recovery."
            : "Request a password-reset link for your account email."}
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          {tokenFromQuery ? (
            <>
              <TextField
                helperText="Minimum 8 characters"
                label="New password"
                onChange={event => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <TextField
                label="Confirm password"
                onChange={event => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
              <Button disabled={loading || password.length < 8 || confirmPassword.length < 8} onClick={handleConfirmReset} variant="contained">
                Set new password
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="Email"
                onChange={event => setIdentifier(event.target.value)}
                required
                type="email"
                value={identifier}
              />
              <Button disabled={loading || identifier.trim().length === 0} onClick={handleRequestReset} variant="contained">
                Send reset instructions
              </Button>
            </>
          )}

          <Button component={NextLink} href="/login">
            Back to sign in
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
