import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";

export default function HomePage() {
  const { session, signOut, status } = useAuth();
  const createCampaignHref = session.authenticated
    ? "/campaigns/create"
    : "/login?next=%2Fcampaigns%2Fcreate";

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Mutuity Frontend Bootstrap
        </Typography>
        <Typography sx={{ mb: 3 }}>
          The login foundation is now active. Protected flows can now build on a real session layer.
        </Typography>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Checking session…
          </Alert>
        ) : null}

        {session.authenticated ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            Signed in as {session.account?.displayName ?? session.account?.externalSubject ?? "account"} ({session.role}).
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are currently signed out.
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component={NextLink} href={createCampaignHref} variant="contained">
            Create Campaign
          </Button>
          {session.authenticated ? (
            <Button color="inherit" onClick={() => void signOut()} variant="outlined">
              Sign out
            </Button>
          ) : (
            <Button component={NextLink} href="/login" variant="outlined">
              Sign in
            </Button>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
