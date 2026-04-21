import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { PUBLISH_RESOURCE_MUTATION, RESOURCE_CATEGORY_OPTIONS_QUERY, RESOURCE_DETAIL_QUERY } from "./resources.queries";
import {
  createResourceInitialValues,
  createResourceValidationSchema,
  getTokenRangeLabel,
  toGraphQLResourceIntensity,
  type CreateResourceValues
} from "./createResource.validation";
import { RESOURCE_INTENSITY_OPTIONS, type ResourceCategoryOption } from "./types";

type PublishResourceMutationData = {
  publishResource: {
    resource: {
      id: string;
      title: string;
      intensity: string;
      defaultTokenAmount: number | null;
    };
  };
};

type PublishResourceMutationVariables = {
  resourceId?: string;
  title: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  intensity: "LEG_UP" | "SHARING" | "COMMITMENT" | "RARE_CONTRIBUTION";
  defaultTokenAmount?: number;
  categoryCodes?: number[];
  imageUrls?: string[];
  isProduct: boolean;
  isService: boolean;
  canBeGiven: boolean;
  canBeExchanged: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  expiresAt?: string;
};

type ResourceCategoryOptionsQueryData = {
  allResourceCategories: {
    nodes: ResourceCategoryOption[];
  };
};

type ResourceDetailForEditQueryData = {
  resourceById: {
    id: string;
    title: string;
    description: string | null;
    location: string;
    latitude: number;
    longitude: number;
    intensity: "LEG_UP" | "SHARING" | "COMMITMENT" | "RARE_CONTRIBUTION";
    defaultTokenAmount: number | null;
    imageUrls: string[];
    isProduct: boolean;
    isService: boolean;
    canBeGiven: boolean;
    canBeExchanged: boolean;
    canBeTakenAway: boolean;
    canBeDelivered: boolean;
    expiresAt: string | null;
    resourceCategoryAssignmentsByResourceId: {
      nodes: Array<{
        categoryCode: number;
      }>;
    };
  } | null;
};

function normalizeOptionalInteger(value: number | "") {
  if (value === "") {
    return undefined;
  }

  return Number.isFinite(Number(value)) ? Number(value) : undefined;
}

