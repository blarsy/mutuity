import NextLink from "next/link";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";

import { useAuth } from "./AuthProvider";
import {
  loginInitialValues,
  loginValidationSchema,
  type LoginValues
} from "./login.validation";

type LoginFormProps = {
  nextDestination?: string;
  onSuccess?: () => void | Promise<void>;
  showSecondaryActions?: boolean;
};

export function LoginForm({
  nextDestination = "/",
  onSuccess,
  showSecondaryActions = true
}: LoginFormProps) {
  const router = useRouter();
  const { signIn, status } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleBlur, handleChange, isSubmitting }) => (
        <Form>
          <Stack spacing={2}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <TextField
              autoComplete="username"
              autoFocus
              error={Boolean(touched.identifier && errors.identifier)}
              helperText={touched.identifier ? errors.identifier : ""}
              label="Email or account identifier"
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
              label="Password"
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              type="password"
              value={values.password}
            />
            <Button disabled={isSubmitting || status === "loading"} type="submit" variant="contained">
              Sign in
            </Button>

            {showSecondaryActions ? (
              <Stack alignItems="flex-start" spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Other actions
                </Typography>
                <Button component={NextLink} href="/restore-access" size="small">
                  Password reset
                </Button>
                <Button component={NextLink} href="/register" size="small">
                  Create account
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
