import { CombinedGraphQLErrors } from "@apollo/client/errors";

export function isPasswordResetRequiredError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(({ extensions }) => extensions?.code === "PASSWORD_RESET_REQUIRED");
  }

  return typeof error === "object" && error !== null && "code" in error && error.code === "PASSWORD_RESET_REQUIRED";
}