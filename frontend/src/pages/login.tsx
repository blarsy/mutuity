import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";

import { useAuth } from "../features/auth/AuthProvider";
import {
  loginInitialValues,
  loginValidationSchema,
  type LoginValues
} from "../features/auth/login.validation";

export default function LoginPage() {
  const router = useRouter();
  const { status, signIn, session } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextDestination = useMemo(() => {
    const candidate = router.query.next;
    return typeof candidate === "string" && candidate.startsWith("/") ? candidate : "/";
  }, [router.query.next]);
  const isProtectedRedirect = nextDestination !== "/";

  useEffect(() => {
    if (status === "authenticated") {
      void router.replace(nextDestination);
    }
  }, [nextDestination, router, status]);

  const handleSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    await signIn({
      identifier: values.identifier.trim(),
      password: values.password
    });
    await router.replace(nextDestination);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Access protected actions and your account session.
        </Typography>

        {isProtectedRedirect && !session.authenticated ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please sign in to access that page. You’ll return there after login.
          </Alert>
        ) : null}

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Restoring your session…
          </Alert>
        ) : null}

        {session.authenticated ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            You are already signed in. Redirecting now…
          </Alert>
        ) : null}

        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        <Formik
          initialValues={loginInitialValues}
          validationSchema={loginValidationSchema}
          onSubmit={async (values, helpers) => {
            try {
              await handleSubmit(values);
            } catch (error) {
              setSubmitError(
                error instanceof Error ? error.message : "Something went wrong. Please try again."
              );
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleBlur, handleChange, isSubmitting }) => (
            <Form>
              <Stack spacing={2}>
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
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
}
