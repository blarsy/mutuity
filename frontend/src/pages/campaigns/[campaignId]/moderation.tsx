import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Box
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../../services/graphql/errorMessages";
import { formatPublicDateTime } from "../../../features/shared/publicDateTime";
import {
  createCampaignValidationSchema,
  type CreateCampaignValues
} from "../../../features/campaigns/createCampaign.validation";
import { RichTextEditor } from "../../../components/richText/RichTextEditor";
import { RichTextContent } from "../../../components/richText/RichTextContent";
import { PageContainer } from "../../../components/PageContainer";
import { DateTimePickerField } from "../../../components/DateTimePickerField";
import { toDateTimeLocalValue as toDatetimeLocalInput } from "../../../components/dateTime";
import {
  CAMPAIGN_MODERATION_DETAILS_QUERY,
  UPDATE_CAMPAIGN_FOR_MODERATION_MUTATION
} from "../../../features/campaigns/campaignModeration.queries";
import { CampaignModerationHistory } from "../../../features/campaigns/CampaignModerationHistory";
import { ImageUploadField } from "../../../components/ImageUploadField";
import {
  ACCEPT_CAMPAIGN_NEED_MUTATION,
  CAMPAIGN_NEED_TRIAGE_QUERY,
  REJECT_CAMPAIGN_NEED_MUTATION
} from "../../../features/campaigns/campaignNeedTriage.queries";
import {
  ACCEPT_CAMPAIGN_RESOURCE_MUTATION,
  CAMPAIGN_RESOURCE_TRIAGE_QUERY,
  REJECT_CAMPAIGN_RESOURCE_MUTATION
} from "../../../features/campaigns/campaignResourceTriage.queries";
import type { CampaignNeedStatus } from "../../../components/campaign/CampaignNeedStatusChip";
import { NeedCard } from "../../../features/ui/NeedCard";
import { ResourceCard } from "../../../features/ui/ResourceCard";
import { CampaignModerationListingGroup } from "../../../features/campaigns/CampaignModerationListingGroup";
import { CampaignListingPreviewDialog } from "../../../features/campaigns/CampaignListingPreviewDialog";
import { CampaignListingRejectionDialog } from "../../../features/campaigns/CampaignListingRejectionDialog";
import { isCurrentCampaignRelation, isOngoingCampaignRelation, useCampaignLifecycleNow, type CampaignListingRelation } from "../../../features/campaigns/campaignListingLifecycle";

type CampaignModerationDetailsData = {
  campaignById: {
    id: string;
    title: string;
    theme: string;
    description: string | null;
    imageUrl: string | null;
    managerNoteFromCreator: string | null;
    rewardsMultiplier: number;
    airdropAmount: number;
    startAt: string;
    airdropAt: string;
    endAt: string;
    moderationStatus: string;
    createdAt: string;
  } | null;
};

type CampaignModerationDetailsVariables = {
  campaignId: string;
};

type UpdateCampaignForModerationData = {
  updateCampaignForModeration: {
    campaign: {
      id: string;
      moderationStatus: string;
    };
  };
};

type UpdateCampaignForModerationVariables = {
  pCampaignId: string;
  pTitle: string;
  pTheme: string;
  pDescription: string;
  pImageUrl?: string;
  pManagerNoteFromCreator?: string;
  pRewardsMultiplier: number;
  pAirdropAmount: number;
  pStartAt: string;
  pAirdropAt: string;
  pEndAt: string;
};

