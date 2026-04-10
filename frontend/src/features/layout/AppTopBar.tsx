import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
import { AppBar, Box, Button, Menu, MenuItem, Stack, Toolbar, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import { LoginDialog } from "../auth/LoginDialog";
import { TOKEN_BALANCE_QUERY } from "../contribution/contribution.queries";
import { AvatarIconButton } from "../ui/AvatarIconButton";

const signedOutLinks = [{ label: "Search", href: "/resources" }];

const signedInLinks = [
  { label: "Search", href: "/resources" },
  { label: "Contribute", href: "/needs" },
  { label: "Resources", href: "/resources/manage" },
  { label: "Bids", href: "/bids" },
  { label: "Needs", href: "/needs/manage" },
  { label: "Claims", href: "/claims" },
  { label: "Chat", href: "/chat" },
  { label: "Notifications", href: "/notifications" }
];

export function AppTopBar() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { data: balanceData } = useQuery<{ currentTokenBalance: number }>(TOKEN_BALANCE_QUERY, {
    pollInterval: session.authenticated ? 15000 : 0,
    skip: !session.authenticated
  });

  const currentLabel = useMemo(() => {
    return session.account?.displayName ?? session.account?.externalSubject ?? "Profile";
  }, [session.account?.displayName, session.account?.externalSubject]);

  const links = session.authenticated ? signedInLinks : signedOutLinks;

  const handleLogOut = async () => {
    setMenuAnchor(null);
    await signOut();
    await router.push("/resources");
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
                  {link.label}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Stack alignItems="center" direction="row" spacing={1}>
            {session.authenticated ? (
              <>
                <Button color="inherit" component={NextLink} href="/contribution" size="small" variant="outlined">
                  {balanceData?.currentTokenBalance ?? 0} tokens
                </Button>
                <AvatarIconButton
                  aria-label="Open profile menu"
                  displayName={currentLabel}
                  imageUrl={session.account?.avatarUrl ?? null}
                  onClick={event => setMenuAnchor(event.currentTarget)}
                />
              </>
            ) : (
              <AvatarIconButton
                aria-label="Open sign in dialog"
                displayName="Sign in"
                onClick={() => setLoginDialogOpen(true)}
              />
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)} open={Boolean(menuAnchor)}>
        <MenuItem component={NextLink} href="/profile" onClick={() => setMenuAnchor(null)}>
          {currentLabel}
        </MenuItem>
        <MenuItem component={NextLink} href="/preferences" onClick={() => setMenuAnchor(null)}>
          Preferences
        </MenuItem>
        <MenuItem component={NextLink} href="/contribution" onClick={() => setMenuAnchor(null)}>
          Contribution
        </MenuItem>
        <MenuItem onClick={() => void handleLogOut()}>Log out</MenuItem>
      </Menu>

      <LoginDialog
        nextDestination={router.asPath}
        onClose={() => setLoginDialogOpen(false)}
        open={loginDialogOpen}
        subtitle="Connect to access bids, claims, chat, and your account workspace."
      />
    </>
  );
}
