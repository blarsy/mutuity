import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {title}
            </Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Box>

          <Alert severity="info">
            This page is reserved in the new shared navigation shell and will be filled out in a later slice.
          </Alert>

          {children}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/resources" variant="contained">
              Go to search
            </Button>
            <Button component={NextLink} href="/needs" variant="outlined">
              Go to contribute
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
