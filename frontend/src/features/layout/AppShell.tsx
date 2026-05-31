import { useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { requestEmailVerification } from "../auth/auth.api";
import { useAuth } from "../auth/AuthProvider";
import { AppTopBar } from "./AppTopBar";
import type { AppColorMode } from "../../theme";

export function AppShell({
  children,
  colorMode,
  onToggleColorMode
}: {
  children: ReactNode;
  colorMode: AppColorMode;
  onToggleColorMode: () => void;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("layout");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const shouldShowActivationBanner =
    session.authenticated && Boolean(session.account) && !session.account?.emailVerified;
  const shouldShowTopBar = router.pathname !== "/";

  const handleResendActivationMail = async () => {
    if (!session.account?.externalSubject || resendLoading) {
      return;
    }

    setResendLoading(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const response = await requestEmailVerification({
        identifier: session.account.externalSubject
      });
      setResendMessage(response.message);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : t("errors.genericRetry", { ns: "common" }));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {shouldShowTopBar ? <AppTopBar colorMode={colorMode} onToggleColorMode={onToggleColorMode} /> : null}
      {shouldShowActivationBanner ? (
        <>
          <Alert
            action={(
              <Button
                color="inherit"
                disabled={resendLoading}
                onClick={() => void handleResendActivationMail()}
                size="small"
                variant="text"
              >
                {t("activationBanner.resendButton")}
              </Button>
            )}
            severity="warning"
            sx={{ borderRadius: 0, py: 0.5 }}
          >
            {t("activationBanner.text")}
          </Alert>
          {resendMessage ? (
            <Alert severity="success" sx={{ borderRadius: 0, py: 0.5 }}>
              {t("activationBanner.resendSuccess")}
            </Alert>
          ) : null}
          {resendError ? (
            <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>
              {resendError}
            </Alert>
          ) : null}
        </>
      ) : null}
      <Box component="main">{children}</Box>
    </Box>
  );
}
