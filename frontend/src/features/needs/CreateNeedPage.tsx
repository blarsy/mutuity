import { useMemo } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../auth/requireAuth";
import { ImageUploadField } from "../../components/ImageUploadField";
import { RichTextEditor } from "../../components/richText/RichTextEditor";
import { IntensityPicker } from "../../components/IntensityPicker";
import { LocationPicker } from "../../components/LocationPicker";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  createNeedInitialValues,
  createNeedValidationSchema,
  type CreateNeedValues,
  type NeedIntensityValue
} from "./createNeed.validation";
import {
  CREATE_NEED_MUTATION,
  LINKABLE_CAMPAIGN_OPTIONS_QUERY,
  NEED_EDIT_DETAIL_QUERY,
  UPDATE_NEED_MUTATION
} from "./needs.queries";

type CreateNeedMutationData = {
  createNeed: {
    need: {
      id: string;
      title: string;
      intensity: string;
      proposedTopesAmount: number | null;
    };
  };
};

type CreateNeedMutationVariables = {
  title: string;
  description?: string;
  imageUrls?: string[];
  location: string;
  latitude: number;
  longitude: number;
  intensity: NeedIntensityValue;
  proposedTopesAmount?: number;
  objectRequired?: boolean;
  competenceRequired?: boolean;
  toolingRequired?: boolean;
  multiplePeopleRequired?: boolean;
  requiredCompetenceText?: string;
  requiredToolingText?: string;
  requiredPeopleCount?: number;
  campaignId?: string;
  expiresAt?: string;
};

type UpdateNeedMutationData = {
  updateNeedById: {
    need: {
      id: string;
      title: string;
      intensity: string;
      proposedTopesAmount: number | null;
    } | null;
  } | null;
};

type UpdateNeedMutationVariables = {
  id: string;
  title: string;
  description?: string;
  imageUrls?: string[];
  location: string;
  intensity: NeedIntensityValue;
  proposedTopesAmount?: number;
  objectRequired?: boolean;
  competenceRequired?: boolean;
  toolingRequired?: boolean;
  multiplePeopleRequired?: boolean;
  requiredCompetenceText?: string;
  requiredToolingText?: string;
  requiredPeopleCount?: number;
  expiresAt?: string;
};

type LinkableCampaignOptionsData = {
  allCampaigns: {
    nodes: Array<{
      id: string;
      title: string;
      startAt: string;
      endAt: string;
    }>;
  };
};

type NeedEditDetailData = {
  needById: {
    id: string;
    title: string;
    description: string | null;
    imageUrls: string[];
    location: string;
    latitude: number | null;
    longitude: number | null;
    intensity: NeedIntensityValue;
    proposedTopesAmount: number | null;
    objectRequired: boolean;
    competenceRequired: boolean;
    toolingRequired: boolean;
    multiplePeopleRequired: boolean;
    requiredCompetenceText: string | null;
    requiredToolingText: string | null;
    requiredPeopleCount: number | null;
    expiresAt: string | null;
    campaignNeedsByNeedId: {
      nodes: Array<{
        campaignId: string;
      }>;
    };
  } | null;
};

function isCampaignActive(now: Date, startAtIso: string, endAtIso: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now <= endAt;
}

