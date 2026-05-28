import { Alert, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { SOCIAL_AUTH_PROVIDERS, getSocialAuthStartUrl, type SocialProvider } from "./socialAuth";

type SocialAuthButtonsProps = {
  nextDestination: string;
};

function providerLabel(provider: SocialProvider, t: (key: string) => string) {
  return provider === "google" ? t("form.continueWithGoogle") : t("form.continueWithApple");
}

export function SocialAuthButtons({ nextDestination }: SocialAuthButtonsProps) {
  const { t } = useTranslation("auth");

  const providerLinks = SOCIAL_AUTH_PROVIDERS.map(provider => ({
    provider,
    href: getSocialAuthStartUrl(provider, nextDestination)
  }));

  const hasAtLeastOneProvider = providerLinks.some(entry => Boolean(entry.href));

  return (
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="body2">
        {t("form.socialActions")}
      </Typography>

      {providerLinks.map(entry => (
        <Button
          component={entry.href ? "a" : "button"}
          disabled={!entry.href}
          href={entry.href ?? undefined}
          key={entry.provider}
          rel="noopener noreferrer"
          variant="outlined"
        >
          {providerLabel(entry.provider, t)}
        </Button>
      ))}

      {!hasAtLeastOneProvider ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          {t("form.socialUnavailable")}
        </Alert>
      ) : null}
    </Stack>
  );
}
