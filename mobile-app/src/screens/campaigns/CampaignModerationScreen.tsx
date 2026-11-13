import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, Chip, Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { LoadingState } from "../../components/state/LoadingState";
import { fetchCampaignById } from "../../services/graphql/campaigns";
import {
  fetchCampaignModerationHistory,
  fetchCampaignNeedTriage,
  fetchCampaignResourceTriage,
  triageCampaignNeed,
  triageCampaignResource,
  type CampaignModerationEventItem,
  type CampaignNeedTriageItem,
  type CampaignResourceTriageItem
} from "../../services/graphql/campaignModeration";
import type { CampaignItem } from "../../services/graphql/campaigns";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { CampaignDetailScreen } from "./CampaignDetailScreen";

export interface CampaignModerationScreenProps {
  campaign: CampaignItem;
  creatorAccountId: string | null;
  onBack?: () => void;
}

function eventLabel(eventType: string): { key: string; defaultValue: string } {
  const keyByType: Record<string, string> = {
    campaign_created: "campaignCreatedEvent",
    moderation_note_received: "moderationNoteReceivedEvent",
    campaign_modified_by_creator: "creatorModifiedEvent",
    campaign_approved: "campaignApprovedEvent"
  };
  const key = keyByType[eventType] ?? "unknownModerationEvent";
  const fallbackByKey: Record<string, string> = {
    campaignCreatedEvent: "Campaign created",
    moderationNoteReceivedEvent: "Moderation note received",
    creatorModifiedEvent: "Campaign modified by creator",
    campaignApprovedEvent: "Campaign approved",
    unknownModerationEvent: "Campaign event"
  };
  return { key, defaultValue: fallbackByKey[key] ?? "Campaign event" };
}

function statusLabel(status: CampaignNeedTriageItem["status"]): { key: string; defaultValue: string } {
  if (status === "ACCEPTED") {
    return { key: "campaignTriageAccepted", defaultValue: "Accepted" };
  }
  if (status === "REJECTED") {
    return { key: "campaignTriageRejected", defaultValue: "Rejected" };
  }
  return { key: "campaignTriagePending", defaultValue: "Pending" };
}

function formatEventDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function CampaignModerationScreen({
  campaign: initialCampaign,
  creatorAccountId,
  onBack
}: CampaignModerationScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation(["common", "us3"]);
  const { height: windowHeight } = useWindowDimensions();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [journalExpanded, setJournalExpanded] = useState(true);
  const [journal, setJournal] = useState<CampaignModerationEventItem[]>([]);
  const [needs, setNeeds] = useState<CampaignNeedTriageItem[]>([]);
  const [resources, setResources] = useState<CampaignResourceTriageItem[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [triageLoading, setTriageLoading] = useState(true);
  const [journalError, setJournalError] = useState(false);
  const [needError, setNeedError] = useState(false);
  const [resourceError, setResourceError] = useState(false);
  const [needActionError, setNeedActionError] = useState(false);
  const [resourceActionError, setResourceActionError] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadJournal = useCallback(async (): Promise<void> => {
    setJournalLoading(true);
    setJournalError(false);
    try {
      setJournal(await fetchCampaignModerationHistory(campaign.id));
    } catch {
      setJournalError(true);
    } finally {
      setJournalLoading(false);
    }
  }, [campaign.id]);

  const loadTriage = useCallback(async (): Promise<void> => {
    setTriageLoading(true);
    setNeedError(false);
    setResourceError(false);
    setNeedActionError(false);
    setResourceActionError(false);
    const [needResult, resourceResult] = await Promise.allSettled([
      fetchCampaignNeedTriage(campaign.id),
      fetchCampaignResourceTriage(campaign.id)
    ]);
    if (needResult.status === "fulfilled") {
      setNeeds(needResult.value);
    } else {
      setNeedError(true);
    }
    if (resourceResult.status === "fulfilled") {
      setResources(resourceResult.value);
    } else {
      setResourceError(true);
    }
    setTriageLoading(false);
  }, [campaign.id]);

  useEffect(() => {
    void loadJournal();
    void loadTriage();
  }, [loadJournal, loadTriage, refreshToken]);

  const handleTriageNeed = async (item: CampaignNeedTriageItem, action: "accept" | "reject"): Promise<void> => {
    const key = `need:${item.needId}:${action}`;
    setBusyKey(key);
    try {
      await triageCampaignNeed(campaign.id, item.needId, action);
      await loadTriage();
    } catch {
      setNeedActionError(true);
    } finally {
      setBusyKey(null);
    }
  };

  const handleTriageResource = async (item: CampaignResourceTriageItem, action: "accept" | "reject"): Promise<void> => {
    const key = `resource:${item.resourceId}:${action}`;
    setBusyKey(key);
    try {
      await triageCampaignResource(campaign.id, item.resourceId, action);
      await loadTriage();
    } catch {
      setResourceActionError(true);
    } finally {
      setBusyKey(null);
    }
  };

  const journalContent = (
    <View style={styles.journalSection}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: journalExpanded }}
        onPress={() => setJournalExpanded((expanded) => !expanded)}
        style={styles.accordionHeader}
        testID="campaign-moderation-journal-toggle"
      >
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t("moderationJournalTitle", { ns: "us3", defaultValue: "Moderation journal" })}
        </Text>
        <Icon
          source={journalExpanded ? "chevron-up" : "chevron-right"}
          size={22}
          color={designTokens.colors.primary}
        />
      </Pressable>
      {journalExpanded ? (
        <ScrollView
          nestedScrollEnabled
          style={[styles.journalList, { maxHeight: windowHeight * 0.5 }]}
          testID="campaign-moderation-journal-list"
        >
          {journalLoading ? <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} /> : null}
          {journalError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {t("moderationJournalError", { ns: "us3", defaultValue: "We could not load the moderation journal." })}
            </Text>
          ) : null}
          {!journalLoading && !journalError && journal.length === 0 ? (
            <Text style={styles.mutedText}>
              {t("moderationJournalEmpty", { ns: "us3", defaultValue: "No moderation events yet." })}
            </Text>
          ) : null}
          {journal.map((event, index) => (
            <View key={`${event.eventType}-${event.createdAt}-${index}`} style={styles.journalEvent}>
              <Text variant="labelMedium" style={styles.journalEventTitle}>
                  {formatEventDate(event.createdAt, i18n.language)} • {t(eventLabel(event.eventType).key, { ns: "us3", defaultValue: eventLabel(event.eventType).defaultValue })}
              </Text>
              {event.body ? <Text variant="bodyMedium">{event.body}</Text> : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const triageContent = campaign.moderationStatus === "APPROVED" ? (
    <View style={styles.triageSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t("campaignResourceTriageTitle", { ns: "us3", defaultValue: "Resources" })}
      </Text>
      {resourceError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t("campaignResourceTriageError", { ns: "us3", defaultValue: "We could not load campaign resources." })}
        </Text>
      ) : null}
      {resourceActionError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t("campaignResourceTriageActionError", { ns: "us3", defaultValue: "Could not update this resource." })}
        </Text>
      ) : null}
      {triageLoading ? <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} /> : null}
      {!triageLoading && !resourceError && resources.length === 0 ? (
        <Text style={styles.mutedText}>
          {t("campaignResourceTriageEmpty", { ns: "us3", defaultValue: "No resources linked to this campaign." })}
        </Text>
      ) : null}
      {resources.map((item) => {
        const acceptKey = `resource:${item.resourceId}:accept`;
        const rejectKey = `resource:${item.resourceId}:reject`;
        return (
          <View key={item.resourceId} style={styles.triageCard}>
            <View style={styles.triageCardHeader}>
              <Text variant="titleSmall" style={styles.triageItemTitle}>
                {item.title ?? t("campaignTriageResourceFallback", { ns: "us3", defaultValue: "Resource {{id}}", id: item.resourceId })}
              </Text>
              <Chip compact>{t(statusLabel(item.status).key, { ns: "us3", defaultValue: statusLabel(item.status).defaultValue })}</Chip>
            </View>
            <Text variant="bodySmall" style={styles.mutedText}>
              {t("campaignTriageLocation", { ns: "us3", defaultValue: "Location" })}: {item.location ?? "—"}
            </Text>
            <Text variant="bodySmall" style={styles.mutedText}>
              {t("campaignTriageDefaultTokens", { ns: "us3", defaultValue: "Default tokens" })}: {item.defaultTokens ?? "—"}
            </Text>
            {item.status === "PENDING" ? (
              <View style={styles.triageActions}>
                <Button mode="contained" compact loading={busyKey === acceptKey} disabled={busyKey !== null} onPress={() => void handleTriageResource(item, "accept")}>
                  {t("approveLabel", { ns: "common", defaultValue: "Approve" })}
                </Button>
                <Button mode="outlined" compact loading={busyKey === rejectKey} disabled={busyKey !== null} onPress={() => void handleTriageResource(item, "reject")}>
                  {t("rejectLabel", { ns: "common", defaultValue: "Reject" })}
                </Button>
              </View>
            ) : null}
          </View>
        );
      })}

      <Text variant="titleMedium" style={[styles.sectionTitle, styles.needsTitle]}>
        {t("campaignNeedTriageTitle", { ns: "us3", defaultValue: "Needs" })}
      </Text>
      {needError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t("campaignNeedTriageError", { ns: "us3", defaultValue: "We could not load campaign needs." })}
        </Text>
      ) : null}
      {needActionError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t("campaignNeedTriageActionError", { ns: "us3", defaultValue: "Could not update this need." })}
        </Text>
      ) : null}
      {!triageLoading && !needError && needs.length === 0 ? (
        <Text style={styles.mutedText}>
          {t("campaignNeedTriageEmpty", { ns: "us3", defaultValue: "No needs linked to this campaign." })}
        </Text>
      ) : null}
      {needs.map((item) => {
        const acceptKey = `need:${item.needId}:accept`;
        const rejectKey = `need:${item.needId}:reject`;
        return (
          <View key={item.needId} style={styles.triageCard}>
            <View style={styles.triageCardHeader}>
              <Text variant="titleSmall" style={styles.triageItemTitle}>
                {item.title ?? t("campaignTriageNeedFallback", { ns: "us3", defaultValue: "Need {{id}}", id: item.needId })}
              </Text>
              <Chip compact>{t(statusLabel(item.status).key, { ns: "us3", defaultValue: statusLabel(item.status).defaultValue })}</Chip>
            </View>
            <Text variant="bodySmall" style={styles.mutedText}>
              {t("campaignTriageCampaign", { ns: "us3", defaultValue: "Campaign" })}: {item.campaignTitle ?? campaign.title}
            </Text>
            {item.intensity ? <Text variant="bodySmall" style={styles.mutedText}>{t("campaignTriageIntensity", { ns: "us3", defaultValue: "Intensity" })}: {item.intensity}</Text> : null}
            {item.proposedTokens !== null ? <Text variant="bodySmall" style={styles.mutedText}>{t("campaignTriageProposedTokens", { ns: "us3", defaultValue: "Proposed tokens" })}: {item.proposedTokens}</Text> : null}
            {item.status === "PENDING" ? (
              <View style={styles.triageActions}>
                <Button mode="contained" compact loading={busyKey === acceptKey} disabled={busyKey !== null} onPress={() => void handleTriageNeed(item, "accept")}>
                  {t("approveLabel", { ns: "common", defaultValue: "Approve" })}
                </Button>
                <Button mode="outlined" compact loading={busyKey === rejectKey} disabled={busyKey !== null} onPress={() => void handleTriageNeed(item, "reject")}>
                  {t("rejectLabel", { ns: "common", defaultValue: "Reject" })}
                </Button>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  ) : null;

  return (
    <CampaignDetailScreen
      campaign={campaign}
      creatorAccountId={creatorAccountId}
      moderationMode
      moderationJournal={journalContent}
      moderationTriage={triageContent}
      {...(onBack ? { onBack } : {})}
      onSaved={() => {
        setRefreshToken((token) => token + 1);
        void fetchCampaignById(campaign.id)
          .then((updatedCampaign) => {
            if (updatedCampaign) {
              setCampaign(updatedCampaign);
            }
          })
          .catch(() => undefined);
      }}
    />
  );
}

const styles = StyleSheet.create({
  journalSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: designTokens.colors.secondary,
    flexShrink: 0
  },
  accordionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44
  },
  sectionTitle: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.altGeneral
  },
  journalList: {
    flexGrow: 0
  },
  journalEvent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: designTokens.colors.secondary,
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.sm
  },
  journalEventTitle: {
    //color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  },
  triageSection: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md
  },
  triageCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    gap: designTokens.spacing.xs,
    padding: designTokens.spacing.sm
  },
  triageCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: designTokens.spacing.xs,
    justifyContent: "space-between"
  },
  triageItemTitle: {
    flex: 1,
    fontFamily: appFontFamilies.altGeneral
  },
  triageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs
  },
  needsTitle: {
    marginTop: designTokens.spacing.sm
  },
  mutedText: {
    color: designTokens.colors.secondary
  },
  errorText: {
    color: designTokens.colors.primary
  }
});
