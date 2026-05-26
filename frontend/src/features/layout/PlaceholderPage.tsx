import NextLink from "next/link";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  const { t } = useTranslation("common");
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
            {t("placeholder.reserved")}
          </Alert>

          {children}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/app/resources" variant="contained">
              {t("placeholder.goToSearch")}
            </Button>
            <Button component={NextLink} href="/app/needs" variant="outlined">
              {t("placeholder.goToContribute")}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
