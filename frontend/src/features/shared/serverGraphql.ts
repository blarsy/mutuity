const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function fetchServerGraphql<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GraphqlResponse<T>;

  if (payload.errors?.length) {
    return null;
  }

  return payload.data ?? null;
}