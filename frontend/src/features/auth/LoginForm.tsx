import NextLink from "next/link";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthProvider";
import { SocialAuthButtons } from "./SocialAuthButtons";
import {
  loginInitialValues,
  loginValidationSchema,
  type LoginValues
} from "./login.validation";

type LoginFormProps = {
  nextDestination?: string;
  onSuccess?: () => void | Promise<void>;
  onSecondaryActionClick?: () => void;
  showSecondaryActions?: boolean;
};

export function LoginForm({
  nextDestination = "/",
  onSuccess,
  onSecondaryActionClick,
  showSecondaryActions = true
}: LoginFormProps) {
  const router = useRouter();
  const { signIn, status } = useAuth();
  const { t } = useTranslation("auth");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPasswordResetRequired =
    typeof submitError === "string"
    && submitError.toLowerCase().includes("password reset is required");

  const handleSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    await signIn({
      identifier: values.identifier.trim(),
      password: values.password
    });

    if (onSuccess) {
      await onSuccess();
      return;
    }

    await router.replace(nextDestination);
  };

  return (
    <Formik
      initialValues={loginInitialValues}
      validationSchema={loginValidationSchema}
      onSubmit={async (values, helpers) => {
        try {
          await handleSubmit(values);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : t("form.submitError", { ns: "common", defaultValue: "Something went wrong. Please try again." }));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleBlur, handleChange, isSubmitting }) => (
        <Form>
          <Stack spacing={2}>
            {submitError ? (
              <Alert
                severity="error"
                action={
                  isPasswordResetRequired ? (
                    <Button
                      color="inherit"
                      component={NextLink}
                      href={`/restore-access${values.identifier.trim() ? `?identifier=${encodeURIComponent(values.identifier.trim())}` : ""}`}
                      size="small"
                    >
                      {t("signIn.passwordResetRequiredButton")}
                    </Button>
                  ) : undefined
                }
              >
                {submitError}
              </Alert>
            ) : null}

            <TextField
              autoComplete="username"
              autoFocus
              error={Boolean(touched.identifier && errors.identifier)}
              helperText={touched.identifier ? errors.identifier : ""}
              label={t("form.identifierLabel")}
              name="identifier"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              value={values.identifier}
            />
            <TextField
              autoComplete="current-password"
              error={Boolean(touched.password && errors.password)}
              helperText={touched.password ? errors.password : ""}
              label={t("form.passwordLabel")}
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              type="password"
              value={values.password}
            />
            <Button disabled={isSubmitting || status === "loading"} type="submit" variant="contained">
              {t("form.submitButton")}
            </Button>

            <SocialAuthButtons nextDestination={nextDestination} />

            {showSecondaryActions ? (
              <Stack alignItems="flex-start" spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  {t("form.otherActions")}
                </Typography>
                <Button
                  component={NextLink}
                  href="/restore-access"
                  onClick={onSecondaryActionClick}
                  size="small"
                  type="button"
                >
                  {t("form.passwordReset")}
                </Button>
                <Button
                  component={NextLink}
                  href="/register"
                  onClick={onSecondaryActionClick}
                  size="small"
                  type="button"
                >
                  {t("form.createAccount")}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