function parseImageUrls(value: string) {
  return value
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function fromGraphQLResourceIntensity(value: "LEG_UP" | "SHARING" | "COMMITMENT" | "RARE_CONTRIBUTION") {
  switch (value) {
    case "LEG_UP":
      return "leg_up" as const;
    case "SHARING":
      return "sharing" as const;
    case "COMMITMENT":
      return "commitment" as const;
    case "RARE_CONTRIBUTION":
      return "rare_contribution" as const;
    default:
      return "sharing" as const;
  }
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Date(timestamp).toISOString().slice(0, 16);
}

export default function CreateResourcePage() {
  const router = useRouter();
  const { t } = useTranslation("resources");
  const resourceId = typeof router.query.resourceId === "string" ? router.query.resourceId : null;
  const isEditMode = Boolean(resourceId);
  const [publishResource, { loading, error, data }] = useMutation<
    PublishResourceMutationData,
    PublishResourceMutationVariables
  >(PUBLISH_RESOURCE_MUTATION);
  const { data: categoryData, loading: loadingCategories, error: categoryError } =
    useQuery<ResourceCategoryOptionsQueryData>(RESOURCE_CATEGORY_OPTIONS_QUERY);
  const {
    data: editData,
    loading: loadingEditResource,
    error: editResourceError
  } = useQuery<ResourceDetailForEditQueryData>(RESOURCE_DETAIL_QUERY, {
    skip: !resourceId,
    variables: {
      resourceId: resourceId ?? ""
    }
  });
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const categoryErrorMessage = getUserFacingGraphQLErrorMessage(categoryError);
  const editResourceErrorMessage = getUserFacingGraphQLErrorMessage(editResourceError);
  const categoryOptions = categoryData?.allResourceCategories.nodes ?? [];
  const editResource = editData?.resourceById ?? null;

  const initialValues = useMemo<CreateResourceValues>(() => {
    if (!editResource) {
      return createResourceInitialValues;
    }

    return {
      title: editResource.title,
      description: editResource.description ?? "",
      imageUrlsText: editResource.imageUrls.join("\n"),
      location: editResource.location,
      latitude: editResource.latitude,
      longitude: editResource.longitude,
      intensity: fromGraphQLResourceIntensity(editResource.intensity),
      defaultTokenAmount: editResource.defaultTokenAmount ?? "",
      categoryCodes: editResource.resourceCategoryAssignmentsByResourceId.nodes.map(node => node.categoryCode),
      isProduct: editResource.isProduct,
      isService: editResource.isService,
      canBeGiven: editResource.canBeGiven,
      canBeExchanged: editResource.canBeExchanged,
      canBeTakenAway: editResource.canBeTakenAway,
      canBeDelivered: editResource.canBeDelivered,
      expiresAt: toDateTimeLocalValue(editResource.expiresAt)
    };
  }, [editResource]);

  const submit = async (values: CreateResourceValues) => {
    await publishResource({
      variables: {
        resourceId: resourceId ?? undefined,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        location: values.location.trim(),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        intensity: toGraphQLResourceIntensity(values.intensity),
        defaultTokenAmount: normalizeOptionalInteger(values.defaultTokenAmount),
        categoryCodes: values.categoryCodes.length > 0 ? values.categoryCodes : undefined,
        imageUrls: parseImageUrls(values.imageUrlsText),
        isProduct: values.isProduct,
        isService: values.isService,
        canBeGiven: values.canBeGiven,
        canBeExchanged: values.canBeExchanged,
        canBeTakenAway: values.canBeTakenAway,
        canBeDelivered: values.canBeDelivered,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined
      }
    });
  };

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

  if (isEditMode && loadingEditResource) {
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

  if (isEditMode && !editResource && !loadingEditResource) {
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

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {t("form.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("form.subtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/resources" variant="outlined">
              {t("form.browseResources")}
            </Button>
            <Button component={NextLink} href="/needs" variant="outlined">
              {t("form.browseNeeds")}
            </Button>
          </Stack>
        </Stack>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {categoryErrorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {categoryErrorMessage}
          </Alert>
        ) : null}

        {editResourceErrorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editResourceErrorMessage}
          </Alert>
        ) : null}

        {data?.publishResource?.resource ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t(isEditMode ? "form.updateSuccess" : "form.createSuccess", { title: data.publishResource.resource.title })}
          </Alert>
        ) : null}

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={createResourceValidationSchema}
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
        >
          {({ values, errors, touched, handleBlur, handleChange, isSubmitting, setFieldValue }) => (
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

                <TextField
                  select
                  name="intensity"
                  label={t("form.intensityLabel")}
                  value={values.intensity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.intensity && errors.intensity)}
                  helperText={touched.intensity ? errors.intensity : t("form.intensityHelper")}
                  required
                >
                  {RESOURCE_INTENSITY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} ({option.tokenRange} tokens)
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  name="defaultTokenAmount"
                  label={t("form.defaultTokenLabel")}
                  type="number"
                  value={values.defaultTokenAmount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.defaultTokenAmount && errors.defaultTokenAmount)}
                  helperText={
                    touched.defaultTokenAmount && errors.defaultTokenAmount
                      ? errors.defaultTokenAmount
                      : t("form.defaultTokenHelper", { range: getTokenRangeLabel(values.intensity) })
                  }
                  inputProps={{ min: 1 }}
                />

                <TextField
                  name="description"
                  label={t("form.descriptionLabel")}
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.description && errors.description)}
                  helperText={touched.description ? errors.description : t("form.descriptionHelper")}
                  multiline
                  minRows={5}
                />

                <TextField
                  name="imageUrlsText"
                  label={t("form.imageUrlsLabel")}
                  value={values.imageUrlsText}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.imageUrlsText && errors.imageUrlsText)}
                  helperText={touched.imageUrlsText ? errors.imageUrlsText : t("form.imageUrlsHelper")}
                  multiline
                  minRows={2}
                />

                <TextField
                  name="location"
                  label={t("form.locationLabel")}
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.location && errors.location)}
                  helperText={touched.location ? errors.location : t("form.locationHelper")}
                  required
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    name="latitude"
                    label={t("form.latitudeLabel")}
                    type="number"
                    value={values.latitude}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.latitude && errors.latitude)}
                    helperText={touched.latitude ? errors.latitude : t("form.coordinatesHelper")}
                    required
                    fullWidth
                  />
                  <TextField
                    name="longitude"
                    label={t("form.longitudeLabel")}
                    type="number"
                    value={values.longitude}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.longitude && errors.longitude)}
                    helperText={touched.longitude ? errors.longitude : t("form.coordinatesHelper")}
                    required
                    fullWidth
                  />
                </Stack>

                <Box>
                  <Typography gutterBottom variant="subtitle1">
                    {t("form.categoriesTitle")}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                    {t("form.categoriesHelper")}
                  </Typography>
                  {loadingCategories ? (
                    <Alert severity="info">{t("form.loadingCategories")}</Alert>
                  ) : (
                    <FormGroup>
                      {categoryOptions.map(category => (
                        <FormControlLabel
                          key={category.code}
                          control={
                            <Checkbox
                              checked={values.categoryCodes.includes(category.code)}
                              onChange={(_, checked) => {
                                const nextCodes = checked
                                  ? [...values.categoryCodes, category.code].sort((left, right) => left - right)
                                  : values.categoryCodes.filter(code => code !== category.code);
                                void setFieldValue("categoryCodes", nextCodes);
                              }}
                            />
                          }
                          label={`${category.label} / ${category.labelFr}`}
                        />
                      ))}
                    </FormGroup>
                  )}
                </Box>

                <TextField
                  name="expiresAt"
                  label={t("form.expiresAtLabel")}
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.expiresAt && errors.expiresAt)}
                  helperText={
                    touched.expiresAt && errors.expiresAt
                      ? errors.expiresAt
                      : t("form.expiresAtHelper")
                  }
                  InputLabelProps={{ shrink: true }}
                />

                <Box>
                  <Typography gutterBottom variant="subtitle1">
                    {t("form.resourceTypeTitle")}
                  </Typography>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.isProduct}
                          onChange={(_, checked) => {
                            void setFieldValue("isProduct", checked);
                          }}
                        />
                      }
                      label={t("form.isProduct")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.isService}
                          onChange={(_, checked) => {
                            void setFieldValue("isService", checked);
                          }}
                        />
                      }
                      label={t("form.isService")}
                    />
                  </FormGroup>
                  {errors.isService ? (
                    <Typography color="error" variant="caption">
                      {errors.isService}
                    </Typography>
                  ) : null}
                </Box>

                <Box>
                  <Typography gutterBottom variant="subtitle1">
                    {t("form.modalityFlagsTitle")}
                  </Typography>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.canBeGiven}
                          onChange={(_, checked) => {
                            void setFieldValue("canBeGiven", checked);
                          }}
                        />
                      }
                      label={t("form.canBeGiven")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.canBeExchanged}
                          onChange={(_, checked) => {
                            void setFieldValue("canBeExchanged", checked);
                          }}
                        />
                      }
                      label={t("form.canBeExchanged")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.canBeTakenAway}
                          onChange={(_, checked) => {
                            void setFieldValue("canBeTakenAway", checked);
                          }}
                        />
                      }
                      label={t("form.canBeTakenAway")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.canBeDelivered}
                          onChange={(_, checked) => {
                            void setFieldValue("canBeDelivered", checked);
                          }}
                        />
                      }
                      label={t("form.canBeDelivered")}
                    />
                  </FormGroup>
                </Box>

                <Button disabled={isSubmitting || loading || loadingCategories || loadingEditResource} type="submit" variant="contained">
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
