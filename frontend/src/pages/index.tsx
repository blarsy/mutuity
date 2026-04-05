import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";
import { LogoutButton } from "../features/auth/LogoutButton";

export default function HomePage() {
  const { session, status } = useAuth();
  const createCampaignHref = session.authenticated
    ? "/campaigns/create"
    : "/login?next=%2Fcampaigns%2Fcreate";

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Mutuity
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Public need and resource discovery are now available, and authenticated flows continue to build on the real session layer.
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
          <Button component={NextLink} href="/needs" variant="contained">
            Browse Needs
          </Button>
          <Button component={NextLink} href="/resources" variant="contained">
            Browse Resources
          </Button>
          <Button component={NextLink} href={createCampaignHref} variant="outlined">
            Create Campaign
          </Button>
          {session.authenticated ? (
            <LogoutButton color="inherit" redirectTo="/login" variant="outlined">
              Sign out
            </LogoutButton>
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
