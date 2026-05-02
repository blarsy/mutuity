import { useRouter } from "next/router";
import { Alert, Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ConversationListPanel } from "../features/chat/ConversationListPanel";
import { ConversationThread } from "../features/chat/ConversationThread";

export default function ChatPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("chat");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();

  const selectedConversationId =
    typeof router.query.id === "string" ? router.query.id : null;
  const selectedKind =
    typeof router.query.kind === "string"
      ? (router.query.kind.toLowerCase() as "need" | "resource")
      : null;

  const hasThread = Boolean(selectedConversationId && selectedKind);

  const handleBack = () => {
    router.push("/chat");
  };

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
      <Box sx={{ mb: { sm: 3, xs: hasThread ? 0 : 3 } }}>
        <Typography
          component="h1"
          gutterBottom
          sx={{ display: { sm: "block", xs: hasThread ? "none" : "block" } }}
          variant="h4"
        >
          {t("workspaceTitle")}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ display: { sm: "block", xs: hasThread ? "none" : "block" } }}
        >
          {t("workspaceSubtitle")}
        </Typography>
      </Box>

      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          display: "flex",
          height: "calc(100vh - 240px)",
          minHeight: 400,
          overflow: "hidden"
        }}
      >
        {/* Left pane: conversation list */}
        <Box
          sx={{
            borderRight: 1,
            borderColor: "divider",
            display: {
              sm: "flex",
              // On mobile, hide list when a thread is open
              xs: hasThread ? "none" : "flex"
            },
            flexDirection: "column",
            flexShrink: 0,
            width: { sm: "35%", lg: "30%" }
          }}
        >
          <ConversationListPanel
            isAuthenticated={isAuthenticated && Boolean(session.account)}
            selectedConversationId={selectedConversationId}
          />
        </Box>

        {/* Right pane: conversation thread */}
        <Box
          sx={{
            display: {
              sm: "flex",
              // On mobile, show thread only when one is selected
              xs: hasThread ? "flex" : "none"
            },
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {hasThread && selectedConversationId && selectedKind ? (
            <ConversationThread
              conversationId={selectedConversationId}
              kind={selectedKind}
              onBack={handleBack}
            />
          ) : (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                height: "100%",
                justifyContent: "center",
                p: 4
              }}
            >
              <Typography color="text.secondary" variant="body2">
                {t("thread.selectPrompt")}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

