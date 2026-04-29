import { useMutation } from "@apollo/client/react";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { CREATE_CAMPAIGN_MUTATION } from "./campaigns.queries";
import { useRequireAuth } from "../../features/auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { RichTextEditor } from "../../components/richText/RichTextEditor";
import {
  createCampaignInitialValues,
  createCampaignValidationSchema,
  type CreateCampaignValues
} from "./createCampaign.validation";

type CreateCampaignMutationData = {
  createCampaign: {
    campaign: {
      id: string;
      title: string;
      moderationStatus: string;
    };
  };
};

type CreateCampaignMutationVariables = {
  title: string;
  theme: string;
  managerNoteFromCreator?: string;
  rewardsMultiplier: number;
  airdropAmount: number;
  startAt: string;
  airdropAt: string;
  endAt: string;
};

export default function CreateCampaignPage() {
  const { t } = useTranslation("campaigns");
  const [createCampaign, { loading, error, data }] = useMutation<
    CreateCampaignMutationData,
    CreateCampaignMutationVariables
  >(CREATE_CAMPAIGN_MUTATION);
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const submit = async (values: CreateCampaignValues) => {
    await createCampaign({
      variables: {
        title: values.title.trim(),
        theme: values.theme.trim(),
        managerNoteFromCreator: values.managerNoteFromCreator.trim() || undefined,
        rewardsMultiplier: values.rewardsMultiplier,
        airdropAmount: values.airdropAmount,
        startAt: new Date(values.startAt).toISOString(),
        airdropAt: new Date(values.airdropAt).toISOString(),
        endAt: new Date(values.endAt).toISOString()
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("create.title")}
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
        <Typography variant="h4" component="h1" gutterBottom>
          {t("create.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("create.subtitle")}
        </Typography>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {data?.createCampaign?.campaign ? (
          <Alert sx={{ mb: 2 }} severity="success">
            {t("create.success", { status: data.createCampaign.campaign.moderationStatus })}
          </Alert>
        ) : null}

        <Formik
          initialValues={createCampaignInitialValues}
          validationSchema={createCampaignValidationSchema}
          onSubmit={async (values, helpers) => {
            try {
              await submit(values);
              helpers.resetForm();
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldTouched, setFieldValue }) => (
            <Form>
              <Stack spacing={2}>
                <TextField
                  name="title"
                  label={t("create.fields.title")}
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.title && errors.title)}
                  helperText={touched.title ? errors.title : ""}
                  required
                />
                <RichTextEditor
                  error={Boolean(touched.theme && errors.theme)}
                  helperText={touched.theme ? errors.theme : ""}
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
                  name="managerNoteFromCreator"
                  label={t("create.fields.noteForManager")}
                  value={values.managerNoteFromCreator}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  multiline
                  minRows={3}
                />
                <TextField
                  name="rewardsMultiplier"
                  label={t("create.fields.rewardsMultiplier")}
                  type="number"
                  value={values.rewardsMultiplier}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.rewardsMultiplier && errors.rewardsMultiplier)}
                  helperText={touched.rewardsMultiplier ? errors.rewardsMultiplier : ""}
                  required
                  inputProps={{ min: 5, max: 10 }}
                />
                <TextField
                  name="airdropAmount"
                  label={t("create.fields.airdropAmount")}
                  type="number"
                  value={values.airdropAmount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.airdropAmount && errors.airdropAmount)}
                  helperText={touched.airdropAmount ? errors.airdropAmount : ""}
                  required
                  inputProps={{ min: 3000, max: 8000 }}
                />
                <TextField
                  name="startAt"
                  label={t("create.fields.startDatetime")}
                  type="datetime-local"
                  value={values.startAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.startAt && errors.startAt)}
                  helperText={touched.startAt ? errors.startAt : ""}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  name="airdropAt"
                  label={t("create.fields.airdropDatetime")}
                  type="datetime-local"
                  value={values.airdropAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.airdropAt && errors.airdropAt)}
                  helperText={touched.airdropAt ? errors.airdropAt : ""}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  name="endAt"
                  label={t("create.fields.endDatetime")}
                  type="datetime-local"
                  value={values.endAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.endAt && errors.endAt)}
                  helperText={touched.endAt ? errors.endAt : ""}
                  required
                  InputLabelProps={{ shrink: true }}
                />

                <Button type="submit" variant="contained" disabled={isSubmitting || loading}>
                  {t("create.submitButton")}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}
