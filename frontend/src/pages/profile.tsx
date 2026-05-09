import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Avatar, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ACCOUNT_PROFILE_QUERY, UPDATE_ACCOUNT_PROFILE_MUTATION } from "../features/profile/profile.queries";
import { LocationPicker } from "../components/LocationPicker";
import { ImageUploadField } from "../components/ImageUploadField";
import { ZoomableImage } from "../components/ZoomableImage";
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
    latitude: number | null;
    longitude: number | null;
    avatarUrl: string | null;
    preferredLanguage: "en" | "fr" | null;
    profileLinks: ProfileLink[] | null;
  } | null;
};

type PreferredLanguage = "en" | "fr";

const PROFILE_LINK_TYPE_OPTIONS: Array<{ value: ProfileLinkType; label: string }> = [
  { value: "website", label: "linkTypes.website" },
  { value: "facebook", label: "linkTypes.facebook" },
  { value: "instagram", label: "linkTypes.instagram" },
  { value: "x", label: "linkTypes.x" }
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
  const { t, i18n } = useTranslation("profile");
  const accountId = session.account?.id ?? null;
  const { data, loading, error, refetch } = useQuery<AccountProfileData>(ACCOUNT_PROFILE_QUERY, {
    skip: !accountId,
    variables: { accountId }
  });
  const [updateProfile, { loading: saving, error: saveError }] = useMutation(UPDATE_ACCOUNT_PROFILE_MUTATION);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number>(50.6072);
  const [longitude, setLongitude] = useState<number>(3.3889);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>("fr");
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
    setLatitude(profile.latitude ?? 50.6072);
    setLongitude(profile.longitude ?? 3.3889);
    setAvatarUrl(profile.avatarUrl ?? "");
    setPreferredLanguage(profile.preferredLanguage === "en" ? "en" : "fr");
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
          latitude,
          longitude,
          avatarUrl: avatarUrl.trim() || null,
          preferredLanguage,
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

    if (i18n.language !== preferredLanguage) {
      void i18n.changeLanguage(preferredLanguage);
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("mutuity-language", preferredLanguage);
    }

    await Promise.all([refetch(), refreshSession()]);
    setSuccessMessage(t("successUpdated"));
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
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
              {t("title")}
            </Typography>
            <Typography color="text.secondary">
              {t("subtitle")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {avatarUrl ? (
              <ZoomableImage
                alt={displayName || session.account?.displayName || "Profile avatar"}
                src={avatarUrl}
                sx={{
                  borderRadius: "50%",
                  height: 300,
                  maxHeight: "min(300px, 75vw)",
                  maxWidth: "min(300px, 75vw)",
                  objectFit: "cover",
                  width: 300
                }}
              />
            ) : (
              <Avatar
                alt={displayName || session.account?.displayName || "Profile avatar"}
                sx={{ height: 300, width: 300 }}
              />
            )}
          </Box>

          {loading ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <TextField label={t("fields.displayName")} onChange={event => setDisplayName(event.target.value)} value={displayName} />
                <TextField
                  label={t("fields.bio")}
                  minRows={3}
                  multiline
                  onChange={event => setBio(event.target.value)}
                  value={bio}
                />
                <LocationPicker
                  value={{
                    address: location,
                    latitude,
                    longitude
                  }}
                  addressLabel={t("fields.location")}
                  onChange={(loc) => {
                    setLocation(loc.address);
                    setLatitude(loc.latitude);
                    setLongitude(loc.longitude);
                  }}
                />
                <TextField
                  select
                  label={t("fields.language")}
                  onChange={event => {
                    const nextLanguage = event.target.value === "en" ? "en" : "fr";
                    setPreferredLanguage(nextLanguage);
                  }}
                  value={preferredLanguage}
                >
                  <MenuItem value="fr">{t("languages.fr")}</MenuItem>
                  <MenuItem value="en">{t("languages.en")}</MenuItem>
                </TextField>

                <ImageUploadField
                  imageUrls={avatarUrl ? [avatarUrl] : []}
                  showExistingImages={false}
                  onImageAdded={(url) => {
                    setAvatarUrl(url);
                  }}
                  onImageRemoved={() => {
                    setAvatarUrl("");
                  }}
                />

                <Stack spacing={1.5}>
                  <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="subtitle1">{t("profileLinksTitle")}</Typography>
                    <Button onClick={() => setProfileLinks(current => [...current, createEmptyProfileLink()])} variant="outlined">
                      {t("addLink")}
                    </Button>
                  </Stack>

                  {profileLinks.length === 0 ? (
                    <Alert severity="info">{t("noLinksYet")}</Alert>
                  ) : (
                    profileLinks.map((link, index) => (
                      <Card key={`profile-link-${index}`} variant="outlined">
                        <CardContent>
                          <Stack spacing={1.5}>
                            <TextField
                              select
                              label={t("fields.linkType")}
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
                                  {t(option.label)}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label={t("fields.caption")}
                              onChange={event => {
                                const nextLabel = event.target.value;
                                setProfileLinks(current =>
                                  current.map((item, itemIndex) => (itemIndex === index ? { ...item, label: nextLabel } : item))
                                );
                              }}
                              placeholder={t("fields.captionPlaceholder")}
                              value={link.label}
                            />
                            <TextField
                              label={t("fields.url")}
                              onChange={event => {
                                const nextUrl = event.target.value;
                                setProfileLinks(current =>
                                  current.map((item, itemIndex) => (itemIndex === index ? { ...item, url: nextUrl } : item))
                                );
                              }}
                              placeholder={t("fields.urlPlaceholder")}
                              value={link.url}
                            />
                            <Stack direction="row" justifyContent="flex-end">
                              <Button
                                color="error"
                                onClick={() => setProfileLinks(current => current.filter((_, itemIndex) => itemIndex !== index))}
                              >
                                {t("removeLink")}
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
                    {saving ? t("savingButton") : t("saveButton")}
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