type ListingCardFields = {
  description?: string | null;
  imageUrls?: string[] | null;
  expiresAt?: string | null;
  createdAt?: string;
  accountByCreatorAccountId?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

type CampaignNeedNode = CampaignListingRelation & {
  campaignId: string;
  needId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  needByNeedId: ListingCardFields & {
    id: string;
    title: string;
    intensity: string;
    proposedTopesAmount: number | null;
  } | null;
};

type CampaignNeedTriageData = {
  allCampaignNeeds: {
    nodes: CampaignNeedNode[];
  } | null;
};

type CampaignResourceNode = CampaignListingRelation & {
  campaignId: string;
  resourceId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  resourceByResourceId: ListingCardFields & {
    id: string;
    title: string;
    location: string | null;
    defaultTokenAmount: number | null;
  } | null;
};

type CampaignResourceTriageData = {
  allCampaignResources: {
    nodes: CampaignResourceNode[];
  } | null;
};

type CampaignScopedTriageVariables = {
  campaignId: string;
};

type NeedTriageMutationVariables = {
  campaignId: string;
  needId: string;
  expectedSubmissionId: string;
  rejectionNote?: string;
};

type ResourceTriageMutationVariables = {
  campaignId: string;
  resourceId: string;
  expectedSubmissionId: string;
  rejectionNote?: string;
};

function needNodeKey(node: Pick<CampaignNeedNode, "campaignId" | "needId" | "submissionId">) {
  return `${node.campaignId}:${node.needId}:${node.submissionId}`;
}

function resourceNodeKey(node: Pick<CampaignResourceNode, "campaignId" | "resourceId" | "submissionId">) {
  return `${node.campaignId}:${node.resourceId}:${node.submissionId}`;
}

export default function CampaignModerationPage() {
  const router = useRouter();
  const { campaignId } = router.query;
  const { t, i18n } = useTranslation("campaigns");
  const [editOpen, setEditOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [previewListing, setPreviewListing] = useState<{ kind: "resource" | "need"; id: string } | null>(null);
  const now = useCampaignLifecycleNow();
  const [rejection, setRejection] = useState<{ kind: "need"; node: CampaignNeedNode } | { kind: "resource"; node: CampaignResourceNode } | null>(null);
  const [triageActionError, setTriageActionError] = useState<string | null>(null);
  const [historyExpansion, setHistoryExpansion] = useState<{ campaignId: string; expanded: boolean } | null>(null);

  const campaignIdValue = (campaignId as string) ?? "";

  const { data, loading, error, refetch } = useQuery<CampaignModerationDetailsData, CampaignModerationDetailsVariables>(
    CAMPAIGN_MODERATION_DETAILS_QUERY,
    {
      skip: !campaignId,
      variables: { campaignId: campaignIdValue }
    }
  );

  const {
    data: needTriageData,
    loading: needTriageLoading,
    error: needTriageError,
    refetch: refetchNeedTriage
  } = useQuery<CampaignNeedTriageData, CampaignScopedTriageVariables>(CAMPAIGN_NEED_TRIAGE_QUERY, {
    skip: !campaignId,
    variables: {
      campaignId: campaignIdValue
    }
  });

  const {
    data: resourceTriageData,
    loading: resourceTriageLoading,
    error: resourceTriageError,
    refetch: refetchResourceTriage
  } = useQuery<CampaignResourceTriageData, CampaignScopedTriageVariables>(CAMPAIGN_RESOURCE_TRIAGE_QUERY, {
    skip: !campaignId,
    variables: {
      campaignId: campaignIdValue
    }
  });

  const [updateCampaign, { loading: updateLoading, error: updateError }] = useMutation<
    UpdateCampaignForModerationData,
    UpdateCampaignForModerationVariables
  >(UPDATE_CAMPAIGN_FOR_MODERATION_MUTATION);

  const [acceptCampaignNeed, { loading: acceptNeedLoading, error: acceptNeedError }] = useMutation<unknown, NeedTriageMutationVariables>(
    ACCEPT_CAMPAIGN_NEED_MUTATION
  );
  const [rejectCampaignNeed, { loading: rejectNeedLoading, error: rejectNeedError }] = useMutation<unknown, NeedTriageMutationVariables>(
    REJECT_CAMPAIGN_NEED_MUTATION
  );
  const [acceptCampaignResource, { loading: acceptResourceLoading, error: acceptResourceError }] = useMutation<unknown, ResourceTriageMutationVariables>(
    ACCEPT_CAMPAIGN_RESOURCE_MUTATION
  );
  const [rejectCampaignResource, { loading: rejectResourceLoading, error: rejectResourceError }] = useMutation<unknown, ResourceTriageMutationVariables>(
    REJECT_CAMPAIGN_RESOURCE_MUTATION
  );

  const campaign = data?.campaignById ?? null;
  const campaignEnd = Date.parse(campaign?.endAt ?? "");
  const campaignEnded = Number.isFinite(campaignEnd) && campaignEnd <= now;
  const historyExpandedByDefault = campaign
    ? campaign.moderationStatus !== "APPROVED" && !campaignEnded
    : true;
  const historyExpanded = historyExpansion?.campaignId === campaignIdValue
    ? historyExpansion.expanded
    : historyExpandedByDefault;
  const detailsErrorMessage = getUserFacingGraphQLErrorMessage(error);
  const updateErrorMessage = getUserFacingGraphQLErrorMessage(updateError);
  const needTriageErrorMessage = getUserFacingGraphQLErrorMessage(needTriageError)
    ?? getUserFacingGraphQLErrorMessage(acceptNeedError)
    ?? getUserFacingGraphQLErrorMessage(rejectNeedError);
  const resourceTriageErrorMessage = getUserFacingGraphQLErrorMessage(resourceTriageError)
    ?? getUserFacingGraphQLErrorMessage(acceptResourceError)
    ?? getUserFacingGraphQLErrorMessage(rejectResourceError);

  const initialValues = useMemo<CreateCampaignValues | null>(() => {
    if (!campaign) {
      return null;
    }

    return {
      title: campaign.title,
      theme: campaign.theme,
      description: campaign.description ?? "",
      imageUrls: campaign.imageUrl ? [campaign.imageUrl] : [],
      managerNoteFromCreator: campaign.managerNoteFromCreator ?? "",
      rewardsMultiplier: campaign.rewardsMultiplier,
      airdropAmount: campaign.airdropAmount,
      startAt: toDatetimeLocalInput(campaign.startAt),
      airdropAt: toDatetimeLocalInput(campaign.airdropAt),
      endAt: toDatetimeLocalInput(campaign.endAt)
    };
  }, [campaign]);

  const canEdit = campaign?.moderationStatus === "PENDING" || campaign?.moderationStatus === "AWAITING_ADAPTATION";
  const isApprovedOrLater = campaign ? !canEdit : false;

  // Rejected submissions are no longer current, but remain reviewable until campaign end.
  const visibleRelation = (node: CampaignListingRelation) => isOngoingCampaignRelation(node, now)
    && (node.status === "REJECTED" || isCurrentCampaignRelation(node, now));
  const needNodes = (needTriageData?.allCampaignNeeds?.nodes ?? []).filter(visibleRelation);
  const resourceNodes = (resourceTriageData?.allCampaignResources?.nodes ?? []).filter(visibleRelation);

  const [busyNeedKey, setBusyNeedKey] = useState<string | null>(null);
  const [busyResourceKey, setBusyResourceKey] = useState<string | null>(null);
  type OptimisticDecision = { status: CampaignNeedStatus; actedAt: string };
  const [optimisticNeedStatuses, setOptimisticNeedStatuses] = useState<Record<string, OptimisticDecision>>({});
  const [optimisticResourceStatuses, setOptimisticResourceStatuses] = useState<Record<string, OptimisticDecision>>({});

  const handleNeedTriage = async (node: CampaignNeedNode, action: "accept" | "reject", rejectionNote?: string) => {
    if (!isCurrentCampaignRelation(node) || node.status !== "PENDING" || !node.submissionId) return;
    setTriageActionError(null);
    const key = needNodeKey(node);
    const nextStatus: CampaignNeedStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    setBusyNeedKey(key);
    setOptimisticNeedStatuses(current => ({ ...current, [key]: { status: nextStatus, actedAt: new Date().toISOString() } }));

    try {
      if (action === "accept") {
        await acceptCampaignNeed({
          variables: { campaignId: campaignIdValue, needId: node.needId, expectedSubmissionId: node.submissionId }
        });
      } else {
        await rejectCampaignNeed({
          variables: { campaignId: campaignIdValue, needId: node.needId, expectedSubmissionId: node.submissionId, rejectionNote }
        });
      }
      await refetchNeedTriage();
      if (action === "reject") setRejection(null);
    } catch (error) {
      setTriageActionError(getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0]) ?? t("errors.genericRetry", { ns: "common" }));
    } finally {
      setOptimisticNeedStatuses(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setBusyNeedKey(current => (current === key ? null : current));
    }
  };

  const handleResourceTriage = async (node: CampaignResourceNode, action: "accept" | "reject", rejectionNote?: string) => {
    if (!isCurrentCampaignRelation(node) || node.status !== "PENDING" || !node.submissionId) return;
    setTriageActionError(null);
    const key = resourceNodeKey(node);
    const nextStatus: CampaignNeedStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    setBusyResourceKey(key);
    setOptimisticResourceStatuses(current => ({ ...current, [key]: { status: nextStatus, actedAt: new Date().toISOString() } }));

    try {
      if (action === "accept") {
        await acceptCampaignResource({
          variables: { campaignId: campaignIdValue, resourceId: node.resourceId, expectedSubmissionId: node.submissionId }
        });
      } else {
        await rejectCampaignResource({
          variables: { campaignId: campaignIdValue, resourceId: node.resourceId, expectedSubmissionId: node.submissionId, rejectionNote }
        });
      }
      await refetchResourceTriage();
      if (action === "reject") setRejection(null);
    } catch (error) {
      setTriageActionError(getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0]) ?? t("errors.genericRetry", { ns: "common" }));
    } finally {
      setOptimisticResourceStatuses(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setBusyResourceKey(current => (current === key ? null : current));
    }
  };

  const handleSubmit = async (values: CreateCampaignValues) => {
    setUpdateSuccess(false);

    await updateCampaign({
      variables: {
        pCampaignId: campaignId as string,
        pTitle: values.title.trim(),
        pTheme: values.theme.trim(),
        pDescription: values.description.trim(),
        pImageUrl: values.imageUrls[0] ?? undefined,
        pManagerNoteFromCreator: values.managerNoteFromCreator.trim() || undefined,
        pRewardsMultiplier: values.rewardsMultiplier,
        pAirdropAmount: values.airdropAmount,
        pStartAt: new Date(values.startAt).toISOString(),
        pAirdropAt: new Date(values.airdropAt).toISOString(),
        pEndAt: new Date(values.endAt).toISOString()
      }
    });

    await refetch();
    setUpdateSuccess(true);
    setEditOpen(false);
  };

  return (
    <PageContainer>
      <Box sx={{ py: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
          <IconButton onClick={() => router.push("/campaigns")}>
            <ArrowBackIcon />
          </IconButton>
        </Stack>

        {loading ? <CircularProgress size={20} /> : null}
        {detailsErrorMessage ? <Alert severity="error">{detailsErrorMessage}</Alert> : null}
        {triageActionError ? <Alert severity="error">{triageActionError}</Alert> : null}
        <CampaignListingPreviewDialog listing={previewListing} onClose={() => setPreviewListing(null)} />
        <CampaignListingRejectionDialog key={rejection?.node.submissionId ?? "closed"}
          error={triageActionError}
          open={Boolean(rejection)} busy={Boolean(busyNeedKey || busyResourceKey)} onClose={() => setRejection(null)}
          onConfirm={async note => {
            if (rejection?.kind === "need") await handleNeedTriage(rejection.node, "reject", note);
            if (rejection?.kind === "resource") await handleResourceTriage(rejection.node, "reject", note);
          }} />

        {!loading && !detailsErrorMessage && campaign ? (
          <Stack spacing={2}>
            <Box component="section" aria-labelledby="campaign-moderation-journal-title">
              <ButtonBase
                aria-controls="campaign-moderation-journal-content"
                aria-expanded={historyExpanded}
                id="campaign-moderation-journal-title"
                onClick={() => setHistoryExpansion({ campaignId: campaignIdValue, expanded: !historyExpanded })}
                sx={{
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  px: 1,
                  py: 0.5,
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <Typography component="span" variant="h6">
                  {t("moderationNotes.journalTitle")}
                </Typography>
                {historyExpanded
                  ? <KeyboardArrowDownIcon aria-hidden="true" data-testid="history-expanded-icon" />
                  : <ChevronRightIcon aria-hidden="true" data-testid="history-collapsed-icon" />}
              </ButtonBase>
              <Box
                aria-labelledby="campaign-moderation-journal-title"
                hidden={!historyExpanded}
                id="campaign-moderation-journal-content"
                role="region"
              >
                {historyExpanded ? <CampaignModerationHistory campaignId={campaignId as string} /> : null}
              </Box>
            </Box>

            <Box component="section" aria-labelledby="campaign-data-title">
              <Stack
                alignItems={{ xs: "flex-start", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Typography component="h2" id="campaign-data-title" variant="h6">
                  {t("moderationNotes.campaignDataTitle")}
                </Typography>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Chip label={t(`statuses.${campaign.moderationStatus.toLowerCase()}`)} size="small" variant="outlined" />
                  {canEdit ? (
                    <Button
                      onClick={() => setEditOpen(true)}
                      size="small"
                      variant="contained"
                    >
                      {t("moderationNotes.editCampaign")}
                    </Button>
                  ) : null}
                </Stack>
              </Stack>

              {campaign.imageUrl ? (
                <Box
                  sx={{
                    borderRadius: 1,
                    maxWidth: 320,
                    mb: 2,
                    overflow: "hidden",
                    width: "100%"
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Box
                    alt={campaign.title}
                    component="img"
                    src={campaign.imageUrl}
                    sx={{
                      aspectRatio: "1 / 1",
                      display: "block",
                      objectFit: "cover",
                      width: "100%"
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>{t("moderationNotes.noImageProvided")}</Alert>
              )}

              <Box
                component="dl"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "max-content 1fr" },
                  columnGap: 3,
                  rowGap: 1,
                  m: 0
                }}
              >
                <Box sx={{ display: "contents" }}>
                  <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{t("create.fields.title")}</Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0 }}>{campaign.title}</Typography>
                </Box>
                <Box sx={{ display: "contents" }}>
                  <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{t("create.fields.theme")}</Typography>
                  <Box component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
                    <RichTextContent html={campaign.theme} emptyFallback="—" />
                  </Box>
                </Box>
                <Box sx={{ display: "contents" }}>
                  <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{t("create.fields.description")}</Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{campaign.description || "—"}</Typography>
                </Box>
                <Box sx={{ display: "contents" }}>
                  <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{t("create.fields.noteForManager")}</Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{campaign.managerNoteFromCreator || "—"}</Typography>
                </Box>
                {[
                  [t("labels.created"), formatPublicDateTime(campaign.createdAt, i18n.language)],
                  [t("create.fields.startDatetime"), formatPublicDateTime(campaign.startAt, i18n.language)],
                  [t("create.fields.airdropDatetime"), formatPublicDateTime(campaign.airdropAt, i18n.language)],
                  [t("create.fields.endDatetime"), formatPublicDateTime(campaign.endAt, i18n.language)],
                  [t("create.fields.airdropAmount"), campaign.airdropAmount],
                  [t("create.fields.rewardsMultiplier"), campaign.rewardsMultiplier]
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: "contents" }}>
                    <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
                    <Typography component="dd" variant="body2" sx={{ m: 0 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {isApprovedOrLater ? (
              <>
                <Typography variant="h6">{t("resourceTriage.sectionTitle")}</Typography>

                {resourceTriageLoading ? <CircularProgress size={20} /> : null}
                {resourceTriageErrorMessage ? <Alert severity="error">{resourceTriageErrorMessage}</Alert> : null}

                {!resourceTriageLoading && !resourceTriageErrorMessage && resourceNodes.length === 0 ? (
                  <Alert severity="info">{t("resourceTriage.emptyForCampaign")}</Alert>
                ) : null}

                <CampaignModerationListingGroup
                  items={resourceNodes.map(node => ({ ...node, ...optimisticResourceStatuses[resourceNodeKey(node)] }))}
                  getKey={resourceNodeKey}
                  rejectedLabel={t("moderationListings.rejectedResources")}
                  renderCard={node => (
                    <ResourceCard
                      title={node.resourceByResourceId?.title ?? t("resourceTriage.resourceFallback", { resourceId: node.resourceId })}
                      creatorName={node.resourceByResourceId?.accountByCreatorAccountId?.displayName ?? t("moderationListings.unknownCreator")}
                      creatorImageUrl={node.resourceByResourceId?.accountByCreatorAccountId?.avatarUrl}
                      description={node.resourceByResourceId?.description}
                      imageUrls={node.resourceByResourceId?.imageUrls}
                      expiresAt={node.resourceByResourceId?.expiresAt}
                      location={node.resourceByResourceId?.location}
                      tokenAmount={node.resourceByResourceId?.defaultTokenAmount}
                      cardMaxWidth={480}
                      onClick={() => setPreviewListing({ kind: "resource", id: node.resourceId })}
                    />
                  )}
                  renderActions={node => (
                    <Stack direction="row" spacing={1}>
                      <Button disabled={busyResourceKey === resourceNodeKey(node) || acceptResourceLoading || rejectResourceLoading}
                        onClick={() => void handleResourceTriage(node, "accept")} size="small" variant="contained">
                        {t("resourceTriage.accept")}
                      </Button>
                      <Button color="error" disabled={busyResourceKey === resourceNodeKey(node) || acceptResourceLoading || rejectResourceLoading}
                        onClick={() => setRejection({ kind: "resource", node })} size="small" variant="outlined">
                        {t("resourceTriage.reject")}
                      </Button>
                    </Stack>
                  )}
                />

                <Typography variant="h6" sx={{ mt: 1 }}>{t("triage.sectionTitle")}</Typography>

                {needTriageLoading ? <CircularProgress size={20} /> : null}
                {needTriageErrorMessage ? <Alert severity="error">{needTriageErrorMessage}</Alert> : null}

                {!needTriageLoading && !needTriageErrorMessage && needNodes.length === 0 ? (
                  <Alert severity="info">{t("triage.emptyForCampaign")}</Alert>
                ) : null}

                <CampaignModerationListingGroup
                  items={needNodes.map(node => ({ ...node, ...optimisticNeedStatuses[needNodeKey(node)] }))}
                  getKey={needNodeKey}
                  rejectedLabel={t("moderationListings.rejectedNeeds")}
                  renderCard={node => (
                    <NeedCard
                      title={node.needByNeedId?.title ?? t("triage.needFallback", { needId: node.needId })}
                      creatorName={node.needByNeedId?.accountByCreatorAccountId?.displayName ?? t("moderationListings.unknownCreator")}
                      creatorImageUrl={node.needByNeedId?.accountByCreatorAccountId?.avatarUrl}
                      description={node.needByNeedId?.description}
                      imageUrls={node.needByNeedId?.imageUrls}
                      expiresAt={node.needByNeedId?.expiresAt}
                      tokenAmount={node.needByNeedId?.proposedTopesAmount}
                      cardMaxWidth={480}
                      onClick={() => setPreviewListing({ kind: "need", id: node.needId })}
                    />
                  )}
                  renderActions={node => (
                    <Stack direction="row" spacing={1}>
                      <Button disabled={busyNeedKey === needNodeKey(node) || acceptNeedLoading || rejectNeedLoading}
                        onClick={() => void handleNeedTriage(node, "accept")} size="small" variant="contained">
                        {t("triage.accept")}
                      </Button>
                      <Button color="error" disabled={busyNeedKey === needNodeKey(node) || acceptNeedLoading || rejectNeedLoading}
                        onClick={() => setRejection({ kind: "need", node })} size="small" variant="outlined">
                        {t("triage.reject")}
                      </Button>
                    </Stack>
                  )}
                />
              </>
            ) : null}

            {updateSuccess ? (
              <Alert severity="success">{t("moderationNotes.updateSuccess")}</Alert>
            ) : null}

            <Dialog fullWidth maxWidth="xl" onClose={() => setEditOpen(false)} open={editOpen}>
              <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {t("moderationNotes.editCampaign")}
                <IconButton aria-label="close" onClick={() => setEditOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {updateErrorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{updateErrorMessage}</Alert> : null}
                {initialValues ? (
                  <Formik
                    enableReinitialize
                    initialValues={initialValues}
                    onSubmit={async (values, helpers) => {
                      try {
                        await handleSubmit(values);
                      } finally {
                        helpers.setSubmitting(false);
                      }
                    }}
                    validationSchema={createCampaignValidationSchema}
                  >
                    {({ values, errors, touched, handleBlur, handleChange, isSubmitting, setFieldTouched, setFieldValue }) => (
                      <Form>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                          <TextField
                            error={Boolean(touched.title && errors.title)}
                            helperText={touched.title ? errors.title : ""}
                            label={t("create.fields.title")}
                            name="title"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            value={values.title}
                          />
                          <RichTextEditor
                            error={Boolean(touched.theme && errors.theme)}
                            helperText={touched.theme ? errors.theme : t("create.fields.themeHelper")}
                            label={t("create.fields.theme")}
                            onBlur={() => {
                              void setFieldTouched("theme", true, true);
                            }}
                            onChange={nextValue => {
                              void setFieldValue("theme", nextValue, true);
                            }}
                            placeholder={t("create.fields.theme")}
                            value={values.theme}
                          />
                          <TextField
                            error={Boolean(touched.description && errors.description)}
                            helperText={touched.description ? errors.description : t("create.fields.descriptionHelper")}
                            label={t("create.fields.description")}
                            minRows={2}
                            multiline
                            name="description"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            value={values.description}
                          />
                          <ImageUploadField
                            imageUrls={values.imageUrls}
                            onImageAdded={(url) => {
                              void setFieldValue("imageUrls", [url]);
                            }}
                            onImageRemoved={(index) => {
                              void setFieldValue(
                                "imageUrls",
                                values.imageUrls.filter((_, i) => i !== index),
                              );
                            }}
                          />
                          <TextField
                            label={t("create.fields.noteForManager")}
                            minRows={3}
                            multiline
                            name="managerNoteFromCreator"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            value={values.managerNoteFromCreator}
                          />
                          <TextField
                            error={Boolean(touched.rewardsMultiplier && errors.rewardsMultiplier)}
                            helperText={touched.rewardsMultiplier ? errors.rewardsMultiplier : ""}
                            inputProps={{ min: 5, max: 10 }}
                            label={t("create.fields.rewardsMultiplier")}
                            name="rewardsMultiplier"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            type="number"
                            value={values.rewardsMultiplier}
                          />
                          <TextField
                            error={Boolean(touched.airdropAmount && errors.airdropAmount)}
                            helperText={touched.airdropAmount ? errors.airdropAmount : ""}
                            inputProps={{ min: 3000, max: 8000 }}
                            label={t("create.fields.airdropAmount")}
                            name="airdropAmount"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            type="number"
                            value={values.airdropAmount}
                          />
                          <DateTimePickerField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.startAt && errors.startAt)}
                            helperText={touched.startAt ? errors.startAt : ""}
                            label={t("create.fields.startDatetime")}
                            name="startAt"
                            onBlur={handleBlur}
                            onChange={value => { void setFieldValue("startAt", value); }}
                            required
                            value={values.startAt}
                          />
                          <DateTimePickerField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.airdropAt && errors.airdropAt)}
                            helperText={touched.airdropAt ? errors.airdropAt : ""}
                            label={t("create.fields.airdropDatetime")}
                            name="airdropAt"
                            onBlur={handleBlur}
                            onChange={value => { void setFieldValue("airdropAt", value); }}
                            required
                            value={values.airdropAt}
                          />
                          <DateTimePickerField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.endAt && errors.endAt)}
                            helperText={touched.endAt ? errors.endAt : ""}
                            label={t("create.fields.endDatetime")}
                            name="endAt"
                            onBlur={handleBlur}
                            onChange={value => { void setFieldValue("endAt", value); }}
                            required
                            value={values.endAt}
                          />
                          <Button disabled={isSubmitting || updateLoading} type="submit" variant="contained">
                            {updateLoading ? <CircularProgress size={14} /> : t("create.submitButton")}
                          </Button>
                        </Stack>
                      </Form>
                    )}
                  </Formik>
                ) : null}
              </DialogContent>
            </Dialog>
          </Stack>
        ) : null}
      </Box>
    </PageContainer>
  );
}