export default function EditNeedPage() {
  const router = useRouter();
  const { t } = useTranslation("needs");
  const needId = typeof router.query.needId === "string" ? router.query.needId : null;
  const isEditMode = Boolean(needId);
  const [createNeed, { loading, error }] = useMutation<CreateNeedMutationData, CreateNeedMutationVariables>(
    CREATE_NEED_MUTATION
  );
  const [updateNeedById, { loading: updateLoading, error: updateError }] = useMutation<
    UpdateNeedMutationData,
    UpdateNeedMutationVariables
  >(UPDATE_NEED_MUTATION);
  const {
    data: campaignOptions,
    loading: campaignOptionsLoading,
    error: campaignOptionsError
  } = useQuery<LinkableCampaignOptionsData>(LINKABLE_CAMPAIGN_OPTIONS_QUERY);
  const {
    data: editNeedData,
    loading: editNeedLoading,
    error: editNeedError
  } = useQuery<NeedEditDetailData>(NEED_EDIT_DETAIL_QUERY, {
    skip: !needId,
    variables: {
      needId: needId ?? ""
    }
  });

  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();

  const errorMessage = getUserFacingGraphQLErrorMessage(error)
    ?? getUserFacingGraphQLErrorMessage(updateError)
    ?? getUserFacingGraphQLErrorMessage(editNeedError);
  const campaignOptionsErrorMessage = getUserFacingGraphQLErrorMessage(campaignOptionsError);

  const activeCampaignOptions = useMemo(() => {
    const now = new Date();
    const nodes = campaignOptions?.allCampaigns.nodes ?? [];

    return nodes.filter(node => isCampaignActive(now, node.startAt, node.endAt));
  }, [campaignOptions?.allCampaigns.nodes]);

  const initialValues = useMemo<CreateNeedValues>(() => {
    const editNeed = editNeedData?.needById;

    if (!editNeed) {
      return createNeedInitialValues;
    }

    return {
      title: editNeed.title,
      description: editNeed.description ?? "",
      imageUrls: editNeed.imageUrls ?? [],
      location: editNeed.location,
      latitude: editNeed.latitude ?? 50.6072,
      longitude: editNeed.longitude ?? 3.3889,
      intensity: editNeed.intensity,
      proposedTopesAmount: editNeed.proposedTopesAmount ?? "",
      objectRequired: editNeed.objectRequired,
      competenceRequired: editNeed.competenceRequired,
      toolingRequired: editNeed.toolingRequired,
      multiplePeopleRequired: editNeed.multiplePeopleRequired,
      requiredCompetenceText: editNeed.requiredCompetenceText ?? "",
      requiredToolingText: editNeed.requiredToolingText ?? "",
      requiredPeopleCount: editNeed.requiredPeopleCount ?? "",
      campaignId: editNeed.campaignNeedsByNeedId.nodes[0]?.campaignId ?? "",
      expiresAt: editNeed.expiresAt ? new Date(editNeed.expiresAt).toISOString().slice(0, 16) : ""
    };
  }, [editNeedData?.needById]);

  const submit = async (values: CreateNeedValues) => {
    const normalizedVariables = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      imageUrls: values.imageUrls,
      location: values.location.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      intensity: values.intensity,
      proposedTopesAmount: values.proposedTopesAmount === "" ? undefined : Number(values.proposedTopesAmount),
      objectRequired: values.objectRequired,
      competenceRequired: values.competenceRequired,
      toolingRequired: values.toolingRequired,
      multiplePeopleRequired: values.multiplePeopleRequired,
      requiredCompetenceText: values.requiredCompetenceText.trim() || undefined,
      requiredToolingText: values.requiredToolingText.trim() || undefined,
      requiredPeopleCount: values.requiredPeopleCount === "" ? undefined : Number(values.requiredPeopleCount),
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined
    };

    if (isEditMode && needId) {
      await updateNeedById({
        variables: {
          id: needId,
          ...normalizedVariables
        }
      });

      await router.push("/needs/manage");
      return;
    }

    await createNeed({
      variables: {
        ...normalizedVariables,
        campaignId: values.campaignId || undefined
      }
    });

    await router.push("/needs/manage");
  };

  if (isEditMode && editNeedLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="info">{t("form.loading")}</Alert>
        </Box>
      </Container>
    );
  }

  if (isEditMode && !editNeedData?.needById && !editNeedLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="warning">{t("form.notFound")}</Alert>
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("form.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isEditMode
            ? t("form.editSubtitle")
            : t("form.createSubtitle")}
        </Typography>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {campaignOptionsErrorMessage ? <Alert severity="error">{campaignOptionsErrorMessage}</Alert> : null}

        <Formik
          enableReinitialize
          initialValues={initialValues}
          onSubmit={async (values, helpers) => {
            try {
              await submit(values);
            } finally {
              helpers.setSubmitting(false);
            }
          }}
          validationSchema={createNeedValidationSchema}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldTouched, setFieldValue, submitCount }) => (
            <Form>
              <Stack spacing={2}>
                <TextField
                  name="title"
                  label={t("form.titleLabel")}
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.title && errors.title)}
                  helperText={touched.title ? errors.title : ""}
                  required
                />

                <RichTextEditor
                  label={t("form.descriptionLabel")}
                  onBlur={() => {
                    void setFieldTouched("description", true, true);
                  }}
                  onChange={nextValue => {
                    void setFieldValue("description", nextValue, true);
                  }}
                  placeholder={t("form.descriptionLabel")}
                  value={values.description}
                />

                <ImageUploadField
                  imageUrls={values.imageUrls}
                  onImageAdded={(url) => {
                    void setFieldValue("imageUrls", [...values.imageUrls, url]);
                  }}
                  onImageRemoved={(index) => {
                    void setFieldValue(
                      "imageUrls",
                      values.imageUrls.filter((_, i) => i !== index),
                    );
                  }}
                />

                <LocationPicker
                  value={{
                    address: values.location,
                    latitude: Number(values.latitude) || 50.6072,
                    longitude: Number(values.longitude) || 3.3889,
                  }}
                  onChange={(loc) => {
                    void setFieldValue("location", loc.address);
                    void setFieldValue("latitude", loc.latitude);
                    void setFieldValue("longitude", loc.longitude);
                  }}
                  onBlur={() => {
                    void setFieldTouched("location", true, true);
                  }}
                  addressLabel={t("form.locationLabel")}
                  addressError={Boolean(touched.location && errors.location)}
                  addressHelperText={touched.location && errors.location ? errors.location : undefined}
                  required
                />

                <IntensityPicker
                  intensity={values.intensity}
                  tokenAmount={values.proposedTopesAmount}
                  tokenAmountLabel={t("form.proposedTopesLabel")}
                  uppercase
                  onIntensityChange={(v) => {
                    void setFieldValue("intensity", v);
                  }}
                  onTokenAmountChange={(v) => {
                    void setFieldValue("proposedTopesAmount", v);
                  }}
                  onBlur={() => {
                    void setFieldTouched("intensity", true, true);
                    void setFieldTouched("proposedTopesAmount", true, true);
                  }}
                  error={Boolean(
                    (touched.intensity && errors.intensity) ||
                    (touched.proposedTopesAmount && errors.proposedTopesAmount)
                  )}
                  helperText={
                    (touched.intensity && errors.intensity)
                      ? String(errors.intensity)
                      : (touched.proposedTopesAmount && errors.proposedTopesAmount)
                      ? String(errors.proposedTopesAmount)
                      : undefined
                  }
                />

                <Stack spacing={0}>
                  <Typography variant="subtitle2">{t("form.needNatureLabel")}</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.objectRequired}
                        onChange={event => {
                          void setFieldValue("objectRequired", event.target.checked);
                        }}
                      />
                    }
                    label={t("form.objectRequired")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.toolingRequired}
                        onChange={event => {
                          void setFieldValue("toolingRequired", event.target.checked);
                        }}
                      />
                    }
                    label={t("form.toolingRequired")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.competenceRequired}
                        onChange={event => {
                          void setFieldValue("competenceRequired", event.target.checked);
                        }}
                      />
                    }
                    label={t("form.competenceRequired")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.multiplePeopleRequired}
                        onChange={event => {
                          void setFieldValue("multiplePeopleRequired", event.target.checked);
                        }}
                      />
                    }
                    label={t("form.multiplePeopleRequired")}
                  />
                  {((submitCount > 0 || touched.objectRequired) && typeof errors.objectRequired === "string") ? (
                    <Typography color="error" variant="caption">
                      {errors.objectRequired}
                    </Typography>
                  ) : null}
                </Stack>

                {values.toolingRequired ? (
                  <TextField
                    name="requiredToolingText"
                    label={t("form.requiredToolingLabel")}
                    value={values.requiredToolingText}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.requiredToolingText && errors.requiredToolingText)}
                    helperText={touched.requiredToolingText ? errors.requiredToolingText : ""}
                    required
                  />
                ) : null}

                {values.competenceRequired ? (
                  <TextField
                    name="requiredCompetenceText"
                    label={t("form.requiredCompetenceLabel")}
                    value={values.requiredCompetenceText}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.requiredCompetenceText && errors.requiredCompetenceText)}
                    helperText={touched.requiredCompetenceText ? errors.requiredCompetenceText : ""}
                    required
                  />
                ) : null}

                {values.multiplePeopleRequired ? (
                  <TextField
                    name="requiredPeopleCount"
                    label={t("form.requiredPeopleCountLabel")}
                    type="number"
                    value={values.requiredPeopleCount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.requiredPeopleCount && errors.requiredPeopleCount)}
                    helperText={touched.requiredPeopleCount ? errors.requiredPeopleCount : ""}
                    inputProps={{ min: 2 }}
                    required
                  />
                ) : null}

                <TextField
                  select
                  name="campaignId"
                  label={t("form.campaignLabel")}
                  value={values.campaignId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isEditMode}
                  helperText={campaignOptionsLoading ? t("form.loadingCampaigns") : t("form.campaignHelper")}
                >
                  <MenuItem value="">{t("form.noCampaign")}</MenuItem>
                  {activeCampaignOptions.map(campaign => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  name="expiresAt"
                  label={t("form.expiresAtLabel")}
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  InputLabelProps={{ shrink: true }}
                />

                <Button disabled={isSubmitting || loading || updateLoading} type="submit" variant="contained">
                  {isEditMode ? t("form.saveButton") : t("form.addButton")}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}
