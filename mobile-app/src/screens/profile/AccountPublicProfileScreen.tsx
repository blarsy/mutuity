import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AccountAvatar } from "../../components/AccountAvatar";
import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { fetchMyProfile } from "../../services/graphql/profile";
import type { MyProfileRecord } from "./MyProfileScreen";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface AccountPublicProfileScreenProps {
  accountId: string;
  profile?: MyProfileRecord | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
}

export function AccountPublicProfileScreen({
  accountId,
  profile,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack
}: AccountPublicProfileScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [remoteProfile, setRemoteProfile] = useState<MyProfileRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const hasInjectedProfile = profile !== undefined;

  const loadProfile = useCallback(async (): Promise<void> => {
    if (hasInjectedProfile) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const nextProfile = await fetchMyProfile(accountId);
      setRemoteProfile(nextProfile);
    } catch {
      setRemoteErrorMessage(t("profileLoadError", { defaultValue: "We could not load this profile." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [accountId, hasInjectedProfile, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const resolvedProfile = profile ?? remoteProfile;
  const resolvedLoading = loading || (!hasInjectedProfile && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedProfile ? remoteErrorMessage : null);

  return (
    <ScreenContainer testID="account-public-profile-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {t("profileLabel", { defaultValue: "Profile" })}
        </Text>
        {onBack ? (
          <PrimaryButton
            label={t("backLabel", { defaultValue: "Back" })}
            onPress={onBack}
          />
        ) : null}
      </View>

      {resolvedLoading ? (
        <View style={styles.stateBody}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.stateText}>
            {t("profileLoading", { defaultValue: "Loading profile..." })}
          </Text>
        </View>
      ) : resolvedErrorMessage ? (
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {resolvedErrorMessage}
          </Text>
          <PrimaryButton
            label={t("retry", { defaultValue: "Retry" })}
            onPress={() => {
              if (onRetry) {
                onRetry();
                return;
              }

              void loadProfile();
            }}
          />
        </View>
      ) : !resolvedProfile ? (
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {t("profileNotAvailable", { defaultValue: "This profile is not available." })}
          </Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityRow}>
          <AccountAvatar
            authenticated
            displayName={resolvedProfile.displayName}
            avatarUrl={resolvedProfile.avatarUrl}
            size={64}
          />

          <View style={styles.identityTextZone}>
            <Text variant="titleLarge" style={styles.displayNameText}>
              {resolvedProfile.displayName || t("anonymousLabel", { defaultValue: "Anonymous" })}
            </Text>
            {resolvedProfile.location?.label ? (
              <Text variant="bodyMedium" style={styles.secondaryText}>{resolvedProfile.location.label}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text variant="labelLarge" style={styles.sectionTitle}>{t("bioLabel", { defaultValue: "Bio" })}</Text>
          <Text variant="bodyMedium" style={styles.bioText}>
            {resolvedProfile.bio.trim() || t("emptyBioLabel", { defaultValue: "No bio provided." })}
          </Text>
        </View>
      </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  content: {
    gap: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md
  },
  stateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: designTokens.spacing.sm
  },
  stateText: {
    textAlign: "center",
    fontFamily: appFontFamilies.general
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md,
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md
  },
  identityTextZone: {
    flex: 1,
    gap: designTokens.spacing.xs
  },
  displayNameText: {
    fontFamily: appFontFamilies.altGeneral
  },
  secondaryText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  sectionCard: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase"
  },
  bioText: {
    fontFamily: appFontFamilies.general
  }
});
