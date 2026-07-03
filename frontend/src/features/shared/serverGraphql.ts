import type { IncomingHttpHeaders } from "http";

const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

/**
 * Extracts a language code ("en" | "fr") from request headers, matching the
 * same priority used by the backend's getLanguage(): custom header first,
 * then Accept-Language, defaulting to "en".
 */
export function getLanguageFromHeaders(headers: IncomingHttpHeaders): string {
  // 1. UI‑selected language header sent by the client
  const uiLang = headers["x-selected-language"] as string | undefined;
  if (uiLang) {
    const lang = uiLang.trim().slice(0, 2).toLowerCase();
    if (lang === "fr" || lang === "en") return lang;
  }

  // 2. Accept-Language header
  const acceptLang = headers["accept-language"];
  if (acceptLang) {
    const primary = acceptLang.split(",")[0]?.trim()?.slice(0, 2);
    if (primary?.toLowerCase() === "fr") return "fr";
  }

  // 3. Default
  return "en";
}

export async function fetchServerGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  language?: string,
) {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(language ? { "x-selected-language": language } : {}),
    },
    body: JSON.stringify({ query, variables }),
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