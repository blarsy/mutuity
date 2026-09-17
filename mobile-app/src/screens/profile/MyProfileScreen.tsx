import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Checkbox, IconButton, Snackbar, Text } from "react-native-paper";
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
import { MyHubScreenHeader } from "../../components/MyHubScreenHeader";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAuth } from "../../services/auth/AuthProvider";
import { deleteMyAccount, fetchCurrentAccountEmail, fetchMyProfile, requestAccountEmailChange, updateMyProfile, changeAccountPassword } from "../../services/graphql/profile";
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
  onRequestEmailChange?: (newEmail: string) => Promise<void> | void;
  onChangePassword?: (input: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  onOpenChangePassword?: () => void;
  onOpenPreferences?: () => void;
  onOpenContribution?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onOpenDrawer?: () => void;
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
  onRequestEmailChange,
  onChangePassword,
  onOpenChangePassword,
  onOpenPreferences,
  onOpenContribution,
  onLogout,
  onDeleteAccount,
  onOpenDrawer
}: MyProfileScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { refreshSession, signOut } = useAuth();
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
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSubmitting, setEmailChangeSubmitting] = useState(false);
  const [pendingEmailChangeAddress, setPendingEmailChangeAddress] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [changePasswordDialogVisible, setChangePasswordDialogVisible] = useState(false);
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState("");
  const [newPasswordDraft, setNewPasswordDraft] = useState("");
  const [confirmPasswordDraft, setConfirmPasswordDraft] = useState("");
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [currentPasswordFieldError, setCurrentPasswordFieldError] = useState<string | null>(null);
  const [newPasswordFieldError, setNewPasswordFieldError] = useState<string | null>(null);
  const [confirmPasswordFieldError, setConfirmPasswordFieldError] = useState<string | null>(null);

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
      const [nextProfile, nextEmail] = await Promise.all([fetchMyProfile(accountId), fetchCurrentAccountEmail()]);
      setRemoteProfile(nextProfile);
      setDisplayName(nextProfile?.displayName ?? "");
      setAvatarUri(nextProfile?.avatarUrl ?? null);
      setLocation(nextProfile?.location ?? null);
      setBio(nextProfile?.bio ?? "");
      setProfileLinks(nextProfile?.profileLinks ?? []);
      setCurrentEmail(nextEmail ?? "");
      setEmailDraft(nextEmail ?? "");
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

      if (hasInjectedProfile) {
        setCurrentEmail(resolvedProfile.email);
        setEmailDraft(resolvedProfile.email);
      }
    }
  }, [hasInjectedProfile, resolvedProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canSave = useMemo(() => displayName.trim().length > 0, [displayName]);

  const hasValidEmailFormat = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const canRequestEmailChange = useMemo(() => {
    const trimmedDraft = emailDraft.trim();
    return trimmedDraft.length > 0 && trimmedDraft.toLowerCase() !== currentEmail.trim().toLowerCase() && hasValidEmailFormat(trimmedDraft);
  }, [currentEmail, emailDraft]);

  const handleRequestEmailChange = (): void => {
    const trimmedDraft = emailDraft.trim();

    if (!hasValidEmailFormat(trimmedDraft)) {
      setEmailChangeError(t("mustBeValidEmail", { defaultValue: "Please enter a valid email address." }));
      return;
    }

    setEmailChangeError(null);
    setEmailChangeSubmitting(true);

    const request = onRequestEmailChange ? onRequestEmailChange(trimmedDraft) : requestAccountEmailChange(trimmedDraft);

    void Promise.resolve(request)
      .then(() => {
        setPendingEmailChangeAddress(trimmedDraft);
        setEmailDraft(currentEmail);
        setFeedback(
          t("emailChangeRequested", {
            defaultValue: "Check {{email}} to confirm your new email address.",
            email: trimmedDraft
          })
        );
      })
      .catch(() => {
        setEmailChangeError(t("emailChangeError", { defaultValue: "We could not start this email change. Please try again." }));
      })
      .finally(() => {
        setEmailChangeSubmitting(false);
      });
  };

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

  const handleDeleteAccount = (): void => {
    setDeleting(true);
    setDeleteErrorMessage(null);

    const request = onDeleteAccount ? Promise.resolve(onDeleteAccount()) : deleteMyAccount();

    void request
      .then(async () => {
        setDeleteDialogVisible(false);
        if (onLogout) {
          onLogout();
        } else {
          await signOut();
        }
      })
      .catch(() => {
        setDeleteErrorMessage(t("deleteAccountError", { defaultValue: "We could not delete your account. Please try again." }));
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  const openChangePasswordDialog = (): void => {
    setCurrentPasswordDraft("");
    setNewPasswordDraft("");
    setConfirmPasswordDraft("");
    setChangePasswordError(null);
    setCurrentPasswordFieldError(null);
    setNewPasswordFieldError(null);
    setConfirmPasswordFieldError(null);
    setChangePasswordDialogVisible(true);
    if (onOpenChangePassword) {
      onOpenChangePassword();
    }
  };

  const closeChangePasswordDialog = (): void => {
    setChangePasswordDialogVisible(false);
    setCurrentPasswordDraft("");
    setNewPasswordDraft("");
    setConfirmPasswordDraft("");
    setChangePasswordError(null);
    setCurrentPasswordFieldError(null);
    setNewPasswordFieldError(null);
    setConfirmPasswordFieldError(null);
  };

  const handleChangePasswordSubmit = (): void => {
    let hasError = false;
    setCurrentPasswordFieldError(null);
    setNewPasswordFieldError(null);
    setConfirmPasswordFieldError(null);
    setChangePasswordError(null);

    if (!currentPasswordDraft.trim()) {
      setCurrentPasswordFieldError(t("fieldRequired", { defaultValue: "This field is required." }));
      hasError = true;
    }

    if (!newPasswordDraft) {
      setNewPasswordFieldError(t("fieldRequired", { defaultValue: "This field is required." }));
      hasError = true;
    } else if (newPasswordDraft.length < 8) {
      setNewPasswordFieldError(t("passwordTooShort", { defaultValue: "Password must be at least 8 characters." }));
      hasError = true;
    }

    if (!confirmPasswordDraft) {
      setConfirmPasswordFieldError(t("fieldRequired", { defaultValue: "This field is required." }));
      hasError = true;
    } else if (confirmPasswordDraft !== newPasswordDraft) {
      setConfirmPasswordFieldError(t("passwordMismatch", { defaultValue: "Passwords do not match." }));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setChangePasswordSubmitting(true);
    const request = onChangePassword
      ? Promise.resolve(onChangePassword({ currentPassword: currentPasswordDraft, newPassword: newPasswordDraft }))
      : changeAccountPassword({ currentPassword: currentPasswordDraft, newPassword: newPasswordDraft });

    void request
      .then(() => {
        closeChangePasswordDialog();
        setFeedback(t("changePasswordSuccess", { defaultValue: "Password changed successfully." }));
      })
      .catch((err: unknown) => {
        const fallbackMsg = t("changePasswordError", {
          defaultValue: "We could not change your password. Please verify your current password and try again."
        });
        const errorMsg = err instanceof Error && err.message ? err.message : fallbackMsg;
        setChangePasswordError(errorMsg);
      })
      .finally(() => {
        setChangePasswordSubmitting(false);
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
      <MyHubScreenHeader
        title={t("myProfileTitle", { defaultValue: "My profile" })}
        onOpenDrawer={onOpenDrawer}
        right={onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : undefined}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <FormTextInput
          label={withRequiredMark(t("fullNameLabel", { defaultValue: "Full name" }))}
          accessibilityLabel={t("fullNameLabel", { defaultValue: "Full name" })}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <FormTextInput
          label={t("emailLabel", { defaultValue: "Email" })}
          accessibilityLabel={t("emailLabel", { defaultValue: "Email" })}
          value={emailDraft}
          onChangeText={(value) => {
            setEmailDraft(value);
            setEmailChangeError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {emailChangeError ? <Text style={styles.warningText}>{emailChangeError}</Text> : null}

        {canRequestEmailChange ? (
          <Button
            testID="email-change-request"
            mode="outlined"
            onPress={handleRequestEmailChange}
            loading={emailChangeSubmitting}
            disabled={emailChangeSubmitting}
          >
            {t("sendEmailConfirmationButton", { defaultValue: "Send confirmation link" })}
          </Button>
        ) : null}

        {pendingEmailChangeAddress ? (
          <Text testID="email-change-pending-note" style={styles.secondaryNoteText}>
            {t("emailChangePendingNote", {
              defaultValue: "Check {{email}} to confirm your new email address. Your current email stays active until then.",
              email: pendingEmailChangeAddress
            })}
          </Text>
        ) : null}

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

        <View style={styles.actionsZone}>
          <Button
            testID="change-password-button"
            mode="outlined"
            icon="lock-check"
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            onPress={openChangePasswordDialog}
          >
            {t("changePasswordLabel", { defaultValue: "Change password" })}
          </Button>

          {onOpenPreferences ? (
            <Button
              mode="outlined"
              style={styles.secondaryButton}
              labelStyle={styles.secondaryButtonLabel}
              onPress={() => {
                onOpenPreferences();
              }}
            >
              {t("myPreferencesTitle", { defaultValue: "My preferences" })}
            </Button>
          ) : null}

          {onOpenContribution ? (
            <Button
              mode="outlined"
              style={styles.secondaryButton}
              labelStyle={styles.secondaryButtonLabel}
              onPress={() => {
                onOpenContribution();
              }}
            >
              {t("contributionLabel", { defaultValue: "Contribution" })}
            </Button>
          ) : null}

          <Button
            mode="outlined"
            icon="logout"
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            onPress={() => {
              if (onLogout) {
                onLogout();
              }
            }}
          >
            {t("logoutLabel", { defaultValue: "Logout" })}
          </Button>

          <Button
            mode="outlined"
            icon="delete-forever"
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            onPress={() => {
              setDeleteConfirmChecked(false);
              setDeleteErrorMessage(null);
              setDeleteDialogVisible(true);
            }}
          >
            {t("deleteAccountLabel", { defaultValue: "Delete account" })}
          </Button>
        </View>
      </ScrollView>

      <View style={styles.saveFooter}>
        <PrimaryButton
          label={t("saveLabel", { defaultValue: "Save" })}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </View>

      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>
        {feedback ?? ""}
      </Snackbar>

      <ThemedDialog
        visible={deleteDialogVisible}
        title={t("deleteAccountDialogTitle", { defaultValue: "Delete your account?" })}
        onDismiss={() => {
          if (!deleting) {
            setDeleteDialogVisible(false);
          }
        }}
        content={(
          <View style={styles.deleteDialogContent}>
            <Text style={styles.secondaryNoteText}>
              {t("deleteAccountDialogDescription", {
                defaultValue: "This will permanently delete your account. Please review what happens next before confirming."
              })}
            </Text>
            <Text style={styles.deleteDialogBulletText}>
              {`\u2022 ${t("deleteAccountConsequenceSignOut", { defaultValue: "You will be signed out immediately." })}`}
            </Text>
            <Text style={styles.deleteDialogBulletText}>
              {`\u2022 ${t("deleteAccountConsequenceAnonymization", { defaultValue: "Your personal data will be anonymized." })}`}
            </Text>
            <Text style={styles.deleteDialogBulletText}>
              {`\u2022 ${t("deleteAccountConsequenceIrreversible", { defaultValue: "This action cannot be undone." })}`}
            </Text>
            <Checkbox.Item
              label={t("deleteAccountConfirmLabel", { defaultValue: "I understand, delete my account." })}
              status={deleteConfirmChecked ? "checked" : "unchecked"}
              disabled={deleting}
              onPress={() => setDeleteConfirmChecked((current) => !current)}
              style={styles.deleteDialogCheckbox}
            />
            {deleteErrorMessage ? <Text style={styles.warningText}>{deleteErrorMessage}</Text> : null}
          </View>
        )}
        actions={[
          <Button
            key="cancel"
            testID="delete-account-cancel"
            mode="outlined"
            disabled={deleting}
            onPress={() => setDeleteDialogVisible(false)}
          >
            {t("cancelLabel", { defaultValue: "Cancel" })}
          </Button>,
          <Button
            key="confirm"
            testID="delete-account-confirm"
            mode="contained"
            disabled={!deleteConfirmChecked || deleting}
            loading={deleting}
            onPress={handleDeleteAccount}
          >
            {t("deleteAccountConfirmButton", { defaultValue: "Delete account" })}
          </Button>
        ]}
      />

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

      <ThemedDialog
        visible={changePasswordDialogVisible}
        title={t("changePasswordTitle", { defaultValue: "Change password" })}
        testID="change-password-dialog"
        onDismiss={() => {
          if (!changePasswordSubmitting) {
            closeChangePasswordDialog();
          }
        }}
        content={(
          <View style={styles.changePasswordDialogContent}>
            <FormTextInput
              testID="change-password-current-input"
              label={withRequiredMark(t("currentPasswordLabel", { defaultValue: "Current password" }))}
              accessibilityLabel={t("currentPasswordLabel", { defaultValue: "Current password" })}
              value={currentPasswordDraft}
              onChangeText={(val) => {
                setCurrentPasswordDraft(val);
                setChangePasswordError(null);
                setCurrentPasswordFieldError(null);
              }}
              secureTextEntry
              textContentType="password"
              autoCapitalize="none"
            />
            {currentPasswordFieldError ? (
              <Text testID="change-password-current-error" style={styles.warningText}>{currentPasswordFieldError}</Text>
            ) : null}

            <FormTextInput
              testID="change-password-new-input"
              label={withRequiredMark(t("newPasswordLabel", { defaultValue: "New password" }))}
              accessibilityLabel={t("newPasswordLabel", { defaultValue: "New password" })}
              value={newPasswordDraft}
              onChangeText={(val) => {
                setNewPasswordDraft(val);
                setChangePasswordError(null);
                setNewPasswordFieldError(null);
              }}
              secureTextEntry
              textContentType="newPassword"
              autoCapitalize="none"
            />
            {newPasswordFieldError ? (
              <Text testID="change-password-new-error" style={styles.warningText}>{newPasswordFieldError}</Text>
            ) : null}

            <FormTextInput
              testID="change-password-confirm-input"
              label={withRequiredMark(t("confirmPasswordLabel", { defaultValue: "Confirm new password" }))}
              accessibilityLabel={t("confirmPasswordLabel", { defaultValue: "Confirm new password" })}
              value={confirmPasswordDraft}
              onChangeText={(val) => {
                setConfirmPasswordDraft(val);
                setChangePasswordError(null);
                setConfirmPasswordFieldError(null);
              }}
              secureTextEntry
              textContentType="newPassword"
              autoCapitalize="none"
            />
            {confirmPasswordFieldError ? (
              <Text testID="change-password-confirm-error" style={styles.warningText}>{confirmPasswordFieldError}</Text>
            ) : null}

            {changePasswordError ? (
              <Text testID="change-password-error" accessibilityRole="alert" style={styles.warningText}>
                {changePasswordError}
              </Text>
            ) : null}
          </View>
        )}
        actions={[
          <Button
            key="cancel"
            testID="change-password-cancel"
            mode="outlined"
            disabled={changePasswordSubmitting}
            onPress={closeChangePasswordDialog}
          >
            {t("cancel_caption", { defaultValue: "Cancel" })}
          </Button>,
          <Button
            key="submit"
            testID="change-password-confirm"
            mode="contained"
            loading={changePasswordSubmitting}
            disabled={changePasswordSubmitting}
            onPress={handleChangePasswordSubmit}
          >
            {t("ok_caption", { defaultValue: "OK" })}
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
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  scroll: {
    flex: 1
  },
  saveFooter: {
    paddingTop: designTokens.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f1d6bf"
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
  },
  secondaryButton: {
    backgroundColor: designTokens.colors.secondary,
    borderColor: "#000",
    borderWidth: 1
  },
  secondaryButtonLabel: {
    color: "#000"
  },
  deleteDialogContent: {
    gap: designTokens.spacing.xs
  },
  deleteDialogBulletText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  deleteDialogCheckbox: {
    paddingHorizontal: 0
  },
  changePasswordDialogContent: {
    gap: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.xs
  }
});
