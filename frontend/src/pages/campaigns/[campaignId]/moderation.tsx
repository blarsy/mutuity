import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
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
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../../services/graphql/errorMessages";
import {
  createCampaignValidationSchema,
  type CreateCampaignValues
} from "../../../features/campaigns/createCampaign.validation";
import { RichTextEditor } from "../../../components/richText/RichTextEditor";
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
import { CampaignNeedStatusChip, type CampaignNeedStatus } from "../../../components/campaign/CampaignNeedStatusChip";

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

type CampaignNeedNode = {
  campaignId: string;
  needId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  needByNeedId: {
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

type CampaignResourceNode = {
  campaignId: string;
  resourceId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  resourceByResourceId: {
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
};

type ResourceTriageMutationVariables = {
  campaignId: string;
  resourceId: string;
};

function toDatetimeLocalInput(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function needNodeKey(node: Pick<CampaignNeedNode, "campaignId" | "needId">) {
  return `${node.campaignId}:${node.needId}`;
}

function resourceNodeKey(node: Pick<CampaignResourceNode, "campaignId" | "resourceId">) {
  return `${node.campaignId}:${node.resourceId}`;
}

export default function CampaignModerationPage() {
  const router = useRouter();
  const { campaignId } = router.query;
  const { t } = useTranslation("campaigns");
  const [editOpen, setEditOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

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
  const moderationSectionLabel = isApprovedOrLater
    ? t("moderationNotes.historyTitle")
    : t("moderationNotes.journalTitle");

  const needNodes = useMemo(() => needTriageData?.allCampaignNeeds?.nodes ?? [], [needTriageData?.allCampaignNeeds?.nodes]);
  const resourceNodes = useMemo(() => resourceTriageData?.allCampaignResources?.nodes ?? [], [resourceTriageData?.allCampaignResources?.nodes]);

  const [busyNeedKey, setBusyNeedKey] = useState<string | null>(null);
  const [busyResourceKey, setBusyResourceKey] = useState<string | null>(null);
  const [optimisticNeedStatuses, setOptimisticNeedStatuses] = useState<Record<string, CampaignNeedStatus>>({});
  const [optimisticResourceStatuses, setOptimisticResourceStatuses] = useState<Record<string, CampaignNeedStatus>>({});

  const handleNeedTriage = async (node: CampaignNeedNode, action: "accept" | "reject") => {
    const key = needNodeKey(node);
    const nextStatus: CampaignNeedStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    setBusyNeedKey(key);
    setOptimisticNeedStatuses(current => ({ ...current, [key]: nextStatus }));

    try {
      if (action === "accept") {
        await acceptCampaignNeed({
          variables: { campaignId: campaignIdValue, needId: node.needId }
        });
      } else {
        await rejectCampaignNeed({
          variables: { campaignId: campaignIdValue, needId: node.needId }
        });
      }
      setOptimisticNeedStatuses(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      await refetchNeedTriage();
    } finally {
      setBusyNeedKey(current => (current === key ? null : current));
    }
  };

  const handleResourceTriage = async (node: CampaignResourceNode, action: "accept" | "reject") => {
    const key = resourceNodeKey(node);
    const nextStatus: CampaignNeedStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    setBusyResourceKey(key);
    setOptimisticResourceStatuses(current => ({ ...current, [key]: nextStatus }));

    try {
      if (action === "accept") {
        await acceptCampaignResource({
          variables: { campaignId: campaignIdValue, resourceId: node.resourceId }
        });
      } else {
        await rejectCampaignResource({
          variables: { campaignId: campaignIdValue, resourceId: node.resourceId }
        });
      }
      setOptimisticResourceStatuses(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      await refetchResourceTriage();
    } finally {
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
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
          <IconButton onClick={() => router.push("/campaigns")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h1" variant="h4">
            {campaign ? campaign.title : t("pending.title")}
          </Typography>
        </Stack>

        {loading ? <CircularProgress size={20} /> : null}
        {detailsErrorMessage ? <Alert severity="error">{detailsErrorMessage}</Alert> : null}

        {!loading && !detailsErrorMessage && campaign ? (
          <Stack spacing={2}>
            {isApprovedOrLater ? (
              <>
                <Typography variant="h6">{t("resourceTriage.sectionTitle")}</Typography>

                {resourceTriageLoading ? <CircularProgress size={20} /> : null}
                {resourceTriageErrorMessage ? <Alert severity="error">{resourceTriageErrorMessage}</Alert> : null}

                {!resourceTriageLoading && !resourceTriageErrorMessage && resourceNodes.length === 0 ? (
                  <Alert severity="info">{t("resourceTriage.emptyForCampaign")}</Alert>
                ) : null}

                {resourceNodes.map(node => {
                  const key = resourceNodeKey(node);
                  const status = optimisticResourceStatuses[key] ?? node.status;
                  const canTriageResource = status === "PENDING";
                  const rowBusy = busyResourceKey === key || acceptResourceLoading || rejectResourceLoading;

                  return (
                    <Box key={key} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1">
                            {node.resourceByResourceId?.title ?? t("resourceTriage.resourceFallback", { resourceId: node.resourceId })}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {t("resourceTriage.location")}: {node.resourceByResourceId?.location ?? t("resourceTriage.na")}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {t("resourceTriage.defaultTokens")}: {node.resourceByResourceId?.defaultTokenAmount ?? t("resourceTriage.na")}
                          </Typography>
                        </Box>
                        <CampaignNeedStatusChip status={status} />
                      </Stack>

                      {canTriageResource ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                            disabled={rowBusy}
                            onClick={() => void handleResourceTriage(node, "accept")}
                            size="small"
                            variant="contained"
                          >
                            {t("resourceTriage.accept")}
                          </Button>
                          <Button
                            color="error"
                            disabled={rowBusy}
                            onClick={() => void handleResourceTriage(node, "reject")}
                            size="small"
                            variant="outlined"
                          >
                            {t("resourceTriage.reject")}
                          </Button>
                        </Stack>
                      ) : null}
                    </Box>
                  );
                })}

                <Typography variant="h6" sx={{ mt: 1 }}>{t("triage.sectionTitle")}</Typography>

                {needTriageLoading ? <CircularProgress size={20} /> : null}
                {needTriageErrorMessage ? <Alert severity="error">{needTriageErrorMessage}</Alert> : null}

                {!needTriageLoading && !needTriageErrorMessage && needNodes.length === 0 ? (
                  <Alert severity="info">{t("triage.emptyForCampaign")}</Alert>
                ) : null}

                {needNodes.map(node => {
                  const key = needNodeKey(node);
                  const status = optimisticNeedStatuses[key] ?? node.status;
                  const canTriageNeed = status === "PENDING";
                  const rowBusy = busyNeedKey === key || acceptNeedLoading || rejectNeedLoading;

                  return (
                    <Box key={key} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1">
                            {node.needByNeedId?.title ?? t("triage.needFallback", { needId: node.needId })}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {t("triage.campaignLabel")}: {node.campaignByCampaignId?.title ?? node.campaignId}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {t("triage.pendingTriage", { count: status === "PENDING" ? 1 : 0 })}
                          </Typography>
                        </Box>
                        <CampaignNeedStatusChip status={status} />
                      </Stack>

                      {canTriageNeed ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                            disabled={rowBusy}
                            onClick={() => void handleNeedTriage(node, "accept")}
                            size="small"
                            variant="contained"
                          >
                            {t("triage.accept")}
                          </Button>
                          <Button
                            color="error"
                            disabled={rowBusy}
                            onClick={() => void handleNeedTriage(node, "reject")}
                            size="small"
                            variant="outlined"
                          >
                            {t("triage.reject")}
                          </Button>
                        </Stack>
                      ) : null}
                    </Box>
                  );
                })}
              </>
            ) : null}

            {!isApprovedOrLater ? (
              <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="subtitle1">{moderationSectionLabel}</Typography>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Chip label={campaign.moderationStatus} size="small" variant="outlined" />
                  <Button
                    disabled={!canEdit}
                    onClick={() => {
                      setEditOpen(true);
                    }}
                    size="small"
                    variant="contained"
                  >
                    {t("moderationNotes.editCampaign")}
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {campaign.imageUrl ? (
              <Box
                sx={{
                  borderRadius: 1,
                  maxWidth: 320,
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
            ) : null}

            {isApprovedOrLater ? (
              <Accordion disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ width: "100%", pr: 1 }}
                  >
                    <Typography variant="subtitle2">{t("moderationNotes.historyTitle")}</Typography>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Chip label={campaign.moderationStatus} size="small" variant="outlined" />
                      <Button disabled size="small" variant="contained">
                        {t("moderationNotes.editCampaign")}
                      </Button>
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <CampaignModerationHistory campaignId={campaignId as string} />
                </AccordionDetails>
              </Accordion>
            ) : (
              <CampaignModerationHistory campaignId={campaignId as string} />
            )}

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
                          <TextField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.startAt && errors.startAt)}
                            helperText={touched.startAt ? errors.startAt : ""}
                            label={t("create.fields.startDatetime")}
                            name="startAt"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            type="datetime-local"
                            value={values.startAt}
                          />
                          <TextField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.airdropAt && errors.airdropAt)}
                            helperText={touched.airdropAt ? errors.airdropAt : ""}
                            label={t("create.fields.airdropDatetime")}
                            name="airdropAt"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            type="datetime-local"
                            value={values.airdropAt}
                          />
                          <TextField
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(touched.endAt && errors.endAt)}
                            helperText={touched.endAt ? errors.endAt : ""}
                            label={t("create.fields.endDatetime")}
                            name="endAt"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            required
                            type="datetime-local"
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
    </Container>
  );
}
