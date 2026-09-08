import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  FormFieldLabel,
  FormTextInput,
  ImagePickerField,
  PrimaryButton,
  ProximityLocationEditor,
  type ProximityLocationValue,
  ScreenContainer,
  ThemedDialog
} from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAuth } from "../../services/auth/AuthProvider";
import { fetchMyProfile, updateMyProfile } from "../../services/graphql/profile";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { NeedIntensity } from "../../services/graphql/generated";

export interface PublicProfileLink {
  type: "website" | "facebook" | "instagram" | "x";
  label: string;
  url: string;
}

export interface PublicProfileResource {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  createdAt: string | null;
  canBeExchanged: boolean;
  canBeGifted: boolean;
}

export interface PublicProfileNeed {
  id: string;
  title: string;
  description: string;
  proposedTokenAmount: number;
  intensity: NeedIntensity;
}

export interface MyProfileRecord {
  accountId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  location: ProximityLocationValue | null;
  bio: string;
  profileLinks?: PublicProfileLink[];
  resources?: PublicProfileResource[];
  needs?: PublicProfileNeed[];
}

const PROFILE_LINK_TYPES: ReadonlyArray<PublicProfileLink["type"]> = ["website", "facebook", "instagram", "x"];
const PROFILE_LINK_TYPE_ICONS: Record<PublicProfileLink["type"], string> = {
  website: "web",
  facebook: "facebook",
  instagram: "instagram",
  x: "twitter"
};

const EMPTY_PROFILE_LINK_DRAFT: PublicProfileLink = {
  type: "website",
  label: "",
  url: ""
};

