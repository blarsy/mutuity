import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";
import { LoginDialog } from "../features/auth/LoginDialog";

export default function HomePage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const accountName = session.account?.displayName ?? session.account?.externalSubject ?? "account";

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
          <Typography sx={{ mb: 3 }} variant="h5">
            Welcome back {accountName}
          </Typography>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Button onClick={() => setLoginDialogOpen(true)} variant="outlined">
              Sign in
            </Button>
          </Box>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component={NextLink} href="/needs" variant="contained">
            Needs
          </Button>
          <Button component={NextLink} href="/resources" variant="contained">
            Resources
          </Button>
        </Stack>

        <LoginDialog
          nextDestination={router.asPath}
          onClose={() => setLoginDialogOpen(false)}
          open={loginDialogOpen}
          subtitle="Connect to access bids, claims, chat, and your account workspace."
        />
      </Box>
    </Container>
  );
}
