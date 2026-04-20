import NextLink from "next/link";
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

import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { PUBLISH_RESOURCE_MUTATION, RESOURCE_CATEGORY_OPTIONS_QUERY } from "./resources.queries";
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

export default function CreateResourcePage() {
  const [publishResource, { loading, error, data }] = useMutation<
    PublishResourceMutationData,
    PublishResourceMutationVariables
  >(PUBLISH_RESOURCE_MUTATION);
  const { data: categoryData, loading: loadingCategories, error: categoryError } =
    useQuery<ResourceCategoryOptionsQueryData>(RESOURCE_CATEGORY_OPTIONS_QUERY);
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const categoryErrorMessage = getUserFacingGraphQLErrorMessage(categoryError);
  const categoryOptions = categoryData?.allResourceCategories.nodes ?? [];

  const submit = async (values: CreateResourceValues) => {
    await publishResource({
      variables: {
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
            Edit resource
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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              Edit resource
            </Typography>
            <Typography color="text.secondary">
              Share an object or service nearby. The optional token amount is only a negotiable starting point.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button component={NextLink} href="/resources" variant="outlined">
              Browse resources
            </Button>
            <Button component={NextLink} href="/needs" variant="outlined">
              Browse needs
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

        {data?.publishResource?.resource ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Resource “{data.publishResource.resource.title}” is now published.
          </Alert>
        ) : null}

        <Formik
          initialValues={createResourceInitialValues}
          validationSchema={createResourceValidationSchema}
          onSubmit={async (values, helpers) => {
            try {
              await submit(values);
              helpers.resetForm();
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
                  label="Resource title"
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
                  label="Intensity"
                  value={values.intensity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.intensity && errors.intensity)}
                  helperText={touched.intensity ? errors.intensity : "Choose the same intensity scale used for needs."}
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
                  label="Suggested token amount"
                  type="number"
                  value={values.defaultTokenAmount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.defaultTokenAmount && errors.defaultTokenAmount)}
                  helperText={
                    touched.defaultTokenAmount && errors.defaultTokenAmount
                      ? errors.defaultTokenAmount
                      : `Optional. ${getTokenRangeLabel(values.intensity)} tokens for this intensity.`
                  }
                  inputProps={{ min: 1 }}
                />

                <TextField
                  name="description"
                  label="Description"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.description && errors.description)}
                  helperText={touched.description ? errors.description : "Optional, up to 8000 characters."}
                  multiline
                  minRows={5}
                />

                <TextField
                  name="imageUrlsText"
                  label="Image URLs"
                  value={values.imageUrlsText}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.imageUrlsText && errors.imageUrlsText)}
                  helperText={touched.imageUrlsText ? errors.imageUrlsText : "Optional. Paste one or more image URLs separated by commas or new lines."}
                  multiline
                  minRows={2}
                />

                <TextField
                  name="location"
                  label="Location label"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.location && errors.location)}
                  helperText={touched.location ? errors.location : "Shown to nearby people when they browse."}
                  required
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    name="latitude"
                    label="Latitude"
                    type="number"
                    value={values.latitude}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.latitude && errors.latitude)}
                    helperText={touched.latitude ? errors.latitude : "For distance sorting"}
                    required
                    fullWidth
                  />
                  <TextField
                    name="longitude"
                    label="Longitude"
                    type="number"
                    value={values.longitude}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.longitude && errors.longitude)}
                    helperText={touched.longitude ? errors.longitude : "For distance sorting"}
                    required
                    fullWidth
                  />
                </Stack>

                <Box>
                  <Typography gutterBottom variant="subtitle1">
                    Categories
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                    Choose from the fixed system-provided category list derived from the legacy product.
                  </Typography>
                  {loadingCategories ? (
                    <Alert severity="info">Loading categories…</Alert>
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
                  label="Expiration datetime"
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.expiresAt && errors.expiresAt)}
                  helperText={
                    touched.expiresAt && errors.expiresAt
                      ? errors.expiresAt
                      : "Leave empty to keep the resource permanent."
                  }
                  InputLabelProps={{ shrink: true }}
                />

                <Box>
                  <Typography gutterBottom variant="subtitle1">
                    Resource type
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
                      label="Product"
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
                      label="Service"
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
                    Modality flags
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
                      label="Can be given"
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
                      label="Can be exchanged"
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
                      label="Can be taken away"
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
                      label="Can be delivered"
                    />
                  </FormGroup>
                </Box>

                <Button disabled={isSubmitting || loading || loadingCategories} type="submit" variant="contained">
                  Add resource
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}
