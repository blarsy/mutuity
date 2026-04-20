import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";

import { registerLocalAccount } from "../features/auth/auth.api";
import { useAuth } from "../features/auth/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
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

      setSuccess(response?.message ?? "Account created. Please verify your email.");
      await router.replace("/");
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
          Create account
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Create your local email/password account. You will be signed in immediately and can verify your email from the banner.
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <TextField
            label="Account name"
            onChange={event => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <TextField
            label="Email"
            onChange={event => setIdentifier(event.target.value)}
            required
            type="email"
            value={identifier}
          />
          <TextField
            helperText="Minimum 8 characters"
            label="Password"
            onChange={event => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          <Button disabled={!canSubmit} onClick={handleSubmit} variant="contained">
            Create account
          </Button>
          <Button component={NextLink} href="/login">
            Back to sign in
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
