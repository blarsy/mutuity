import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { FormFieldLabel, FormTextInput, ImagePickerField, PrimaryButton, ProximityLocationEditor, type ProximityLocationValue, ScreenContainer } from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useAuth } from "../../services/auth/AuthProvider";
import { fetchMyProfile, updateMyProfile } from "../../services/graphql/profile";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface MyProfileRecord {
  accountId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  location: ProximityLocationValue | null;
  bio: string;
}

export interface MyProfileScreenProps {
  accountId?: string | null;
  profile?: MyProfileRecord | null;
  loading?: boolean;
  errorMessage?: string | null;
  saving?: boolean;
  onRetry?: () => void;
  onBack?: () => void;
  onSaveProfile?: (profilePatch: Pick<MyProfileRecord, "displayName" | "location" | "bio"> & { avatarUrl?: string | null }) => void;
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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const withRequiredMark = (label: string): string => `${label} *`;

  const hasInjectedProfile = profile !== undefined;

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
  actionsZone: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.sm
  }
});
