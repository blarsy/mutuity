import type { Pool } from "pg";
import * as appleSigninAuth from "apple-signin-auth";

import { logWebApiError } from "../logging/operationalLogger.js";
import { verifySocialAuthState } from "./socialState.js";

const RESOLVE_EXTERNAL_IDENTITY_SQL =
  "select * from app_private.resolve_account_for_external_identity($1, $2, $3, $4);";

type ResolveAccountResult = {
  account_id: string | null;
  resolution: "subject_match" | "explicit_link_required" | "no_match";
};

type AppleCallbackInput = {
  pool: Pool;
  code: string;
  state: string;
  stateSecret: string;
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  callbackUrl: string;
  userPayload?: string;
};

type AppleTokenPayload = {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  nonce?: string;
};

export type AppleCallbackResult =
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
      providerEmailVerified: boolean;
    }
  | {
      kind: "error";
      nextDestination: string;
      errorMessage: string;
    };

function parseAppleEmailVerified(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true";
}

function sanitizeApplePrivateKey(value: string) {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function parseAppleUserName(userPayload?: string) {
  if (!userPayload) {
    return "";
  }

  try {
    const parsed = JSON.parse(userPayload) as {
      name?: {
        firstName?: string;
        lastName?: string;
      };
    };

    const firstName = parsed.name?.firstName?.trim() ?? "";
    const lastName = parsed.name?.lastName?.trim() ?? "";
    return `${firstName} ${lastName}`.trim();
  } catch {
    return "";
  }
}

async function exchangeCodeForAppleIdToken(input: {
  code: string;
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  callbackUrl: string;
}) {
  const clientSecret = appleSigninAuth.getClientSecret({
    clientID: input.clientId,
    teamID: input.teamId,
    keyIdentifier: input.keyId,
    privateKey: sanitizeApplePrivateKey(input.privateKey),
    expAfter: 60 * 60
  });

  const tokenResponse = await appleSigninAuth.getAuthorizationToken(input.code, {
    clientID: input.clientId,
    redirectUri: input.callbackUrl,
    clientSecret
  });

  if (!tokenResponse.id_token) {
    throw new Error("Apple token exchange did not return an id_token");
  }

  return tokenResponse.id_token;
}

async function verifyAppleIdToken(input: {
  idToken: string;
  clientId: string;
  expectedNonce?: string;
}) {
  const payload = (await appleSigninAuth.verifyIdToken(input.idToken, {
    audience: input.clientId,
    ignoreExpiration: false,
    nonce: input.expectedNonce
  })) as AppleTokenPayload;

  if (!payload.sub) {
    throw new Error("Apple token subject is missing");
  }

  return {
    providerSubject: payload.sub,
    email: payload.email ?? "",
    emailVerified: parseAppleEmailVerified(payload.email_verified)
  };
}

export async function handleAppleCallback(input: AppleCallbackInput): Promise<AppleCallbackResult> {
  const parsedState = verifySocialAuthState(input.state, input.stateSecret);

  if (!parsedState) {
    return {
      kind: "error",
      nextDestination: "/",
      errorMessage: "Invalid or expired social auth state"
    };
  }

  try {
    const idToken = await exchangeCodeForAppleIdToken({
      code: input.code,
      clientId: input.clientId,
      teamId: input.teamId,
      keyId: input.keyId,
      privateKey: input.privateKey,
      callbackUrl: input.callbackUrl
    });

    const profile = await verifyAppleIdToken({
      idToken,
      clientId: input.clientId,
      expectedNonce: parsedState.nonce
    });

    const profileName = parseAppleUserName(input.userPayload);

    const { rows } = await input.pool.query<ResolveAccountResult>(RESOLVE_EXTERNAL_IDENTITY_SQL, [
      "apple",
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
        name: profileName,
        providerSubject: profile.providerSubject
      };
    }

    if (resolution.resolution === "explicit_link_required") {
      return {
        kind: "link_confirmation_required",
        nextDestination: parsedState.next,
        email: profile.email,
        name: profileName,
        providerSubject: profile.providerSubject,
        providerEmailVerified: profile.emailVerified
      };
    }

    return {
      kind: "register_required",
      nextDestination: parsedState.next,
      email: profile.email,
      name: profileName,
      providerSubject: profile.providerSubject
    };
  } catch (error) {
    await logWebApiError("[auth] Apple callback failed", error, {
      context: "apple_callback"
    });

    return {
      kind: "error",
      nextDestination: parsedState.next,
      errorMessage: "Apple authentication failed"
    };
  }
}
