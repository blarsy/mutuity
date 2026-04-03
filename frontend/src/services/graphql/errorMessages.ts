export const AUTHENTICATION_ERROR_MESSAGE = "You must sign in to continue.";
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

type GraphQLErrorLike = {
  message: string;
  extensions?: {
    code?: string;
  };
};

type ApolloErrorLike = {
  message?: string;
  graphQLErrors?: GraphQLErrorLike[];
  networkError?: unknown;
};

export function getUserFacingGraphQLErrorMessage(error?: ApolloErrorLike | null) {
  if (!error) {
    return null;
  }

  const graphQLErrors = error.graphQLErrors ?? [];

  const authenticationError = graphQLErrors.find(
    graphQLError => graphQLError.extensions?.code === "UNAUTHENTICATED"
  );

  if (authenticationError) {
    return AUTHENTICATION_ERROR_MESSAGE;
  }

  const graphQLError = graphQLErrors.find(candidate => candidate.message.trim().length > 0);

  if (graphQLError) {
    return graphQLError.message;
  }

  return GENERIC_ERROR_MESSAGE;
}