export interface MyProfileScreenProps {
  accountId?: string | null;
  profile?: MyProfileRecord | null;
  loading?: boolean;
  errorMessage?: string | null;
  saving?: boolean;
  onRetry?: () => void;
  onBack?: () => void;
  onSaveProfile?: (profilePatch: Pick<MyProfileRecord, "displayName" | "location" | "bio" | "profileLinks"> & { avatarUrl?: string | null }) => void;
  onOpenChangePassword?: () => void;
  onOpenPreferences?: () => void;
  onOpenContribution?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export function MyProfileScreen({
  accountId = null,
  profile,
  loading = false,
  errorMessage = null,
  saving = false,
  onRetry,
  onBack,
  onSaveProfile,
  onOpenChangePassword,
  onOpenPreferences,
  onOpenContribution,
  onLogout,
  onDeleteAccount
}: MyProfileScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const [remoteProfile, setRemoteProfile] = useState<MyProfileRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const resolvedProfile = profile ?? remoteProfile;

  const [displayName, setDisplayName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [location, setLocation] = useState<ProximityLocationValue | null>(null);
  const [bio, setBio] = useState("");
  const [profileLinks, setProfileLinks] = useState<PublicProfileLink[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [linkToDeleteIndex, setLinkToDeleteIndex] = useState<number | null>(null);
  const [profileLinkDraft, setProfileLinkDraft] = useState<PublicProfileLink>(EMPTY_PROFILE_LINK_DRAFT);
  const [linkEditorVisible, setLinkEditorVisible] = useState(false);
  const [linkEditorError, setLinkEditorError] = useState<string | null>(null);

  const withRequiredMark = (label: string): string => `${label} *`;

  const hasInjectedProfile = profile !== undefined;

  const closeLinkEditor = (): void => {
    setLinkEditorVisible(false);
    setEditingLinkIndex(null);
    setProfileLinkDraft(EMPTY_PROFILE_LINK_DRAFT);
    setLinkEditorError(null);
  };

  const hasValidHttpUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const openCreateLinkEditor = (): void => {
    setEditingLinkIndex(null);
    setProfileLinkDraft(EMPTY_PROFILE_LINK_DRAFT);
    setLinkEditorError(null);
    setLinkEditorVisible(true);
  };

  const openEditLinkEditor = (index: number): void => {
    const currentLink = profileLinks[index];
    if (!currentLink) {
      return;
    }

    setEditingLinkIndex(index);
    setProfileLinkDraft(currentLink);
    setLinkEditorError(null);
    setLinkEditorVisible(true);
  };

  const upsertDraftLink = (): void => {
    const normalizedUrl = profileLinkDraft.url.trim();
    if (!normalizedUrl || !hasValidHttpUrl(normalizedUrl)) {
      setLinkEditorError(t("mustBeWellFormedURL", { defaultValue: "Please enter a valid URL." }));
      return;
    }

    const nextLink: PublicProfileLink = {
      ...profileLinkDraft,
      label: profileLinkDraft.label.trim(),
      url: normalizedUrl
    };

    setProfileLinks((currentLinks) => {
      if (editingLinkIndex === null) {
        return [...currentLinks, nextLink];
      }

      return currentLinks.map((link, index) => (index === editingLinkIndex ? nextLink : link));
    });
    closeLinkEditor();
  };

  const removeLink = (indexToRemove: number): void => {
    setProfileLinks((currentLinks) => currentLinks.filter((_link, index) => index !== indexToRemove));
  };

  const loadProfile = useCallback(async (): Promise<void> => {
    if (hasInjectedProfile || !accountId) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      const nextProfile = await fetchMyProfile(accountId);
      setRemoteProfile(nextProfile);
      setDisplayName(nextProfile?.displayName ?? "");
      setAvatarUri(nextProfile?.avatarUrl ?? null);
      setLocation(nextProfile?.location ?? null);
      setBio(nextProfile?.bio ?? "");
      setProfileLinks(nextProfile?.profileLinks ?? []);
    } catch {
      setRemoteErrorMessage(t("profileLoadError", { defaultValue: "We could not load your profile." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [accountId, hasInjectedProfile, t]);

  useEffect(() => {
    if (resolvedProfile) {
      setDisplayName(resolvedProfile.displayName);
      setAvatarUri(resolvedProfile.avatarUrl ?? null);
      setLocation(resolvedProfile.location ?? null);
      setBio(resolvedProfile.bio);
      setProfileLinks(resolvedProfile.profileLinks ?? []);
    }
  }, [resolvedProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canSave = useMemo(() => displayName.trim().length > 0, [displayName]);

  const handleSave = (): void => {
    setHasAttemptedSubmit(true);

    if (!canSave) {
      setFeedback(t("fieldRequired", { defaultValue: "Title is required." }));
      return;
    }

    if (onSaveProfile) {
      onSaveProfile({
        displayName: displayName.trim(),
        location,
        bio: bio.trim(),
        profileLinks,
        avatarUrl: avatarUri
      });
      setFeedback(t("profileSaved", { defaultValue: "Profile saved." }));
      return;
    }

    if (!accountId) {
      return;
    }

    setRemoteLoading(true);
    void updateMyProfile(accountId, {
      displayName: displayName.trim(),
      location,
      bio: bio.trim(),
      profileLinks,
      avatarUrl: avatarUri
    })
      .then(async (updatedProfile) => {
        setRemoteProfile(updatedProfile);
        await refreshSession();
        setFeedback(t("profileSaved", { defaultValue: "Profile saved." }));
      })
      .catch(() => {
        setRemoteErrorMessage(t("profileSaveError", { defaultValue: "We could not save your profile changes." }));
      })
      .finally(() => {
        setRemoteLoading(false);
      });
  };

  const resolvedLoading = loading || (!hasInjectedProfile && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedProfile ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return <LoadingState label={t("profileLoading", { defaultValue: "Loading profile..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} {...(onRetry ? { onRetry } : { onRetry: () => void loadProfile() })} />;
  }

  return (
    <ScreenContainer testID="my-profile-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {t("myProfileTitle", { defaultValue: "My profile" })}
        </Text>
        {onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <FormTextInput
          label={withRequiredMark(t("fullNameLabel", { defaultValue: "Full name" }))}
          accessibilityLabel={t("fullNameLabel", { defaultValue: "Full name" })}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <FormTextInput
          label={t("emailLabel", { defaultValue: "Email" })}
          accessibilityLabel={t("emailLabel", { defaultValue: "Email" })}
          value={resolvedProfile?.email ?? ""}
          editable={false}
        />

        <ImagePickerField
          label={t("avatarLabel", { defaultValue: "Profile picture" })}
          accessibilityLabel={t("avatarLabel", { defaultValue: "Profile picture" })}
          imageUri={avatarUri}
          onChange={setAvatarUri}
          addFromCameraLabel={t("addFromCameraLabel", { defaultValue: "Take photo" })}
          addFromLibraryLabel={t("addFromLibraryLabel", { defaultValue: "Pick from library" })}
        />

        <FormFieldLabel style={styles.sectionLabel}>{t("locationLabel", { defaultValue: "Location" })}</FormFieldLabel>
        <ProximityLocationEditor value={location} onChange={setLocation} />

        <FormTextInput
          label={t("bioLabel", { defaultValue: "Bio" })}
          accessibilityLabel={t("bioLabel", { defaultValue: "Bio" })}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <View style={styles.linksSection}>
          <View style={styles.linksSectionHeader}>
            <FormFieldLabel style={styles.sectionLabel}>{t("linksLabel", { defaultValue: "Links" })}</FormFieldLabel>
            <Button testID="profile-link-add" mode="text" icon="plus" onPress={openCreateLinkEditor}>
              {t("addLinkButtonCaption", { defaultValue: "Add link" })}
            </Button>
          </View>

          {profileLinks.length === 0 ? (
            <Text style={styles.secondaryNoteText}>{t("noLinksLabel", { defaultValue: "No links yet." })}</Text>
          ) : (
            <View style={styles.linksList}>
              {profileLinks.map((link, index) => (
                <View key={`${link.type}-${link.url}-${index}`} style={styles.linkRow}>
                  <IconButton icon={PROFILE_LINK_TYPE_ICONS[link.type]} size={18} />
                  <View style={styles.linkTextZone}>
                    <Text style={styles.linkLabelText}>{link.label.trim() || link.url}</Text>
                    <Text style={styles.linkUrlText}>{link.url}</Text>
                  </View>
                  <IconButton
                    icon="pencil"
                    accessibilityLabel={t("editLabel", { defaultValue: "Edit" })}
                    onPress={() => openEditLinkEditor(index)}
                  />
                  <IconButton
                    icon="delete-outline"
                    accessibilityLabel={t("deleteLabel", { defaultValue: "Delete" })}
                    onPress={() => setLinkToDeleteIndex(index)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {hasAttemptedSubmit && !canSave ? (
          <Text style={styles.warningText}>{t("fieldRequired", { defaultValue: "Title is required." })}</Text>
        ) : null}

        <PrimaryButton
          label={t("saveLabel", { defaultValue: "Save" })}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />

        <View style={styles.actionsZone}>
          <PrimaryButton
            label={t("changePasswordLabel", { defaultValue: "Change password" })}
            onPress={() => {
              if (onOpenChangePassword) {
                onOpenChangePassword();
              }
            }}
          />

          {onOpenPreferences ? (
            <PrimaryButton
              label={t("myPreferencesTitle", { defaultValue: "My preferences" })}
              onPress={() => {
                onOpenPreferences();
              }}
            />
          ) : null}

          {onOpenContribution ? (
            <PrimaryButton
              label={t("contributionLabel", { defaultValue: "Contribution" })}
              onPress={() => {
                onOpenContribution();
              }}
            />
          ) : null}

          <PrimaryButton
            label={t("logoutLabel", { defaultValue: "Logout" })}
            onPress={() => {
              if (onLogout) {
                onLogout();
              }
            }}
          />

          <PrimaryButton
            label={t("deleteAccountLabel", { defaultValue: "Delete account" })}
            onPress={() => {
              if (onDeleteAccount) {
                onDeleteAccount();
              }
            }}
          />
        </View>
      </ScrollView>

      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>
        {feedback ?? ""}
      </Snackbar>

      <ThemedDialog
        visible={linkEditorVisible}
        title={editingLinkIndex === null ? t("addLinkButtonCaption", { defaultValue: "Add link" }) : t("editLabel", { defaultValue: "Edit" })}
        onDismiss={closeLinkEditor}
        content={(
          <View style={styles.linkEditorContent}>
            <View style={styles.linkTypeRow}>
              {PROFILE_LINK_TYPES.map((type) => {
                const isSelected = profileLinkDraft.type === type;

                return (
                  <IconButton
                    key={type}
                    icon={PROFILE_LINK_TYPE_ICONS[type]}
                    mode={isSelected ? "contained" : "outlined"}
                    accessibilityLabel={t(`linkType.${type}`, { defaultValue: type })}
                    onPress={() => {
                      setProfileLinkDraft((current) => ({ ...current, type }));
                    }}
                  />
                );
              })}
            </View>

            <FormTextInput
              label={t("linkLabelLabel", { defaultValue: "Label" })}
              accessibilityLabel={t("linkLabelLabel", { defaultValue: "Label" })}
              value={profileLinkDraft.label}
              onChangeText={(value) => {
                setProfileLinkDraft((current) => ({ ...current, label: value }));
                setLinkEditorError(null);
              }}
            />

            <FormTextInput
              label={t("linkUrlLabel", { defaultValue: "URL" })}
              accessibilityLabel={t("linkUrlLabel", { defaultValue: "URL" })}
              value={profileLinkDraft.url}
              onChangeText={(value) => {
                setProfileLinkDraft((current) => ({ ...current, url: value }));
                setLinkEditorError(null);
              }}
              autoCapitalize="none"
              keyboardType="url"
            />

            {linkEditorError ? <Text style={styles.warningText}>{linkEditorError}</Text> : null}
          </View>
        )}
        actions={[
          <Button key="cancel" testID="profile-link-editor-cancel" mode="outlined" onPress={closeLinkEditor}>
            {t("cancelLabel", { defaultValue: "Cancel" })}
          </Button>,
          <Button key="save" testID="profile-link-editor-save" mode="contained" onPress={upsertDraftLink}>
            {t("saveLabel", { defaultValue: "Save" })}
          </Button>
        ]}
      />

      <ThemedDialog
        visible={linkToDeleteIndex !== null}
        title={t("confirmLinkDeletionTitle", { defaultValue: "Delete link?" })}
        onDismiss={() => setLinkToDeleteIndex(null)}
        content={(
          <Text style={styles.secondaryNoteText}>
            {t("confirmLinkDeletionBody", { defaultValue: "This link will be removed from your profile." })}
          </Text>
        )}
        actions={[
          <Button key="cancel" testID="profile-link-delete-cancel" mode="outlined" onPress={() => setLinkToDeleteIndex(null)}>
            {t("cancelLabel", { defaultValue: "Cancel" })}
          </Button>,
          <Button
            key="delete"
            testID="profile-link-delete-confirm"
            mode="contained"
            onPress={() => {
              if (linkToDeleteIndex !== null) {
                removeLink(linkToDeleteIndex);
              }
              setLinkToDeleteIndex(null);
            }}
          >
            {t("deleteLabel", { defaultValue: "Delete" })}
          </Button>
        ]}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  warningText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 12
  },
  sectionLabel: {
    marginBottom: 2
  },
  linksSection: {
    gap: designTokens.spacing.xs
  },
  linksSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  linksList: {
    gap: designTokens.spacing.xs
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    borderRadius: designTokens.radius.sm,
    backgroundColor: designTokens.colors.secondary,
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 2
  },
  linkTextZone: {
    flex: 1,
    gap: 2
  },
  linkLabelText: {
    fontFamily: appFontFamilies.altGeneral
  },
  linkUrlText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  secondaryNoteText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  linkEditorContent: {
    gap: designTokens.spacing.xs
  },
  linkTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  actionsZone: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.sm
  }
});
