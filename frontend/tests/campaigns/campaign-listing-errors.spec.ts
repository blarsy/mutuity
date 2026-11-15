import { CombinedGraphQLErrors } from "@apollo/client/errors";
import {
  AUTHENTICATION_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  getUserFacingGraphQLErrorMessage
} from "../../src/services/graphql/errorMessages";

describe("campaign lifecycle GraphQL feedback", () => {
  it("preserves server-sanitized stale-review feedback with Apollo 4", () => {
    const message = "This submission has changed. Refresh before reviewing it.";
    expect(getUserFacingGraphQLErrorMessage(new CombinedGraphQLErrors({ errors: [{ message }] }))).toBe(message);
  });

  it("prioritizes authentication failures with Apollo 4", () => {
    const error = new CombinedGraphQLErrors({ errors: [
      { message: "Stale review" }, { message: "Session expired", extensions: { code: "UNAUTHENTICATED" } }
    ] });
    expect(getUserFacingGraphQLErrorMessage(error)).toBe(AUTHENTICATION_ERROR_MESSAGE);
  });

  it("retains legacy GraphQL errors without exposing arbitrary client or network error text", () => {
    expect(getUserFacingGraphQLErrorMessage({ graphQLErrors: [{ message: "Stale review" }] })).toBe("Stale review");
    expect(getUserFacingGraphQLErrorMessage(new Error("Private network details"))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getUserFacingGraphQLErrorMessage(new CombinedGraphQLErrors({ errors: [{ message: " " }] }))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getUserFacingGraphQLErrorMessage(null)).toBeNull();
  });
});