import NextLink from "next/link";
import { useQuery, useSubscription } from "@apollo/client/react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { LoginDialog } from "../auth/LoginDialog";
import { TOKEN_BALANCE_QUERY, TOKEN_BALANCE_SUBSCRIPTION } from "../contribution/contribution.queries";
import { AvatarIconButton } from "../ui/AvatarIconButton";
import type { AppColorMode } from "../../theme";

const signedOutLinks = [
  { labelKey: "nav.search", href: "/resources" },
  { labelKey: "nav.contribute", href: "/needs" }
];

const LANGUAGE_STORAGE_KEY = "mutuity-language";
const AVAILABLE_LANGUAGES = ["fr", "en"] as const;
const TOKEN_BALANCE_FALLBACK_POLL_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_TOKEN_BALANCE_POLL_INTERVAL_MS ?? 60000
);

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
  const { data: balanceData, refetch: refetchBalance } = useQuery<{ currentTokenBalance: number }>(TOKEN_BALANCE_QUERY, {
    pollInterval: session.authenticated ? TOKEN_BALANCE_FALLBACK_POLL_INTERVAL_MS : 0,
    skip: !session.authenticated
  });

  useSubscription(
    TOKEN_BALANCE_SUBSCRIPTION,
    {
      variables: { topic: `token_balance_${session.account?.id ?? ""}` },
      skip: !session.authenticated || !session.account?.id,
      onData: () => { void refetchBalance(); }
    }
  );

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
                  {t(link.labelKey)}
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
    </>
  );
}
