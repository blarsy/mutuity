import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";

export default function HomePage() {
  const { session, status } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Mutuity
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Discover available needs and resources. A fuller onboarding experience will be added here.
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
            Needs
          </Button>
          <Button component={NextLink} href="/resources" variant="contained">
            Resources
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
