import { useEffect, useState } from "react";
import type { ParsedUrlQuery } from "querystring";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  completeSocialRegistration,
  registerLocalAccount,
  registerLocalAccountWithSocialIdentity
} from "../features/auth/auth.api";
import { useAuth } from "../features/auth/AuthProvider";
import { shouldUseSocialRegistration, submitRegistration } from "../features/auth/registerSubmission";
import { SocialAuthButtons } from "../features/auth/SocialAuthButtons";
import { getSocialAuthStartUrl, type SocialProvider } from "../features/auth/socialAuth";

export function resolveSocialPrefill(query: ParsedUrlQuery) {
  const suggestedName =
    typeof query.suggestedName === "string"
      ? query.suggestedName
      : typeof query.name === "string"
        ? query.name
        : "";

  return {
    suggestedName,
    suggestedEmail: typeof query.email === "string" ? query.email : "",
    provider: typeof query.provider === "string" ? query.provider.toLowerCase() : "",
    providerSubject: typeof query.providerSubject === "string" ? query.providerSubject : "",
    pendingRegistrationToken:
      typeof query.pendingRegistrationToken === "string" ? query.pendingRegistrationToken : "",
    nextDestination:
      typeof query.next === "string" && query.next.startsWith("/") ? query.next : "/"
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { signIn, refreshSession } = useAuth();
  const { t, i18n } = useTranslation("auth");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    suggestedName,
    suggestedEmail,
    provider,
    providerSubject,
    pendingRegistrationToken,
    nextDestination
  } = resolveSocialPrefill(router.query);

  useEffect(() => {
    if (suggestedName && displayName.trim().length === 0) {
      setDisplayName(suggestedName);
    }

    if (suggestedEmail && identifier.trim().length === 0) {
      setIdentifier(suggestedEmail.toLowerCase());
    }
  }, [suggestedEmail, suggestedName]);

  const isSocialRegistration = shouldUseSocialRegistration(provider, providerSubject);

  const canSubmit =
    displayName.trim().length > 0
    && identifier.trim().length > 0
    && (isSocialRegistration || password.length >= 8)
    && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const preferredLanguage = i18n.language.toLowerCase().startsWith("en") ? "en" : "fr";

      const response = await submitRegistration({
        displayName,
        identifier,
        password,
        preferredLanguage,
        provider,
        providerSubject,
        registerLocal: registerLocalAccount,
        registerSocial: registerLocalAccountWithSocialIdentity
      });

      if (isSocialRegistration) {
        if (pendingRegistrationToken) {
          const completion = await completeSocialRegistration(pendingRegistrationToken);
          await refreshSession();
          await router.replace(completion.next || nextDestination);
          return;
        }

        const startUrl = getSocialAuthStartUrl(provider as SocialProvider, nextDestination);
        setSuccess(response?.message ?? t("register.successFallback"));

        if (startUrl) {
          window.location.assign(startUrl);
          return;
        }

        await router.replace(`/login?next=${encodeURIComponent(nextDestination)}`);
        return;
      }

      const normalizedIdentifier = identifier.trim().toLowerCase();

      await signIn({
        identifier: normalizedIdentifier,
        password
      });

      setSuccess(response?.message ?? t("register.successFallback"));
      await router.replace(nextDestination);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.genericRetry", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("register.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("register.subtitle")}
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success ? <Alert severity="success">{success}</Alert> : null}

          <TextField
            label={t("register.accountNameLabel")}
            onChange={event => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <TextField
            label={t("register.emailLabel")}
            onChange={event => setIdentifier(event.target.value)}
            required
            type="email"
            value={identifier}
          />
          {isSocialRegistration ? null : (
            <TextField
              helperText={t("register.passwordHelper")}
              label={t("register.passwordLabel")}
              onChange={event => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          )}

          <Button disabled={!canSubmit} onClick={handleSubmit} variant="contained">
            {t("register.submitButton")}
          </Button>
          <SocialAuthButtons nextDestination="/" />
          <Button component={NextLink} href="/login">
            {t("register.backToSignIn")}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
