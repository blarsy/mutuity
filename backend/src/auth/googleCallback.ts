import type { Pool } from "pg";

import { logWebApiError } from "../logging/operationalLogger.js";
import { verifySocialAuthState } from "./socialState.js";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";
const RESOLVE_EXTERNAL_IDENTITY_SQL =
  "select * from app_private.resolve_account_for_external_identity($1, $2, $3, $4);";

type ResolveAccountResult = {
  account_id: string | null;
  resolution: "subject_match" | "explicit_link_required" | "no_match";
};

type GoogleTokenResponse = {
  id_token?: string;
};

type GoogleTokenInfoResponse = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
};

type GoogleCallbackInput = {
  pool: Pool;
  code: string;
  state: string;
  stateSecret: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export type GoogleCallbackResult =
  | {
      kind: "success";
      accountId: string;
      nextDestination: string;
      email: string;
      name: string;
      providerSubject: string;
    }
  | {
      kind: "register_required";
      nextDestination: string;
      email: string;
      name: string;
      providerSubject: string;
    }
  | {
      kind: "link_confirmation_required";
      nextDestination: string;
      email: string;
      name: string;
      providerSubject: string;
    }
  | {
      kind: "error";
      nextDestination: string;
      errorMessage: string;
    };

function parseGoogleEmailVerified(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true";
}

async function exchangeCodeForIdToken(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}) {
  const body = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.callbackUrl,
    grant_type: "authorization_code"
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Google authorization code");
  }

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!payload.id_token) {
    throw new Error("Google token exchange did not return an id_token");
  }

  return payload.id_token;
}

async function verifyGoogleIdToken(idToken: string, expectedAudience: string) {
  const tokenInfoUrl = new URL(GOOGLE_TOKEN_INFO_ENDPOINT);
  tokenInfoUrl.searchParams.set("id_token", idToken);

  const response = await fetch(tokenInfoUrl.toString());
  if (!response.ok) {
    throw new Error("Google token verification failed");
  }

  const payload = (await response.json()) as GoogleTokenInfoResponse;

  if (payload.aud !== expectedAudience) {
    throw new Error("Google token audience mismatch");
  }

  if (!payload.sub) {
    throw new Error("Google token subject is missing");
  }

  return {
    providerSubject: payload.sub,
    email: payload.email ?? "",
    emailVerified: parseGoogleEmailVerified(payload.email_verified),
    name: payload.name ?? ""
  };
}

export async function handleGoogleCallback(input: GoogleCallbackInput): Promise<GoogleCallbackResult> {
  const parsedState = verifySocialAuthState(input.state, input.stateSecret);

  if (!parsedState) {
    return {
      kind: "error",
      nextDestination: "/",
      errorMessage: "Invalid or expired social auth state"
    };
  }

  try {
    const idToken = await exchangeCodeForIdToken({
      code: input.code,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      callbackUrl: input.callbackUrl
    });

    const profile = await verifyGoogleIdToken(idToken, input.clientId);
    const { rows } = await input.pool.query<ResolveAccountResult>(RESOLVE_EXTERNAL_IDENTITY_SQL, [
      "google",
      profile.providerSubject,
      profile.email,
      profile.emailVerified
    ]);

    const resolution = rows[0] ?? { account_id: null, resolution: "no_match" as const };
    if (resolution.resolution === "subject_match" && resolution.account_id) {
      return {
        kind: "success",
        accountId: resolution.account_id,
        nextDestination: parsedState.next,
        email: profile.email,
        name: profile.name,
        providerSubject: profile.providerSubject
      };
    }

    if (resolution.resolution === "explicit_link_required") {
      return {
        kind: "link_confirmation_required",
        nextDestination: parsedState.next,
        email: profile.email,
        name: profile.name,
        providerSubject: profile.providerSubject
      };
    }

    return {
      kind: "register_required",
      nextDestination: parsedState.next,
      email: profile.email,
      name: profile.name,
      providerSubject: profile.providerSubject
    };
  } catch (error) {
    await logWebApiError("[auth] Google callback failed", error, {
      context: "google_callback"
    });

    return {
      kind: "error",
      nextDestination: parsedState.next,
      errorMessage: "Google authentication failed"
    };
  }
}
