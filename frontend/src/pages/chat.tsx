import { useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ConversationListPanel } from "../features/chat/ConversationListPanel";
import { ConversationThread } from "../features/chat/ConversationThread";
import { conversationThreadUrl } from "../features/chat/chatRouting";

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
  const isDraft = router.query.draft === "1";
  const draftContextId = typeof router.query.contextId === "string" ? router.query.contextId : null;
  const draftOtherAccountId = typeof router.query.otherAccountId === "string" ? router.query.otherAccountId : null;
  const draftTitle = typeof router.query.title === "string" ? router.query.title : null;

  const draftThread =
    isDraft && selectedKind === "resource" && draftContextId && draftOtherAccountId
      ? {
          kind: "resource" as const,
          contextId: draftContextId,
          otherAccountId: draftOtherAccountId,
          title: draftTitle
        }
      : isDraft && selectedKind === "need" && draftContextId
        ? {
            kind: "need" as const,
            contextId: draftContextId,
            otherAccountId: null,
            title: draftTitle
          }
      : null;
  const [listRefreshToken, setListRefreshToken] = useState(0);

  const hasThread = Boolean((selectedConversationId && selectedKind) || draftThread);

  const handleBack = () => {
    router.push("/chat");
  };

  const handleConversationCreated = async (kind: "need" | "resource", conversationId: string) => {
    setListRefreshToken(current => current + 1);
    await router.replace(conversationThreadUrl(kind, conversationId));
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
    <Container disableGutters maxWidth={false} sx={{ px: { xs: 0, sm: 2 }, py: 0 }}>
      <Stack
        direction="row"
        sx={{
          height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
          maxHeight: "100%",
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            borderRight: 1,
            borderColor: "divider",
            display: {
              sm: "flex",
              xs: hasThread ? "none" : "flex"
            },
            flexDirection: "column",
            flexShrink: 0,
            width: { sm: "35%", lg: "30%", xs: "100%" }
          }}
        >
          <ConversationListPanel
            draftThread={draftThread}
            isAuthenticated={isAuthenticated && Boolean(session.account)}
            listRefreshToken={listRefreshToken}
            selectedDraft={Boolean(draftThread)}
            selectedConversationId={selectedConversationId}
          />
        </Box>

        <Box
          sx={{
            display: {
              sm: "flex",
              xs: hasThread ? "flex" : "none"
            },
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {hasThread && selectedKind ? (
            <ConversationThread
              conversationId={selectedConversationId}
              draftThread={draftThread}
              kind={selectedKind}
              onConversationCreated={handleConversationCreated}
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
      </Stack>
    </Container>
  );
}

