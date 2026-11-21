import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Chip, Divider, Icon, PaperProvider, Text, useTheme } from "react-native-paper";

import { AppButton as Button } from "../../components/primitives/AppButton";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { LoadingState } from "../../components/state/LoadingState";
import { FormTextInput, ThemedDialog } from "../../components/primitives";
import { NeedSearchCard, ResourceSearchCard } from "../../components/listings/SearchListingCards";
import { fetchCampaignById } from "../../services/graphql/campaigns";
import {
  fetchCampaignModerationHistory,
  fetchCampaignNeedTriage,
  fetchCampaignResourceTriage,
  triageCampaignNeed,
  triageCampaignResource,
  isVisibleModerationRelation,
  type CampaignModerationEventItem,
  type CampaignNeedTriageItem,
  type CampaignResourceTriageItem
} from "../../services/graphql/campaignModeration";
import type { CampaignItem } from "../../services/graphql/campaigns";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { CampaignDetailScreen } from "./CampaignDetailScreen";
import { isCurrentCampaignRelation } from "../../services/graphql/campaignListing";
import { ResourceDetailScreen } from "../resources/ResourceDetailScreen";
import { NeedDetailScreen } from "../needs/NeedDetailScreen";
import { ModerationListingGroup } from "./ModerationListingGroup";

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

function formatEventDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
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
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [journalExpanded, setJournalExpanded] = useState(initialCampaign.moderationStatus !== "APPROVED");
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
  const [rejection, setRejection] = useState<
    { type: "need"; item: CampaignNeedTriageItem } | { type: "resource"; item: CampaignResourceTriageItem } | null
  >(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [preview, setPreview] = useState<{ kind: "resource" | "need"; id: string } | null>(null);
  const visibleResources = resources.filter(isVisibleModerationRelation);
  const visibleNeeds = needs.filter(isVisibleModerationRelation);

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

  const handleTriageNeed = async (item: CampaignNeedTriageItem, action: "accept" | "reject", note?: string): Promise<void> => {
    if (!isCurrentCampaignRelation(item) || item.status !== "PENDING") return;
    const key = `need:${item.needId}:${action}`;
    setBusyKey(key);
    try {
      await triageCampaignNeed(campaign.id, item.needId, action, item.submissionId, note);
      setRejection(null);
      await loadTriage();
    } catch {
      setNeedActionError(true);
    } finally {
      setBusyKey(null);
    }
  };

  const handleTriageResource = async (item: CampaignResourceTriageItem, action: "accept" | "reject", note?: string): Promise<void> => {
    if (!isCurrentCampaignRelation(item) || item.status !== "PENDING") return;
    const key = `resource:${item.resourceId}:${action}`;
    setBusyKey(key);
    try {
      await triageCampaignResource(campaign.id, item.resourceId, action, item.submissionId, note);
      setRejection(null);
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
          style={[styles.journalList, { maxHeight: windowHeight * 0.25 }]}
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
      {!triageLoading && !resourceError && visibleResources.length === 0 ? (
        <Text style={styles.mutedText}>
          {t("campaignResourceTriageEmpty", { ns: "us3", defaultValue: "No resources linked to this campaign." })}
        </Text>
      ) : null}
      <ModerationListingGroup
        items={visibleResources}
        rejectedLabel={t("alsoShowRejectedResources", { ns: "us3", defaultValue: "Also show rejected resources" })}
        testID="rejected-resources"
        renderItem={(item, index) => {
        const acceptKey = `resource:${item.resourceId}:accept`;
        const rejectKey = `resource:${item.resourceId}:reject`;
        return (
          <View key={item.resourceId} style={styles.triageEntry} testID={`resource-moderation-${item.resourceId}`}>
            {index > 0 ? <Divider style={styles.triageDivider} testID={`resource-divider-${item.resourceId}`} /> : null}
            <View style={styles.triageStatus} testID={`resource-moderation-info-${item.resourceId}`}>
              <Chip compact mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>{t(statusLabel(item.status).key, { ns: "us3", defaultValue: statusLabel(item.status).defaultValue })}</Chip>
              <Text variant="bodySmall" style={styles.mutedText}>
                {formatEventDate(item.status === "PENDING" ? item.submittedAt : item.actedAt, i18n.language)}
              </Text>
            </View>
            <ResourceSearchCard listing={{
              ...item,
              id: item.resourceId,
              title: item.title ?? t("campaignTriageResourceFallback", { ns: "us3", defaultValue: "Resource {{id}}", id: item.resourceId })
            }} onPress={() => setPreview({ kind: "resource", id: item.resourceId })} />
            {item.status === "PENDING" ? (
              <View style={styles.triageActions}>
                <Button mode="contained" compact loading={busyKey === acceptKey} disabled={busyKey !== null} onPress={() => void handleTriageResource(item, "accept")}>
                  {t("approveLabel", { ns: "common", defaultValue: "Approve" })}
                </Button>
                <Button mode="outlined" compact loading={busyKey === rejectKey} disabled={busyKey !== null} onPress={() => { setRejectionNote(""); setRejection({ type: "resource", item }); }}>
                  {t("rejectLabel", { ns: "common", defaultValue: "Reject" })}
                </Button>
              </View>
            ) : null}
          </View>
        );
      }} />

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
      {!triageLoading && !needError && visibleNeeds.length === 0 ? (
        <Text style={styles.mutedText}>
          {t("campaignNeedTriageEmpty", { ns: "us3", defaultValue: "No needs linked to this campaign." })}
        </Text>
      ) : null}
      <ModerationListingGroup
        items={visibleNeeds}
        rejectedLabel={t("alsoShowRejectedNeeds", { ns: "us3", defaultValue: "Also show rejected needs" })}
        testID="rejected-needs"
        renderItem={(item, index) => {
        const acceptKey = `need:${item.needId}:accept`;
        const rejectKey = `need:${item.needId}:reject`;
        return (
          <View key={item.needId} style={styles.triageEntry} testID={`need-moderation-${item.needId}`}>
            {index > 0 ? <Divider style={styles.triageDivider} testID={`need-divider-${item.needId}`} /> : null}
            <View style={styles.triageStatus} testID={`need-moderation-info-${item.needId}`}>
              <Chip compact mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>{t(statusLabel(item.status).key, { ns: "us3", defaultValue: statusLabel(item.status).defaultValue })}</Chip>
              <Text variant="bodySmall" style={styles.mutedText}>
                {formatEventDate(item.status === "PENDING" ? item.submittedAt : item.actedAt, i18n.language)}
              </Text>
            </View>
            <NeedSearchCard listing={{
              ...item,
              id: item.needId,
              title: item.title ?? t("campaignTriageNeedFallback", { ns: "us3", defaultValue: "Need {{id}}", id: item.needId }),
              proposedTokenAmount: item.proposedTokens
            }} onPress={() => setPreview({ kind: "need", id: item.needId })} />
            {item.status === "PENDING" ? (
              <View style={styles.triageActions}>
                <Button mode="contained" compact loading={busyKey === acceptKey} disabled={busyKey !== null} onPress={() => void handleTriageNeed(item, "accept")}>
                  {t("approveLabel", { ns: "common", defaultValue: "Approve" })}
                </Button>
                <Button mode="outlined" compact loading={busyKey === rejectKey} disabled={busyKey !== null} onPress={() => { setRejectionNote(""); setRejection({ type: "need", item }); }}>
                  {t("rejectLabel", { ns: "common", defaultValue: "Reject" })}
                </Button>
              </View>
            ) : null}
          </View>
        );
      }} />
    </View>
  ) : null;

  return (
    <>
    <CampaignDetailScreen
      campaign={{
        ...campaign,
        ...(!resourceError && !triageLoading ? {
          resourceCount: visibleResources.filter(item => item.status !== "REJECTED").length,
          pendingResourceCount: visibleResources.filter(item => item.status === "PENDING").length
        } : {}),
        ...(!needError && !triageLoading ? {
          needCount: visibleNeeds.filter(item => item.status !== "REJECTED").length,
          pendingNeedCount: visibleNeeds.filter(item => item.status === "PENDING").length
        } : {})
      }}
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
    {preview ? (
      <Modal
        visible
        presentationStyle="fullScreen"
        animationType="slide"
        onRequestClose={() => setPreview(null)}
        testID="campaign-listing-preview"
      >
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <SafeAreaView style={[styles.preview, { backgroundColor: theme.colors.background }]}>
              {preview.kind === "resource" ? (
                <ResourceDetailScreen key={preview.id} resourceId={preview.id} onBack={() => setPreview(null)} />
              ) : (
                <NeedDetailScreen key={preview.id} needId={preview.id} onBack={() => setPreview(null)} />
              )}
            </SafeAreaView>
          </PaperProvider>
        </SafeAreaProvider>
      </Modal>
    ) : null}
    <ThemedDialog
      visible={rejection !== null}
      testID="campaign-listing-rejection-dialog"
      title={t("listingCampaignRejectTitle", { ns: "common" })}
      onDismiss={() => { if (!busyKey) setRejection(null); }}
      content={
        <ScrollView keyboardShouldPersistTaps="handled">
          <FormTextInput
            label={t("listingCampaignRejectionNote", { ns: "common" })}
            accessibilityLabel={t("listingCampaignRejectionNote", { ns: "common" })}
            value={rejectionNote}
            onChangeText={setRejectionNote}
            multiline
            numberOfLines={4}
            maxLength={2000}
            disabled={busyKey !== null}
          />
          {needActionError || resourceActionError ? <Text accessibilityRole="alert" style={styles.errorText}>{t("listingCampaignDecisionError", { ns: "common" })}</Text> : null}
        </ScrollView>
      }
      actions={[
          <Button key="cancel" disabled={busyKey !== null} onPress={() => setRejection(null)}>{t("cancel", { defaultValue: "Cancel" })}</Button>,
          <Button key="reject" mode="contained" disabled={busyKey !== null} loading={busyKey !== null} onPress={() => {
            if (rejection?.type === "need") void handleTriageNeed(rejection.item, "reject", rejectionNote);
            if (rejection?.type === "resource") void handleTriageResource(rejection.item, "reject", rejectionNote);
          }}>{t("rejectLabel", { defaultValue: "Reject" })}</Button>
      ]}
    />
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1
  },
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
    flexGrow: 0,
    backgroundColor: designTokens.colors.secondary
  },
  journalEvent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: designTokens.colors.secondary,
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.sm
  },
  journalEventTitle: {
    fontFamily: appFontFamilies.general,
    fontWeight: "bold"
  },
  triageSection: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md
  },
  triageEntry: {
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.sm
  },
  triageStatus: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusChip: {
    backgroundColor: "transparent",
    borderColor: "#bbb"
  },
  statusChipText: {
    color: "#555"
  },
  triageDivider: {
    marginVertical: designTokens.spacing.sm,
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
    color: '#000'
  },
  errorText: {
    color: designTokens.colors.primary
  }
});
