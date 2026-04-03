import type { AuthSession, LoginInput } from "./types";

const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";

function getBackendBaseUrl() {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  try {
    return new URL(graphqlUrl).origin;
  } catch {
    return "http://localhost:5050";
  }
}

const backendBaseUrl = getBackendBaseUrl();

function normalizeAuthSession(payload: Partial<AuthSession> | null | undefined): AuthSession {
  return {
    authenticated: Boolean(payload?.authenticated),
    account: payload?.account ?? null,
    role: payload?.role ?? "anonymous",
    expiresAt: payload?.expiresAt ?? null
  };
}

async function authRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => null)) as
    | (Partial<AuthSession> & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Something went wrong. Please try again.");
  }

  return normalizeAuthSession(payload);
}

export function getCurrentSession() {
  return authRequest("/auth/session", {
    method: "GET"
  });
}

export function login(input: LoginInput) {
  return authRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function logout() {
  return authRequest("/auth/logout", {
    method: "POST"
  });
}
