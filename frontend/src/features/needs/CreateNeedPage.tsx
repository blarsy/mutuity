import { useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { useRequireAuth } from "../auth/requireAuth";
import { ImageUploadField } from "../../components/ImageUploadField";
import { RichTextEditor } from "../../components/richText/RichTextEditor";
import { IntensityPicker } from "../../components/IntensityPicker";
import { TokenAmount } from "../../components/TokenAmount";
import { LocationPicker } from "../../components/LocationPicker";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  createNeedInitialValues,
  createNeedValidationSchema,
  type CreateNeedValues,
  type NeedIntensityValue
} from "./createNeed.validation";
import {
  CREATE_CAMPAIGN_NEED_MUTATION,
  CREATE_NEED_MUTATION,
  LINKABLE_CAMPAIGN_OPTIONS_QUERY,
  NEED_EDIT_DETAIL_QUERY,
  UPDATE_NEED_MUTATION
} from "./needs.queries";
import type { AccountProfileQuery, CreateNeedMutation, CreateNeedMutationVariables, UpdateNeedMutation, UpdateNeedMutationVariables, LinkableCampaignOptionsQuery, NeedEditDetailQuery, NeedEditDetailQueryVariables } from "../../graphql/generated";
import { NeedIntensity } from "../../graphql/generated";
import { PageContainer } from "../../components/PageContainer";
import { ACCOUNT_PROFILE_QUERY } from "../profile/profile.queries";
import { CampaignListingFeedback } from "../campaigns/CampaignListingFeedback";
import { campaignSelectionLocked, effectiveCampaignRelation, isCurrentCampaignRelation, isOngoingCampaignRelation, shouldSubmitCampaignLink, useCampaignLifecycleNow, type CampaignListingRelation } from "../campaigns/campaignListingLifecycle";

type NeedEditorData = Omit<NeedEditDetailQuery, "needById"> & {
  needById: (Omit<NonNullable<NeedEditDetailQuery["needById"]>, "campaignNeedsByNeedId"> & {
    campaignNeedsByNeedId: { nodes: CampaignListingRelation[] };
  }) | null;
};

