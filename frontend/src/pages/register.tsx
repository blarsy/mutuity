import { Alert, Box, Container, Typography } from "@mui/material";

import { PlaceholderPage } from "../features/layout/PlaceholderPage";

export default function RegisterPage() {
  return (
    <PlaceholderPage
      title="Create account"
      description="Local registration and future external-provider registration will live here."
    >
      <Alert severity="info">
        The shared auth componentization has reserved this page; the full registration flow will be added in a later slice.
      </Alert>
    </PlaceholderPage>
  );
}
