import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ACCOUNT_PROFILE_QUERY, UPDATE_ACCOUNT_PROFILE_MUTATION } from "../features/profile/profile.queries";
import { AvatarIconButton } from "../features/ui/AvatarIconButton";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";

type ProfileLinkType = "website" | "facebook" | "instagram" | "x";

type ProfileLink = {
  url: string;
  label: string;
  type: ProfileLinkType;
};

type AccountProfileData = {
  accountById: {
    id: string;
    displayName: string | null;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    profileLinks: ProfileLink[] | null;
  } | null;
};

const PROFILE_LINK_TYPE_OPTIONS: Array<{ value: ProfileLinkType; label: string }> = [
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" }
];

function createEmptyProfileLink(): ProfileLink {
  return {
    url: "",
    label: "",
    type: "website"
  };
}

export default function ProfilePage() {
  const { session, refreshSession } = useAuth();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const accountId = session.account?.id ?? null;
  const { data, loading, error, refetch } = useQuery<AccountProfileData>(ACCOUNT_PROFILE_QUERY, {
    skip: !accountId,
    variables: { accountId }
  });
  const [updateProfile, { loading: saving, error: saveError }] = useMutation(UPDATE_ACCOUNT_PROFILE_MUTATION);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(saveError);

  useEffect(() => {
    const profile = data?.accountById;

    if (!profile) {
      return;
    }

    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
    setProfileLinks(
      Array.isArray(profile.profileLinks)
        ? profile.profileLinks.map(link => ({
            url: typeof link?.url === "string" ? link.url : "",
            label: typeof link?.label === "string" ? link.label : "",
            type: link?.type === "facebook" || link?.type === "instagram" || link?.type === "x" ? link.type : "website"
          }))
        : []
    );
  }, [data?.accountById]);

  const handleSave = async () => {
    if (!accountId) {
      return;
    }

    setSuccessMessage(null);

    await updateProfile({
      variables: {
        accountId,
        patch: {
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          profileLinks: profileLinks
            .map(link => ({
              url: link.url.trim(),
              label: link.label.trim(),
              type: link.type
            }))
            .filter(link => link.url)
        }
      }
    });

    await Promise.all([refetch(), refreshSession()]);
    setSuccessMessage("Profile updated.");
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Profile
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              Profile
            </Typography>
            <Typography color="text.secondary">
              Complete your profile and unlock one-time Topes rewards for your first avatar, bio, location, and first added link.
            </Typography>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <AvatarIconButton displayName={displayName || session.account?.displayName} imageUrl={avatarUrl || null} size={72} />
                <Typography color="text.secondary" variant="body2">
                  Your avatar preview updates as you edit the profile image URL below.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {loading ? <Alert severity="info">Loading your profile…</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <TextField label="Display name" onChange={event => setDisplayName(event.target.value)} value={displayName} />
                <TextField
                  label="Bio"
                  minRows={3}
                  multiline
                  onChange={event => setBio(event.target.value)}
                  value={bio}
                />
                <TextField label="Location" onChange={event => setLocation(event.target.value)} value={location} />
                <TextField
                  label="Avatar image URL"
                  onChange={event => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                />

                <Stack spacing={1.5}>
                  <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="subtitle1">Profile links</Typography>
                    <Button onClick={() => setProfileLinks(current => [...current, createEmptyProfileLink()])} variant="outlined">
                      Add link
                    </Button>
                  </Stack>

                  {profileLinks.length === 0 ? (
                    <Alert severity="info">No profile links yet. Add a website or social link if you want to share one.</Alert>
                  ) : (
                    profileLinks.map((link, index) => (
                      <Card key={`profile-link-${index}`} variant="outlined">
                        <CardContent>
                          <Stack spacing={1.5}>
                            <TextField
                              select
                              label="Type"
                              onChange={event => {
                                const nextType = event.target.value as ProfileLinkType;
                                setProfileLinks(current =>
                                  current.map((item, itemIndex) => (itemIndex === index ? { ...item, type: nextType } : item))
                                );
                              }}
                              value={link.type}
                            >
                              {PROFILE_LINK_TYPE_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label="Caption"
                              onChange={event => {
                                const nextLabel = event.target.value;
                                setProfileLinks(current =>
                                  current.map((item, itemIndex) => (itemIndex === index ? { ...item, label: nextLabel } : item))
                                );
                              }}
                              placeholder="e.g. Main website"
                              value={link.label}
                            />
                            <TextField
                              label="URL"
                              onChange={event => {
                                const nextUrl = event.target.value;
                                setProfileLinks(current =>
                                  current.map((item, itemIndex) => (itemIndex === index ? { ...item, url: nextUrl } : item))
                                );
                              }}
                              placeholder="https://example.com"
                              value={link.url}
                            />
                            <Stack direction="row" justifyContent="flex-end">
                              <Button
                                color="error"
                                onClick={() => setProfileLinks(current => current.filter((_, itemIndex) => itemIndex !== index))}
                              >
                                Remove link
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <Button disabled={saving || loading} onClick={() => void handleSave()} variant="contained">
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
}
