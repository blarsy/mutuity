import React, { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import TokenSymbolSvg from "../../assets/img/TOKENS.svg";
import { InlineHtml } from "../../components/InlineHtml";
import {
  NavigationBackHeader,
  PrimaryButton,
  ScreenContainer
} from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchCampaignById, type CampaignItem } from "../../services/graphql/campaigns";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface CampaignPublicInfoScreenProps {
  campaignId: string;
  campaign?: CampaignItem | null;
  loading?: boolean;
  errorMessage?: string | null;
  currentAccountId?: string | null;
  onBack?: () => void;
  onRetry?: () => void;
  onLaunchNewResource?: (campaign: CampaignItem) => void;
  onLaunchNewNeed?: (campaign: CampaignItem) => void;
}

function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function CampaignPublicInfoScreen({
  campaignId,
  campaign,
  loading = false,
  errorMessage = null,
  currentAccountId = null,
  onBack,
  onRetry,
  onLaunchNewResource,
  onLaunchNewNeed
}: CampaignPublicInfoScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation(["common", "us3"]);
  const [remoteCampaign, setRemoteCampaign] = useState<CampaignItem | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const hasInjectedCampaign = campaign !== undefined;

  const loadCampaign = useCallback(async (): Promise<void> => {
    if (hasInjectedCampaign) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const nextCampaign = await fetchCampaignById(campaignId);
      setRemoteCampaign(nextCampaign);
    } catch {
      setRemoteErrorMessage(
        t("campaignPublicLoadError", { ns: "us3", defaultValue: "We could not load this campaign." })
      );
    } finally {
      setRemoteLoading(false);
    }
  }, [campaignId, hasInjectedCampaign, t]);

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  const resolvedCampaign = campaign ?? remoteCampaign;
  const resolvedLoading = loading || (!hasInjectedCampaign && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedCampaign ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return (
      <ScreenContainer testID="campaign-public-screen">
        <NavigationBackHeader onBack={onBack} />
        <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />
      </ScreenContainer>
    );
  }

  if (resolvedErrorMessage) {
    return (
      <ScreenContainer testID="campaign-public-screen">
        <NavigationBackHeader onBack={onBack} />
        <ErrorState
          message={resolvedErrorMessage}
          onRetry={() => {
            if (onRetry) {
              onRetry();
              return;
            }

            void loadCampaign();
          }}
        />
      </ScreenContainer>
    );
  }

  if (!resolvedCampaign) {
    return (
      <ScreenContainer testID="campaign-public-screen">
        <NavigationBackHeader onBack={onBack} />
        <Text accessibilityRole="alert" variant="bodyMedium">
          {t("campaignPublicNotFound", { ns: "us3", defaultValue: "This campaign is not available." })}
        </Text>
      </ScreenContainer>
    );
  }

  const rewardsMultiplier = typeof resolvedCampaign.rewardsMultiplier === "number"
    ? resolvedCampaign.rewardsMultiplier
    : 0;
  const airdropAmount = typeof resolvedCampaign.airdropAmount === "number"
    ? resolvedCampaign.airdropAmount
    : 0;
  const locale = i18n.language;

  return (
    <ScreenContainer testID="campaign-public-screen" style={styles.root}>
      <NavigationBackHeader
        onBack={onBack}
        accessibilityLabel={t("backLabel", { ns: "common", defaultValue: "Back" })}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {resolvedCampaign.imageUrl ? (
          <Image
            source={{ uri: resolvedCampaign.imageUrl }}
            accessibilityLabel={resolvedCampaign.title}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}

        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {resolvedCampaign.title}
        </Text>

        { resolvedCampaign.description && (
        <View style={styles.descriptionBox}>
          <InlineHtml
            html={resolvedCampaign.description}
            emptyFallback={t("campaignDescriptionEmpty", { ns: "us3", defaultValue: "No description." })}
          />
        </View>
        )}

        <View style={styles.datesBox}>
          <Text variant="bodySmall" style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("campaignPublicStart", { ns: "us3", defaultValue: "Start" })}:
            </Text>{" "}
            {formatDateTime(resolvedCampaign.startAt, locale)}
          </Text>
          <Text variant="bodySmall" style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("campaignPublicEnd", { ns: "us3", defaultValue: "End" })}:
            </Text>{" "}
            {formatDateTime(resolvedCampaign.endAt, locale)}
          </Text>
        </View>

        <View style={styles.rewardsBox}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t("campaignPublicRewardsMultiplier", { ns: "us3", defaultValue: "Rewards multiplier" })}
          </Text>
          <View style={styles.multiplierRow}>
            <TokenSymbolSvg width={32} height={32} color="#FE6E4E" />
            <Text variant="headlineSmall" style={styles.multiplierText}>
              × {rewardsMultiplier}
            </Text>
          </View>
        </View>

        <View style={styles.airdropBox}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t("campaignPublicAirdropTitle", { ns: "us3", defaultValue: "Airdrop" })}
          </Text>
          <Text variant="bodySmall" style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("campaignPublicAirdropDate", { ns: "us3", defaultValue: "Date" })}:
            </Text>{" "}
            {formatDateTime(resolvedCampaign.airdropAt, locale)}
          </Text>
          <Text variant="bodySmall" style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("campaignPublicAirdropAmount", { ns: "us3", defaultValue: "Amount" })}:
            </Text>{" "}
            {t("campaignPublicAirdropAmountValue", { ns: "us3", defaultValue: "{{amount}} Tokens", amount: airdropAmount })}
          </Text>
          <Text variant="bodySmall" style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("campaignPublicAirdropConditions", { ns: "us3", defaultValue: "Conditions" })}:
            </Text>{" "}
            {t("campaignPublicAirdropConditionsText", {
              ns: "us3",
              defaultValue: "Have 2 listings approved by the campaign creator at the time of airdrop."
            })}
          </Text>
        </View>

        <Divider />

        <View style={styles.actionsBox}>
          {onLaunchNewResource ? (
            <PrimaryButton
              label={t("campaignPublicLaunchResource", { ns: "us3", defaultValue: "Add a resource" })}
              onPress={() => onLaunchNewResource(resolvedCampaign)}
            />
          ) : null}
          {onLaunchNewNeed ? (
            <PrimaryButton
              label={t("campaignPublicLaunchNeed", { ns: "us3", defaultValue: "Add a need" })}
              onPress={() => onLaunchNewNeed(resolvedCampaign)}
            />
          ) : null}
        </View>

        <View style={styles.explanationBox}>
          <Text variant="bodySmall">
            {t("campaignPublicJoinExplanation", {
              ns: "us3",
              defaultValue: "To join this campaign, create a resource or a need and select this campaign. Your listing will be sent to the campaign creator for approval."
            })}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.primaryContainer
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  descriptionBox: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm
  },
  datesBox: {
    gap: designTokens.spacing.xs
  },
  rewardsBox: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  airdropBox: {
    gap: designTokens.spacing.xs
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  multiplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  multiplierText: {
    fontFamily: appFontFamilies.altGeneral
  },
  infoRow: {
    flexWrap: "wrap"
  },
  infoLabel: {
    fontWeight: "700"
  },
  actionsBox: {
    flexDirection: "row",
    gap: designTokens.spacing.sm,
    flexWrap: "wrap"
  },
  explanationBox: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm
  }
});