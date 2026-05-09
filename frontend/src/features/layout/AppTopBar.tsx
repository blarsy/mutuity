import NextLink from "next/link";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { Alert, AppBar, Badge, Box, Button, IconButton, Menu, MenuItem, Snackbar, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { LoginDialog } from "../auth/LoginDialog";
import { conversationThreadUrl, type ChatContextKind } from "../chat/chatRouting";
import { TOKEN_BALANCE_QUERY } from "../contribution/contribution.queries";
import { COUNT_UNREAD_CHAT_CONVERSATIONS_QUERY, LIST_CHAT_CONVERSATIONS_QUERY } from "../chat/chat.queries";
import { COUNT_UNREAD_NOTIFICATIONS_QUERY } from "../notifications/notifications.queries";
import { AvatarIconButton } from "../ui/AvatarIconButton";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import type { AppColorMode } from "../../theme";

const signedOutLinks = [
  { labelKey: "nav.search", href: "/resources" },
  { labelKey: "nav.contribute", href: "/needs" }
];

const LANGUAGE_STORAGE_KEY = "mutuity-language";
const AVAILABLE_LANGUAGES = ["fr", "en"] as const;
const signedInLinks = [
  { labelKey: "nav.search", href: "/resources" },
  { labelKey: "nav.contribute", href: "/needs" },
  { labelKey: "nav.resources", href: "/resources/manage" },
  { labelKey: "nav.bids", href: "/bids" },
  { labelKey: "nav.needs", href: "/needs/manage" },
  { labelKey: "nav.claims", href: "/claims" },
  { labelKey: "nav.campaigns", href: "/campaigns" },
  { labelKey: "nav.chat", href: "/chat" },
  { labelKey: "nav.notifications", href: "/notifications" }
];

type ListChatConversationsData = {
  listChatConversations: {
    nodes: {
      conversationKind: ChatContextKind;
      conversationId: string;
      otherAccountDisplayName: string | null;
      lastMessagePreview: string | null;
      unreadCount: number;
    }[];
  };
};

export function AppTopBar({
  colorMode,
  onToggleColorMode
}: {
  colorMode: AppColorMode;
  onToggleColorMode: () => void;
}) {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { t, i18n } = useTranslation("layout");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [chatMessageToast, setChatMessageToast] = useState<{
    senderName: string;
    preview: string;
    conversationKind: ChatContextKind;
    conversationId: string;
  } | null>(null);
  const previousUnreadNotificationsCountRef = useRef<number | null>(null);
  const previousUnreadChatCountRef = useRef<number | null>(null);
  const [fetchLatestConversation] = useLazyQuery<ListChatConversationsData>(LIST_CHAT_CONVERSATIONS_QUERY, {
    fetchPolicy: "network-only"
  });

  const { data: balanceData, refetch: refetchBalance } = useQuery<{ currentTokenBalance: number }>(TOKEN_BALANCE_QUERY, {
    skip: !session.authenticated
  });
  const { data: unreadNotificationsData, refetch: refetchUnreadNotifications } = useQuery<{ countUnreadNotifications: number | null }>(
    COUNT_UNREAD_NOTIFICATIONS_QUERY,
    {
      skip: !session.authenticated,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first"
    }
  );
  const { data: unreadChatData, refetch: refetchUnreadChatConversations } = useQuery<{ countUnreadChatConversations: number | null }>(
    COUNT_UNREAD_CHAT_CONVERSATIONS_QUERY,
    {
      skip: !session.authenticated,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first"
    }
  );

  const unreadNotificationsCount = unreadNotificationsData?.countUnreadNotifications ?? 0;
  const unreadChatCount = unreadChatData?.countUnreadChatConversations ?? 0;

  useAccountEventSignal(() => {
    void refetchBalance();
    void refetchUnreadNotifications();
    void refetchUnreadChatConversations();
  }, session.authenticated);

  useEffect(() => {
    if (!session.authenticated) {
      previousUnreadChatCountRef.current = null;
      setChatMessageToast(null);
      return;
    }

    const prev = previousUnreadChatCountRef.current;

    if (prev !== null && unreadChatCount > prev && !router.pathname.startsWith("/chat")) {
      void fetchLatestConversation({ variables: { limit: 5, offset: 0 } }).then(result => {
        const first = result.data?.listChatConversations.nodes.find(n => n.unreadCount > 0);
        if (!first) return;
        const senderName = first.otherAccountDisplayName ?? "?";
        const raw = first.lastMessagePreview ?? "";
        const preview = raw.length > 100 ? `${raw.slice(0, 100)}…` : raw;
        setChatMessageToast({
          senderName,
          preview,
          conversationKind: first.conversationKind,
          conversationId: first.conversationId
        });
      });
    }

    previousUnreadChatCountRef.current = unreadChatCount;
  }, [session.authenticated, unreadChatCount, router.pathname, fetchLatestConversation]);

  useEffect(() => {
    if (!session.authenticated) {
      previousUnreadNotificationsCountRef.current = null;
      setNotificationToast(null);
      return;
    }

    const previousUnreadNotificationsCount = previousUnreadNotificationsCountRef.current;

    if (previousUnreadNotificationsCount !== null && unreadNotificationsCount > previousUnreadNotificationsCount) {
      setNotificationToast(t("topbar.newNotification"));
    }

    previousUnreadNotificationsCountRef.current = unreadNotificationsCount;
  }, [session.authenticated, t, unreadNotificationsCount]);

  const currentLabel = useMemo(() => {
    return session.account?.displayName ?? session.account?.externalSubject ?? t("topbar.profileFallback");
  }, [session.account?.displayName, session.account?.externalSubject, t]);

  const links = useMemo(() => {
    if (!session.authenticated) {
      return signedOutLinks;
    }

    return signedInLinks;
  }, [session.authenticated]);

  const handleLogOut = async () => {
    setMenuAnchor(null);
    await signOut();
    await router.push("/resources");
  };

  const currentLanguage = i18n.language.toLowerCase().startsWith("en") ? "en" : "fr";

  const handleLanguageChange = (language: "en" | "fr") => {
    if (currentLanguage === language) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    void i18n.changeLanguage(language);
  };

  const handleChatToastClick = () => {
    if (!chatMessageToast) {
      return;
    }

    const destination = conversationThreadUrl(chatMessageToast.conversationKind, chatMessageToast.conversationId);
    setChatMessageToast(null);
    void router.push(destination);
  };

  const renderNavLabel = (link: { labelKey: string; href: string }) => {
    const badgeCount = link.href === "/notifications" ? unreadNotificationsCount : link.href === "/chat" ? unreadChatCount : 0;

    return (
      <Badge badgeContent={badgeCount} color="error" invisible={badgeCount === 0} overlap="circular">
        <Box component="span" sx={{ display: "inline-block", px: badgeCount > 0 ? 0.5 : 0 }}>
          {t(link.labelKey)}
        </Box>
      </Badge>
    );
  };

  return (
    <>
      <AppBar color="inherit" elevation={0} position="sticky" sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
          <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} spacing={2} sx={{ flex: 1 }}>
            <Typography component={NextLink} href="/" sx={{ color: "inherit", fontWeight: 700, textDecoration: "none" }} variant="h6">
              Mutuity
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1}>
              {links.map(link => (
                <Button
                  color="inherit"
                  component={NextLink}
                  href={link.href}
                  key={link.href}
                  size="small"
                  variant={router.pathname === link.href ? "contained" : "text"}
                >
                  {session.authenticated ? renderNavLabel(link) : t(link.labelKey)}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Stack alignItems="center" direction="row" spacing={1}>
            {session.authenticated ? (
              <>
                <Button color="inherit" component={NextLink} href="/contribution" size="small" variant="outlined">
                  {t("topbar.tokenBalance", { count: balanceData?.currentTokenBalance ?? 0 })}
                </Button>
                <Tooltip title={colorMode === "light" ? t("topbar.switchToDark") : t("topbar.switchToLight")}>
                  <IconButton aria-label={t("topbar.toggleColorMode")} color="inherit" onClick={onToggleColorMode}>
                    {colorMode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
                  </IconButton>
                </Tooltip>
                <AvatarIconButton
                  aria-label={t("topbar.openProfileMenu")}
                  displayName={currentLabel}
                  imageUrl={session.account?.avatarUrl ?? null}
                  onClick={event => setMenuAnchor(event.currentTarget)}
                />
              </>
            ) : (
              <>
                <Stack direction="row" spacing={0.5}>
                  {AVAILABLE_LANGUAGES.map(language => (
                    <Button
                      color="inherit"
                      key={language}
                      onClick={() => handleLanguageChange(language)}
                      size="small"
                      variant={currentLanguage === language ? "contained" : "outlined"}
                    >
                      {language.toUpperCase()}
                    </Button>
                  ))}
                </Stack>
                <Tooltip title={colorMode === "light" ? t("topbar.switchToDark") : t("topbar.switchToLight")}>
                  <IconButton aria-label={t("topbar.toggleColorMode")} color="inherit" onClick={onToggleColorMode}>
                    {colorMode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
                  </IconButton>
                </Tooltip>
                <AvatarIconButton
                  aria-label={t("topbar.openSignInDialog")}
                  displayName={t("topbar.signInFallback")}
                  onClick={() => setLoginDialogOpen(true)}
                />
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)} open={Boolean(menuAnchor)}>
        <MenuItem component={NextLink} href="/profile" onClick={() => setMenuAnchor(null)}>
          {currentLabel}
        </MenuItem>
        <MenuItem component={NextLink} href="/preferences" onClick={() => setMenuAnchor(null)}>
          {t("menu.preferences")}
        </MenuItem>
        <MenuItem component={NextLink} href="/contribution" onClick={() => setMenuAnchor(null)}>
          {t("menu.contribution")}
        </MenuItem>
        <MenuItem onClick={() => void handleLogOut()}>{t("menu.logOut")}</MenuItem>
      </Menu>

      <LoginDialog
        nextDestination={router.asPath}
        onClose={() => setLoginDialogOpen(false)}
        open={loginDialogOpen}
        subtitle={t("loginDialogSubtitle")}
      />

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={3500}
        onClose={() => setNotificationToast(null)}
        open={Boolean(notificationToast)}
      >
        <Alert onClose={() => setNotificationToast(null)} severity="info" variant="filled">
          {notificationToast}
        </Alert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        autoHideDuration={6000}
        onClose={() => setChatMessageToast(null)}
        open={Boolean(chatMessageToast)}
        sx={{
          "& .MuiPaper-root": {
            cursor: "pointer"
          }
        }}
      >
        <Alert
          onClick={handleChatToastClick}
          onClose={() => setChatMessageToast(null)}
          severity="info"
          sx={{
            bgcolor: "background.paper",
            borderColor: "divider",
            color: "text.primary",
            cursor: "pointer",
            "& .MuiAlert-icon": {
              color: "text.secondary"
            }
          }}
          variant="outlined"
        >
          <strong>{chatMessageToast?.senderName}</strong>
          {chatMessageToast ? `: ${chatMessageToast.preview}` : ""}
        </Alert>
      </Snackbar>
    </>
  );
}
