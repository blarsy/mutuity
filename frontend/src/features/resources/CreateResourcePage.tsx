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
import { useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../auth/requireAuth";
import { RichTextEditor } from "../../components/richText/RichTextEditor";
import { ImageUploadField } from "../../components/ImageUploadField";
import { IntensityPicker } from "../../components/IntensityPicker";
import { LocationPicker } from "../../components/LocationPicker";
import { CategoriesPicker } from "../../components/CategoriesPicker";
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
  const { t, i18n } = useTranslation("resources");
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
  const successRef = useRef<HTMLDivElement>(null);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const categoryErrorMessage = getUserFacingGraphQLErrorMessage(categoryError);
  const editResourceErrorMessage = getUserFacingGraphQLErrorMessage(editResourceError);

  useEffect(() => {
    if (data?.publishResource?.resource) {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);
  const categoryOptions = categoryData?.allResourceCategories.nodes ?? [];
  const editResource = editData?.resourceById ?? null;

  const initialValues = useMemo<CreateResourceValues>(() => {
    if (!editResource) {
      return createResourceInitialValues;
    }

    return {
      title: editResource.title,
      description: editResource.description ?? "",
      imageUrls: editResource.imageUrls,
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
        imageUrls: values.imageUrls.length > 0 ? values.imageUrls : undefined,
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
          <Alert ref={successRef} severity="success" sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <span>
                {t("form.publishedSuccess", {
                  title: data.publishResource.resource.title,
                  action: t(isEditMode ? "form.publishedActionUpdated" : "form.publishedActionCreated")
                })}
              </span>
              <Box>
                <Button
                  color="success"
                  component={NextLink}
                  href={`/resources/${data.publishResource.resource.id}`}
                  size="small"
                  variant="outlined"
                >
                  {t("form.viewResource")}
                </Button>
              </Box>
            </Stack>
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
          {({ values, errors, touched, handleBlur, handleChange, isSubmitting, setFieldTouched, setFieldValue }) => (
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

                <IntensityPicker
                  intensity={values.intensity}
                  tokenAmount={values.defaultTokenAmount}
                  tokenAmountLabel={t("form.defaultTokenLabel")}
                  onIntensityChange={(v) => {
                    void setFieldValue("intensity", v);
                  }}
                  onTokenAmountChange={(v) => {
                    void setFieldValue("defaultTokenAmount", v);
                  }}
                  onBlur={() => {
                    void setFieldTouched("intensity", true, true);
                    void setFieldTouched("defaultTokenAmount", true, true);
                  }}
                  error={Boolean(
                    (touched.intensity && errors.intensity) ||
                    (touched.defaultTokenAmount && errors.defaultTokenAmount)
                  )}
                  helperText={
                    (touched.intensity && errors.intensity)
                      ? String(errors.intensity)
                      : (touched.defaultTokenAmount && errors.defaultTokenAmount)
                      ? String(errors.defaultTokenAmount)
                      : undefined
                  }
                />

                <RichTextEditor
                  error={Boolean(touched.description && errors.description)}
                  helperText={touched.description ? errors.description : t("form.descriptionHelper")}
                  label={t("form.descriptionLabel")}
                  minHeight={220}
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
                  addressHelperText={
                    touched.location && errors.location
                      ? errors.location
                      : t("form.locationHelper")
                  }
                  coordinatesError={Boolean(
                    (touched.latitude && errors.latitude) ||
                    (touched.longitude && errors.longitude)
                  )}
                  coordinatesHelperText={
                    (touched.latitude && errors.latitude)
                      ? errors.latitude
                      : (touched.longitude && errors.longitude)
                      ? errors.longitude
                      : undefined
                  }
                  required
                />

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
                    <CategoriesPicker
                      options={categoryOptions}
                      selected={values.categoryCodes}
                      localizedLabel={(opt) => i18n.language === "fr" ? opt.labelFr : opt.label}
                      onChange={(codes) => {
                        void setFieldValue("categoryCodes", codes);
                      }}
                    />
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
