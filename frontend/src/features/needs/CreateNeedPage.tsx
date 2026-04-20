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

import { useRequireAuth } from "../auth/requireAuth";
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
    location: string;
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
  const needId = typeof router.query.needId === "string" ? router.query.needId : null;
  const isEditMode = Boolean(needId);
  const [createNeed, { loading, error, data }] = useMutation<CreateNeedMutationData, CreateNeedMutationVariables>(
    CREATE_NEED_MUTATION
  );
  const [updateNeedById, { loading: updateLoading, error: updateError, data: updateData }] = useMutation<
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
      location: editNeed.location,
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
      location: values.location.trim(),
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
      return;
    }

    await createNeed({
      variables: {
        ...normalizedVariables,
        campaignId: values.campaignId || undefined
      }
    });
  };

  if (isEditMode && editNeedLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Edit need
          </Typography>
          <Alert severity="info">Loading need…</Alert>
        </Box>
      </Container>
    );
  }

  if (isEditMode && !editNeedData?.needById && !editNeedLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Edit need
          </Typography>
          <Alert severity="warning">This need was not found or is no longer accessible.</Alert>
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Edit need
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Edit need
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isEditMode
            ? "Update your need details and availability settings."
            : "Create a standalone need or link it to an approved, currently active campaign."}
        </Typography>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {campaignOptionsErrorMessage ? <Alert severity="error">{campaignOptionsErrorMessage}</Alert> : null}
        {data?.createNeed?.need ? (
          <Alert sx={{ mb: 2 }} severity="success">
            Need created: {data.createNeed.need.title}.
          </Alert>
        ) : null}
        {updateData?.updateNeedById?.need ? (
          <Alert sx={{ mb: 2 }} severity="success">
            Need updated: {updateData.updateNeedById.need.title}.
          </Alert>
        ) : null}

        <Formik
          enableReinitialize
          initialValues={initialValues}
          onSubmit={async (values, helpers) => {
            try {
              await submit(values);
              if (!isEditMode) {
                helpers.resetForm();
              }
            } finally {
              helpers.setSubmitting(false);
            }
          }}
          validationSchema={createNeedValidationSchema}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldValue, submitCount }) => (
            <Form>
              <Stack spacing={2}>
                <TextField
                  name="title"
                  label="Need title"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.title && errors.title)}
                  helperText={touched.title ? errors.title : ""}
                  required
                />

                <TextField
                  name="description"
                  label="Description"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  multiline
                  minRows={3}
                />

                <TextField
                  name="location"
                  label="Location"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.location && errors.location)}
                  helperText={touched.location ? errors.location : ""}
                  required
                />

                <TextField
                  select
                  name="intensity"
                  label="Intensity"
                  value={values.intensity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.intensity && errors.intensity)}
                  helperText={touched.intensity ? errors.intensity : ""}
                  required
                >
                  <MenuItem value="LEG_UP">Leg up</MenuItem>
                  <MenuItem value="SHARING">Sharing</MenuItem>
                  <MenuItem value="COMMITMENT">Commitment</MenuItem>
                  <MenuItem value="RARE_CONTRIBUTION">Rare contribution</MenuItem>
                </TextField>

                <TextField
                  name="proposedTopesAmount"
                  label="Proposed Topes amount"
                  type="number"
                  value={values.proposedTopesAmount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.proposedTopesAmount && errors.proposedTopesAmount)}
                  helperText={touched.proposedTopesAmount ? errors.proposedTopesAmount : "Optional"}
                  inputProps={{ min: 1 }}
                />

                <Stack spacing={0}>
                  <Typography variant="subtitle2">Need nature</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.objectRequired}
                        onChange={event => {
                          void setFieldValue("objectRequired", event.target.checked);
                        }}
                      />
                    }
                    label="Object required"
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
                    label="Tooling required"
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
                    label="Competence required"
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
                    label="Multiple people required"
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
                    label="Required tooling details"
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
                    label="Required competence details"
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
                    label="Required people count"
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
                  label="Link to campaign (optional)"
                  value={values.campaignId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isEditMode}
                  helperText={campaignOptionsLoading ? "Loading campaign options…" : "Only approved and active campaigns are listed"}
                >
                  <MenuItem value="">No campaign</MenuItem>
                  {activeCampaignOptions.map(campaign => (
                    <MenuItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  name="expiresAt"
                  label="Expires at (optional)"
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  InputLabelProps={{ shrink: true }}
                />

                <Button disabled={isSubmitting || loading || updateLoading} type="submit" variant="contained">
                  {isEditMode ? "Save need" : "Add need"}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}
