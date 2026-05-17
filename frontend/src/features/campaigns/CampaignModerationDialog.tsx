import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  createCampaignValidationSchema,
  type CreateCampaignValues
} from "./createCampaign.validation";
import { RichTextEditor } from "../../components/richText/RichTextEditor";
import {
  CAMPAIGN_MODERATION_DETAILS_QUERY,
  UPDATE_CAMPAIGN_FOR_MODERATION_MUTATION
} from "./campaignModeration.queries";
import { CampaignModerationHistory } from "./CampaignModerationHistory";

type CampaignModerationDialogProps = {
  campaignId: string;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
};

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

function toDatetimeLocalInput(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function CampaignModerationDialog({ campaignId, open, onClose, onUpdated }: CampaignModerationDialogProps) {
  const { t } = useTranslation("campaigns");
  const [editOpen, setEditOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery<CampaignModerationDetailsData, CampaignModerationDetailsVariables>(
    CAMPAIGN_MODERATION_DETAILS_QUERY,
    {
      skip: !open,
      variables: { campaignId }
    }
  );

  const [updateCampaign, { loading: updateLoading, error: updateError }] = useMutation<
    UpdateCampaignForModerationData,
    UpdateCampaignForModerationVariables
  >(UPDATE_CAMPAIGN_FOR_MODERATION_MUTATION);

  const campaign = data?.campaignById ?? null;
  const detailsErrorMessage = getUserFacingGraphQLErrorMessage(error);
  const updateErrorMessage = getUserFacingGraphQLErrorMessage(updateError);

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

  const handleSubmit = async (values: CreateCampaignValues) => {
    await updateCampaign({
      variables: {
        pCampaignId: campaignId,
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

    if (onUpdated) {
      await onUpdated();
    }

    setEditOpen(false);
  };

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {campaign ? `${campaign.title}` : t("pending.title")}
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? <CircularProgress size={20} /> : null}
        {detailsErrorMessage ? <Alert severity="error">{detailsErrorMessage}</Alert> : null}

        {!loading && !detailsErrorMessage && campaign ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="subtitle1">{t("moderationNotes.title")}</Typography>
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

            <CampaignModerationHistory campaignId={campaignId} />

            <Dialog fullWidth maxWidth="sm" onClose={() => setEditOpen(false)} open={editOpen}>
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
      </DialogContent>
    </Dialog>
  );
}
