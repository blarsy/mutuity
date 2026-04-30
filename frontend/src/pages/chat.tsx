import { useRouter } from "next/router";
import { Alert, Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ConversationListPanel } from "../features/chat/ConversationListPanel";

export default function ChatPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("chat");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();

  const selectedConversationId =
    typeof router.query.id === "string" ? router.query.id : null;

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("workspaceTitle")}
          </Typography>
          <Alert severity="info">
            {isChecking
              ? t("authGuard.checking", { ns: "common" })
              : isRedirecting
                ? t("authGuard.redirecting", { ns: "common" })
                : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("workspaceTitle")}
        </Typography>
        <Typography color="text.secondary">{t("workspaceSubtitle")}</Typography>
      </Box>

      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          height: "calc(100vh - 240px)",
          minHeight: 400,
          overflow: "hidden"
        }}
      >
        <ConversationListPanel
          isAuthenticated={isAuthenticated && Boolean(session.account)}
          selectedConversationId={selectedConversationId}
        />
      </Box>
    </Container>
  );
}

