import { captureUnexpectedError } from "./instrument.js";
import type { ErrorRequestHandler } from "express";

const expectedCodes = new Set([
  "BAD_USER_INPUT", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND",
  "PASSWORD_RESET_REQUIRED", "RATE_LIMITED", "GRAPHQL_AUTH_ERROR", "APP_UPDATE_REQUIRED",
  "GRAPHQL_PARSE_FAILED", "GRAPHQL_VALIDATION_FAILED"
]);

export function reportGraphqlError(error: { originalError?: Error | null; extensions?: Record<string, unknown> }, sanitizedCode: unknown) {
  // Parse/validation errors have no resolver originalError. Known domain errors
  // have already been classified by the existing client-safe error sanitizer.
  if (!error.originalError || expectedCodes.has(String(sanitizedCode))) return;
  const pgCode = (error.originalError as Error & { code?: string }).code;
  if (pgCode && (/^(22|23)/.test(pgCode) || pgCode === "42501" || pgCode === "P0001")) return;
  captureUnexpectedError(error.originalError);
}

export const reportExpressError: ErrorRequestHandler = (error: unknown, _req, _res, next) => {
  const status = (error as { status?: number } | null)?.status;
  if (!status || status >= 500) captureUnexpectedError(error);
  next(error); // Preserve Express error handling and existing logging.
};