function normalizeOptionalCoordinate(value: number | string | null | undefined): number | "" {
  if (value === "" || value == null) {
    return "";
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function isCampaignActive(now: Date, startAtIso: string, endAtIso: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now < endAt;
}

export default function EditNeedPage() {
  const router = useRouter();
  const { t } = useTranslation("needs");
  const { session } = useAuth();
  const accountId = session.account?.id ?? null;
  const needId = typeof router.query.needId === "string" ? router.query.needId : null;
  const isEditMode = Boolean(needId);
  const now = useCampaignLifecycleNow();
  const resubmitRequested = useRef(false);
  const [createNeed, { loading, error }] = useMutation<CreateNeedMutation, CreateNeedMutationVariables>(
    CREATE_NEED_MUTATION
  );
  const [updateNeedById, { loading: updateLoading, error: updateError }] = useMutation<
    UpdateNeedMutation,
    UpdateNeedMutationVariables
  >(UPDATE_NEED_MUTATION);
  const [createCampaignNeed, { error: createCampaignNeedError }] = useMutation(CREATE_CAMPAIGN_NEED_MUTATION);
  const {
    data: campaignOptions,
    loading: campaignOptionsLoading,
    error: campaignOptionsError
  } = useQuery<LinkableCampaignOptionsQuery>(LINKABLE_CAMPAIGN_OPTIONS_QUERY);
  const {
    data: editNeedData,
    loading: editNeedLoading,
    error: editNeedError
  } = useQuery<NeedEditorData>(NEED_EDIT_DETAIL_QUERY, {
    fetchPolicy: "network-only",
    skip: !needId,
    variables: {
      needId: needId ?? ""
    }
  });

  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const {
    data: accountProfileData,
    loading: loadingAccountProfile
  } = useQuery<AccountProfileQuery>(ACCOUNT_PROFILE_QUERY, {
    skip: !router.isReady || isEditMode || !accountId,
    variables: { accountId: accountId ?? "" }
  });

  const errorMessage = getUserFacingGraphQLErrorMessage(error)
    ?? getUserFacingGraphQLErrorMessage(updateError)
    ?? getUserFacingGraphQLErrorMessage(editNeedError)
    ?? getUserFacingGraphQLErrorMessage(createCampaignNeedError);
  const campaignOptionsErrorMessage = getUserFacingGraphQLErrorMessage(campaignOptionsError);

  const relation = effectiveCampaignRelation(editNeedData?.needById?.campaignNeedsByNeedId.nodes ?? [], now);
  const currentCampaignId = relation && isOngoingCampaignRelation(relation, now) ? relation.campaignId : "";
  const campaignLocked = campaignSelectionLocked(relation, now);
  const hasCurrentCampaign = Boolean(relation && isCurrentCampaignRelation(relation, now));

  const activeCampaignOptions = useMemo(() => {
    const nodes = campaignOptions?.allCampaigns?.nodes ?? [];
    const options = nodes.filter(
      node => node.id === currentCampaignId || isCampaignActive(new Date(now), node.startAt, node.endAt)
    );
    if (currentCampaignId && relation?.campaignByCampaignId && !options.some(node => node.id === currentCampaignId)) {
      options.push({ __typename: "Campaign", id: currentCampaignId, ...relation.campaignByCampaignId });
    }
    return options;
  }, [campaignOptions?.allCampaigns?.nodes, currentCampaignId, relation, now]);

  const initialValues = useMemo<CreateNeedValues>(() => {
    const editNeed = editNeedData?.needById;

    if (!editNeed) {
      const profile = accountProfileData?.accountById;
      const hasProfileLocation = Boolean(profile?.location?.trim());
      return {
        ...createNeedInitialValues,
        location: hasProfileLocation ? profile?.location ?? "" : "",
        latitude: hasProfileLocation ? normalizeOptionalCoordinate(profile?.latitude) : "",
        longitude: hasProfileLocation ? normalizeOptionalCoordinate(profile?.longitude) : ""
      };
    }

    return {
      title: editNeed.title,
      description: editNeed.description ?? "",
      imageUrls: (editNeed.imageUrls ?? []).filter((u): u is string => u != null),
      location: editNeed.location,
      latitude: normalizeOptionalCoordinate(editNeed.latitude),
      longitude: normalizeOptionalCoordinate(editNeed.longitude),
      intensity: editNeed.intensity,
      proposedTopesAmount: editNeed.proposedTopesAmount ?? "",
      objectRequired: editNeed.objectRequired,
      competenceRequired: editNeed.competenceRequired,
      toolingRequired: editNeed.toolingRequired,
      multiplePeopleRequired: editNeed.multiplePeopleRequired,
      requiredCompetenceText: editNeed.requiredCompetenceText ?? "",
      requiredToolingText: editNeed.requiredToolingText ?? "",
      requiredPeopleCount: editNeed.requiredPeopleCount ?? "",
      campaignId: currentCampaignId,
      expiresAt: editNeed.expiresAt ? new Date(editNeed.expiresAt).toISOString().slice(0, 16) : ""
    };
  }, [accountProfileData?.accountById, editNeedData?.needById, currentCampaignId]);

  const submit = async (values: CreateNeedValues, resubmit = false) => {
    const normalizedVariables = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      imageUrls: values.imageUrls,
      location: values.location.trim(),
      latitude: values.latitude === "" ? undefined : Number(values.latitude),
      longitude: values.longitude === "" ? undefined : Number(values.longitude),
      intensity: values.intensity as unknown as NeedIntensity,
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

      if (shouldSubmitCampaignLink(currentCampaignId, values.campaignId, resubmit)) {
        await createCampaignNeed({ variables: { campaignId: values.campaignId, needId } });
      }

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
      <PageContainer>
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="info">{t("form.loading")}</Alert>
        </Box>
      </PageContainer>
    );
  }

  if (isEditMode && !editNeedData?.needById && !editNeedLoading) {
    return (
      <PageContainer>
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="warning">{t("form.notFound")}</Alert>
        </Box>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("form.title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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

        {!router.isReady || (!isEditMode && accountId && loadingAccountProfile) ? (
          <Alert severity="info">{t("form.loading")}</Alert>
        ) : <Formik
          enableReinitialize
          initialValues={initialValues}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await submit(values, resubmitRequested.current);
            } catch (error) {
              helpers.setStatus(getUserFacingGraphQLErrorMessage(error as Parameters<typeof getUserFacingGraphQLErrorMessage>[0])
                ?? t("errors.genericRetry", { ns: "common" }));
            } finally {
              resubmitRequested.current = false;
              helpers.setSubmitting(false);
            }
          }}
          validationSchema={createNeedValidationSchema}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldTouched, setFieldValue, submitCount, submitForm, status }) => (
            <Form>
              <Stack spacing={2}>
                {status ? <Alert severity="error">{status}</Alert> : null}
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
                    latitude: values.latitude,
                    longitude: values.longitude
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

                {typeof values.proposedTopesAmount === "number" && Number.isFinite(values.proposedTopesAmount) ? (
                  <TokenAmount amount={values.proposedTopesAmount} size={28} />
                ) : null}

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

                <CampaignListingFeedback relation={relation} locked={campaignLocked} />
                <TextField
                  select
                  name="campaignId"
                  label={t("form.campaignLabel")}
                  value={values.campaignId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={campaignOptionsLoading || campaignLocked || isSubmitting}
                  helperText={campaignOptionsLoading ? t("form.loadingCampaigns") : t("form.campaignHelper")}
                >
                  {!hasCurrentCampaign ? <MenuItem value="">{t("form.noCampaign")}</MenuItem> : null}
                  {activeCampaignOptions.map(campaign => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </MenuItem>
                  ))}
                </TextField>

                {relation?.status === "REJECTED" && values.campaignId === currentCampaignId && currentCampaignId
                  && Date.parse(relation.campaignByCampaignId?.startAt ?? "") <= now ? (
                  <Button type="button" variant="outlined" sx={{ alignSelf: "flex-start" }} disabled={isSubmitting || loading || updateLoading}
                    onClick={async () => {
                      resubmitRequested.current = true;
                      try { await submitForm(); } finally { resubmitRequested.current = false; }
                    }}>
                    {t("listingLifecycle.resubmit", { ns: "campaigns" })}
                  </Button>
                ) : null}

                <TextField
                  name="expiresAt"
                  label={t("form.expiresAtLabel")}
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  InputLabelProps={{ shrink: true }}
                />

                <Button disabled={isSubmitting || loading || updateLoading} type="submit" variant="contained"
                  onClick={() => { resubmitRequested.current = false; }}>
                  {isEditMode ? t("form.saveButton") : t("form.addButton")}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>}
      </Box>
    </PageContainer>
  );
}
